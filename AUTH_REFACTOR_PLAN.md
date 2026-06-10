# Piano implementazione — allineamento FE alle modifiche BE (auth/refresh token)

**Data:** 2026-06-10
**Riferimento:** `FRONTEND_CHANGES.md`

---

## Falle individuate nel piano iniziale e relativi fix

### 🔴 1. Guard rompe l'app dopo 15 minuti

`isLoggedIn()` (`auth.service.ts`) controlla l'`exp` dell'`accessToken`. Con TTL 15 min, dopo 15 min `authGuard` reindirizza a `/auth/login` **prima** che parta qualsiasi richiesta HTTP, quindi l'interceptor di refresh non scatta mai.

**Fix:** ridefinire `isLoggedIn()` come "presenza di `refreshToken`" (non più controllo `exp`). La validità reale viene verificata in modo lazy dalle chiamate API + interceptor. Niente guard/init asincroni.

### 🔴 2. Loop infinito sulla chiamata di refresh

Se `refresh()` passa per `HttpClient` con interceptor globali, la richiesta a `/auth/refresh` viene intercettata di nuovo. Se torna `401` (refresh token scaduto/consumato), si rischia un loop di refresh-su-refresh.

**Fix:** escludere esplicitamente `/auth/refresh` e `/auth/logout` sia dall'attach del Bearer token sia dalla logica di retry-on-401. Un `401` su `/auth/refresh` → logout diretto, nessun retry.

### 🔴 3. Concorrenza: richieste parallele in 401

Più chiamate parallele (es. dashboard) possono ricevere `401` simultaneamente. Con **rotazione** del refresh token, se partono N refresh in parallelo solo il primo ha successo; gli altri usano un token già invalidato → logout indebito.

**Fix:** stato condiviso nell'interceptor (`refreshInProgress$`). La prima richiesta in 401 avvia il refresh; le successive si agganciano allo stesso Observable e attendono il risultato prima di ritentare.

### 🟡 4. Loop dopo retry

Se la richiesta ritentata con il nuovo `accessToken` torna di nuovo `401` (es. permessi, non scadenza), non bisogna tentare un secondo refresh per la stessa richiesta.

**Fix:** flag/contatore "già ritentata una volta" per richiesta.

### 🟡 5. Multi-tab + rotazione refresh token

Con due tab aperte, se entrambe fanno refresh quasi in contemporanea, la seconda usa un refresh token già invalidato dalla prima → logout di una tab valida.

**Fix minimo:** ascoltare l'evento `storage` su `window` — quando una tab aggiorna i token in localStorage, le altre li ricaricano invece di usare la copia stale. Da valutare in base all'uso reale multi-tab dell'app.

### 🟡 6. `minLength(12)` su login è sbagliato

Utenti registrati prima della modifica potrebbero avere password 6-11 caratteri. Se il login richiede `minLength(12)`, questi utenti non possono più fare login lato client anche se il backend accetterebbe la password.

**Fix:** lasciare invariato il login (`minLength(6)` o solo `required`). La validazione "forte" si applica solo in registrazione.

### 🟡 7. Logout: refreshToken mancante e chiamata bloccante

- Se `refreshToken` è già `null`, non chiamare `/auth/logout` con body invalido.
- La chiamata a `/auth/logout` non deve bloccare pulizia locale + redirect: fire-and-forget con `catchError` che ignora l'esito.

### 🟡 8. Storage del refreshToken

**Fix proposto:**
- `accessToken` solo in memoria (signal, non persistito) — riduce finestra di esposizione XSS
- `refreshToken` in localStorage (unica opzione persistente realistica senza cookie httpOnly lato BE)
- Al reload, `accessToken` è perso → prima richiesta autenticata prende 401 → interceptor fa refresh automatico → nuovo accessToken. Nessun bootstrap speciale grazie al fix del punto 1.

### 🟢 9. Validazioni transazioni (minori)

- `amount`: max `9999999.99` (richiesto) + valutare `min > 0` (non richiesto da BE, ma coerente con `type: income/expense`)
- `description`: `maxlength="500"` anche nel template HTML, non solo check JS (UX/contatore caratteri)

---

## Ordine di implementazione

1. **Modello + storage**
   - `AuthResponse`: `token` → `accessToken` + nuovo `refreshToken`
   - `accessToken` in memoria (signal), `refreshToken` in localStorage

2. **`isLoggedIn()` + `authGuard`**
   - Ridefiniti su presenza `refreshToken` (fix #1)

3. **`AuthService.refresh()`**
   - `POST /auth/refresh` con `{ refreshToken }`, aggiorna entrambi i token (rotazione)
   - Esclusione `/auth/refresh` e `/auth/logout` dall'interceptor (fix #2)

4. **`auth.interceptor.ts` — refresh automatico su 401**
   - Deduplicazione refresh concorrenti (fix #3)
   - Retry-once per richiesta (fix #4)
   - Su fallimento refresh (`401`) → logout + redirect `/auth/login`

5. **`AuthService.logout()`**
   - `POST /auth/logout` con `{ refreshToken }`, fire-and-forget
   - Guardia su `refreshToken` nullo (fix #7)
   - Pulizia locale (`accessToken`/`refreshToken`) + redirect sempre eseguiti

6. **Sync multi-tab** (opzionale, da valutare)
   - Listener su evento `storage` per ricaricare i token aggiornati da altre tab (fix #5)

7. **Validazioni form auth**
   - `register.component.ts`: password `minLength(12)` + `maxLength(128)`, `name` `maxLength(100)`
   - `login.component.ts`: invariato (fix #6)

8. **Gestione `429`**
   - Su login/register, `err.status === 429` → messaggio "Troppi tentativi, riprova tra qualche minuto"

9. **Validazioni transazioni**
   - `description`: max 500 caratteri (JS + `maxlength` template)
   - `amount`: max `9999999.99` (+ `min` opzionale)

10. **Verifica DTO**
    - Confermare che i body di register/login/refresh/logout non includano campi extra non previsti dai DTO backend

---

## File coinvolti

- `src/app/core/services/auth.service.ts`
- `src/app/core/interceptors/auth.interceptor.ts`
- `src/app/core/guards/auth.guard.ts`
- `src/app/features/auth/login/login.component.ts` (+ template)
- `src/app/features/auth/register/register.component.ts` (+ template)
- `src/app/features/transactions/transactions/transactions.component.ts` (+ template)
- `src/app/core/services/transactions.service.ts` (verifica DTO, nessuna modifica attesa)
