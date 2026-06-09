import { signalStore, withState, withMethods, withComputed } from '@ngrx/signals';
import { withEntities, setAllEntities, addEntity, updateEntity, removeEntity } from '@ngrx/signals/entities';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { patchState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { TransactionsService, Transaction, Summary } from '../core/services/transactions.service';

type TransactionsState = {
  isLoading: boolean;
  error: string | null;
  summary: Summary | null;
};

const initialState: TransactionsState = {
  isLoading: false,
  error: null,
  summary: null,
};

export const TransactionsStore = signalStore(
  { providedIn: 'root' },
  withEntities<Transaction>(),
  withState(initialState),
  withComputed(({ entities }) => ({
    totalCount: computed(() => entities().length),
  })),
  withMethods((store, transactionsService = inject(TransactionsService)) => ({
    loadAll: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          transactionsService.getAll().pipe(
            tapResponse({
              next: (transactions) => {
                patchState(store, setAllEntities(transactions));
                patchState(store, { isLoading: false });
              },
              error: () => patchState(store, { isLoading: false, error: 'Errore nel caricamento' }),
            }),
          ),
        ),
      ),
    ),

    loadSummary: rxMethod<void>(
      pipe(
        switchMap(() =>
          transactionsService.getSummary().pipe(
            tapResponse({
              next: (summary) => patchState(store, { summary }),
              error: () => patchState(store, { error: 'Errore nel caricamento del summary' }),
            }),
          ),
        ),
      ),
    ),

    addTransaction: rxMethod<Parameters<TransactionsService['create']>[0]>(
      pipe(
        switchMap((dto) =>
          transactionsService.create(dto).pipe(
            tapResponse({
              next: (transaction) => patchState(store, addEntity(transaction)),
              error: () => patchState(store, { error: 'Errore nella creazione' }),
            }),
          ),
        ),
      ),
    ),

    updateTransaction: rxMethod<{ id: string; dto: Partial<Parameters<TransactionsService['create']>[0]> }>(
      pipe(
        switchMap(({ id, dto }) =>
          transactionsService.update(id, dto).pipe(
            tapResponse({
              next: (transaction) =>
                patchState(store, updateEntity({ id, changes: transaction })),
              error: () => patchState(store, { error: 'Errore nella modifica' }),
            }),
          ),
        ),
      ),
    ),

    deleteTransaction: rxMethod<string>(
      pipe(
        switchMap((id) =>
          transactionsService.remove(id).pipe(
            tapResponse({
              next: () => patchState(store, removeEntity(id)),
              error: () => patchState(store, { error: 'Errore nella eliminazione' }),
            }),
          ),
        ),
      ),
    ),
  })),
);