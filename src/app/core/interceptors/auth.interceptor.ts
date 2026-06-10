import { 
  HttpInterceptorFn, 
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { 
  catchError, 
  throwError,
  BehaviorSubject,
  Observable,
  filter,
  switchMap,
  take,
} from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshedTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const isAuthEndpoint =
    req.url.includes('/auth/login') || 
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/logout');

  const authReq = addToken(req, authService.getAccessToken());

  return next(authReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthEndpoint) {
        return handle401(authReq, next, authService);
      }
      return throwError(() => error);
    }),
  );
};

function addToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`)})
    : req;
}

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
): Observable<any> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshedTokenSubject.next(null);

    return authService.refresh().pipe(
      switchMap((response) => {
        isRefreshing = false;
        refreshedTokenSubject.next(response.accessToken);
        return retryWithToken(req, next, authService, response.accessToken);
      }),
      catchError((error) => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => error);
      }),
    );
  }

  return refreshedTokenSubject.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((token) => retryWithToken(req, next, authService, token)),
  );
}

function retryWithToken(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  token: string,
): Observable<any> {
  return next(addToken(req, token)).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  )
}