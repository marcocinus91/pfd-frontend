# Piano di implementazione — Redesign Mobile FinTrack (v2)

Piano operativo per portare `pfd-frontend` allo stato descritto in [MOBILE_DESIGN.md](MOBILE_DESIGN.md), senza rompere il layout desktop esistente (sidebar 240px, tabelle, dialog custom, KPI grid, grafici DOM).

> **v2**: revisione critica della v1. La modifica principale è l'eliminazione del nuovo breakpoint a 599px (causava una regressione nella fascia 600–768px) — vedi §0.

---

## 0. Decisioni architetturali

| Tema | Decisione |
|---|---|
| **Grafici dashboard** | Migrare da DOM/CSS custom a **ngx-charts** (`bar-vertical-2d` raggruppato + `pie-chart [doughnut]`), sia desktop che mobile. **Preceduta da uno spike di validazione** (§5.0) per via della versione `alpha` del pacchetto. |
| **Form transazione su mobile** | **Bottom sheet custom** (pannello CSS ancorato in basso, drag-handle, radius `26px 26px 0 0`, focus trap + ESC), nessuna dipendenza Angular Material nuova. Riusa lo stesso form (`form` signal, `saveTransaction`, ecc.) tramite un componente condiviso. Il dialog desktop (`.scrim`/`.dialog`) resta invariato. |
| **Breakpoint** | **Un solo breakpoint, 768px — quello già esistente**. Sotto i 768px: shell mobile (app bar compatta + bottom nav con label) + redesign completo dei contenuti (balance hero, chip, lista raggruppata, FAB, bottom sheet). Da 768px in su: tutto invariato (sidebar, KPI grid, tabella, dialog). |

### Perché non 599px (correzione rispetto alla v1)
Oggi sotto i 768px la sidebar **collassa già** in layout orizzontale + bottom nav. Spostare lo switch a 599px avrebbe fatto **ricomparire la sidebar verticale 240px** nella fascia 600–768px — una regressione (meno spazio utile di oggi su tablet/landscape phone), non un miglioramento. Tenere 768px:
- è zero-rischio per lo shell (nessuna modifica alla logica di collasso esistente);
- è anche **più aderente allo spirito dello spec** ("tablet mantiene la bottom nav") rispetto all'opzione 599px, perché estende il trattamento mobile fino a 768px invece di restringerlo a 600px.

---

## 1. Strategia anti-collisione

- **Markup mobile-only** → `@if (isMobile())`; **markup desktop-only** → `@if (!isMobile())`. Signal condiviso, non duplicato per componente (vedi §2.2).
- **Markup condiviso** (form transazione, riga transazione) → componenti standalone dedicati, riusati da entrambi i layout — niente duplicazione di logica/HTML.
- **CSS**: tutte le nuove regole mobile vivono dentro l'esistente `@media (max-width: 768px)` in `styles.scss`, oppure sono usate solo da template `@if (isMobile())`. Nessuna classe desktop esistente (`.cards-grid`, `.mtable`, `.dialog`, `.sidebar`, `.filters`...) viene rinominata o modificata nel suo comportamento ≥768px.
- **ngx-charts** è l'unica modifica che tocca *anche* il desktop: isolata in fase propria, preceduta da spike (§5.0).

---

## 2. Fondamenta condivise (prerequisiti, prima di tutto il resto)

### 2.1 Costanti categorie condivise
Creare `src/app/shared/constants/categories.ts`:
```ts
export const CATEGORY_LABELS: Record<string, string> = { food: 'Cibo', transport: 'Trasporti', ... };
export const CATEGORY_ICONS: Record<string, string> = { food: 'restaurant', ... };
export const CATEGORY_COLORS: Record<string, string> = { food: 'var(--cat-food)', ... };
export function getCategoryColor(cat: string): string { return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['other']; }
```
- `dashboard.component.ts` e `transactions.component.ts` **rimuovono** le proprie copie locali (`CATEGORY_LABELS`, `CATEGORY_ICONS`, `getCategoryColor`) e importano da qui. Nessun cambio di comportamento, solo deduplica — propedeutico a `TransactionRowComponent` (§4.4) e ai grafici ngx-charts (§5).

### 2.2 `ResponsiveService`
Nuovo `src/app/core/services/responsive.service.ts`:
```ts
@Injectable({ providedIn: 'root' })
export class ResponsiveService {
  private bp = inject(BreakpointObserver);
  isMobile = toSignal(
    this.bp.observe('(max-width: 768px)').pipe(map(r => r.matches)),
    { initialValue: false }
  );
}
```
- Iniettato da `LayoutComponent`, `DashboardComponent`, `TransactionsComponent`, eventualmente `ProfileComponent`.
- **Allineato 1:1 con la media query CSS esistente** (`max-width: 768px`) — niente disallineamenti tra logica TS e stile.

### 2.3 Nuovi token CSS (`src/styles.scss`, `:root`)
Senza toccare i token esistenti:
```scss
--radius-hero: 22px;
--radius-fab: 27px;
--radius-chip-pill: 18px;
--shadow-elevated: 0 6px 18px rgba(16,24,40,.10), 0 2px 6px rgba(16,24,40,.06); // diverso da --shadow-2 esistente, non lo sovrascrive
--hero-gradient: linear-gradient(145deg, #1a1a2e 0%, #1f2747 48%, var(--primary) 132%);
--hero-income: #8ff0a3;
--hero-expense: #ff9d9d;
--hero-label: #b9c1e0;

/* Altezza bottom nav — unica fonte di verità per .main padding-bottom e FAB offset */
--bottom-nav-height: 76px;
```
`--bg` attuale (`#f4f5f7`) vs spec (`#f1f3f6`): differenza trascurabile, **non modificare**.

---

## 3. Fase 1 — Shell mobile (`LayoutComponent`)

File: `src/app/shared/components/layout/layout.component.{ts,html,scss}`

1. Iniettare `ResponsiveService`, esporre `isMobile = responsive.isMobile`.
2. `@if (!isMobile())`: sidebar attuale **invariata**.
3. `@if (isMobile())`:
   - **App bar compatta** (~52px, sfondo `--bg`): logo gradiente + "FinTrack" + icona notifiche.
     - L'icona notifiche **non ha sorgente dati**: renderla statica/decorativa (nessun badge dinamico) finché non esiste un endpoint, per non promettere una funzionalità inesistente.
   - **Bottom nav ridisegnata**: 3 voci **con label** (Dashboard / Transazioni / Profilo), icona 24px + label 11px/600, voce attiva = `--primary` + `FILL 1`. Tutte `routerLink` (`/dashboard`, `/transactions`, `/profile`).
   - Altezza bottom nav = `var(--bottom-nav-height)` (76px), `.main { padding-bottom: var(--bottom-nav-height) }`.
4. **Rimuovere** `.mobile-profile-pop`/`.mobile-profile-backdrop` e i metodi `toggleMobileProfile()`/`closeMobileProfile()`/`logoutFromMobileProfile()` — sostituiti dalla route `/profile` (Fase 2). Prima di rimuovere, grep su `isMobileProfileOpen`/`toggleMobileProfile`/`mobile-profile-*` per assicurarsi che non ci siano altri riferimenti.
5. Tutte le nuove classi CSS dentro l'esistente `@media (max-width: 768px)` in `styles.scss`.

**Collisione check**: nessuna modifica al markup/CSS della sidebar `≥768px`.

---

## 4. Fase 2 — Routing e pagina Profilo

### 4.1 Routing (pattern obbligato)
Creare `src/app/features/profile/profile.routes.ts` **esattamente come** `dashboard.routes.ts`/`transactions.routes.ts`:
```ts
export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent) },
    ],
  },
];
```
In `app.routes.ts`, aggiungere come sibling di `dashboard`/`transactions`:
```ts
{ path: 'profile', loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES), canActivate: [authGuard] }
```

### 4.2 Header profilo
Avatar 78px (iniziali, `--hero-gradient`), nome/email da `authService.currentUser()` (stessa fonte già usata in `LayoutComponent`).

### 4.3 Gruppi impostazioni

| Gruppo | Voci | Stato |
|---|---|---|
| 1 | Dati personali, Categorie, Notifiche | **Stub esplicito**: chevron presente ma `(click)` no-op + badge "Prossimamente" — non esiste backend per queste funzioni, evitare falsi affordance. |
| 2 | Esporta dati (CSV) | **Implementabile subito**: CSV client-side da `store.entities()` (Blob + download), nessuna nuova API. |
| 2 | Aiuto e supporto | Stub. |
| 3 | Logout (rosso) | Riusa `authService.logout()` + redirect `/auth/login`, stessa logica oggi in `LayoutComponent.logout()`. |

### 4.4 Componente riga transazione condiviso
Estrarre `TransactionRowComponent` standalone (`@Input() transaction: Transaction`) usando le costanti di §2.1 — riusato da:
- Lista mobile "Ultime transazioni" (Dashboard, §5.4)
- Lista mobile transazioni raggruppata (Transazioni, §6.3)

---

## 5. Fase 3 — Dashboard

File: `src/app/features/dashboard/dashboard/dashboard.component.{ts,html,scss}`

### 5.0 Spike ngx-charts (da fare PRIMA di committarsi alla migrazione)
- Prototipo isolato: rendering di `ngx-charts-bar-vertical-2d` e `ngx-charts-pie-chart [doughnut]="true"` con dati statici, dentro `.chart-card` esistente.
- Verificare con Angular 19 standalone:
  - compatibilità del pacchetto `@swimlane/ngx-charts@24.0.0-alpha.1` (build, peer deps, eventuali errori a runtime);
  - dimensionamento responsive: `[view]` esplicito + `ResizeObserver`/`HostListener('window:resize')` sul container, oppure verificare se l'auto-size (`view` non impostato) funziona dentro un grid CSS.
- **Esito A (ok)** → procedere con §5.1.
- **Esito B (problemi bloccanti con l'alpha)** → fallback: mantenere i grafici DOM custom attuali, applicare solo le modifiche di stile/colore/dimensioni richieste dallo spec (schema colori entrate/uscite, altezza ~150px, mapping categorie). Il resto del piano (balance hero, lista, filtri, bottom sheet) **non dipende** da questa scelta e procede comunque.

### 5.1 Migrazione grafici (se Esito A)
- **Bar chart mensile**: `getByMonthEntries()` → `[{name:'Mar', series:[{name:'Entrate', value}, {name:'Uscite', value}]}, ...]`, `colorScheme: { domain: ['#4caf50','#f44336'] }`.
- **Donut categorie**: `getByCategoryEntries()` → `[{name: label, value}]`, colori da `CATEGORY_COLORS` (§2.1). Legenda HTML custom esistente mantenuta a fianco del grafico SVG.
- **Test desktop obbligatorio**: confronto visivo `charts-grid` prima/dopo (altezza `.chart-card`, allineamenti).

### 5.2 Balance hero (`@if (isMobile())`)
- Card `.balance-hero` (`--hero-gradient`, `--radius-hero`, `--shadow-elevated`):
  - Label "Saldo totale" + `account_balance_wallet`.
  - Valore `summary().balance` — 34px/700, tabular-nums.
  - Delta "+X% rispetto al mese precedente": **non calcolabile in modo affidabile** dallo store attuale (manca un valore "saldo mese precedente" esplicito) → **omettere in questa iterazione**, annotare come follow-up (§9).
  - Split entrate/uscite da `summary().totalIncome`/`totalExpenses`.
- `@if (!isMobile())`: KPI cards grid attuale **invariata**.

### 5.3 Mini-row transazioni (`@if (isMobile())`)
Card slim: icona `receipt_long`, "Transazioni / questo mese", conteggio = transazioni del mese corrente da `store.entities()`.

### 5.4 Lista "Ultime transazioni"
- `@if (isMobile())`: `<app-transaction-row>` (§4.4) per le ultime 5.
- `@if (!isMobile())`: tabella attuale **invariata**.

### 5.5 Stati UI
Skeleton/empty/error compatti per mobile (hero skeleton, mini-row skeleton, 1 chart placeholder, 2 righe lista) come da spec §5.

---

## 6. Fase 4 — Transazioni

File: `src/app/features/transactions/transactions/transactions.component.{ts,html,scss}`

### 6.1 Search (mobile)
`@if (isMobile())`: campo full-width legato a `searchText` — **già filtrato in `filteredTransactions()`** (riga 72 esistente), nessuna modifica alla logica.

### 6.2 Filtri a chip (mobile)
- `@if (isMobile())`: riga scrollabile orizzontale di chip (Mese/Categoria/Tipo) che leggono/scrivono gli **stessi signal esistenti** `filterMonth`/`filterCategory`/`filterType` (select nativo stilizzato come chip o mini-popover).
- `@if (!isMobile())`: `.filters` attuale **invariata**.

### 6.3 Lista raggruppata per data (mobile)
- Nuovo `computed groupedByDate()` su `filteredTransactions()`, label "Oggi · D mese" / "D mese" (locale `it-IT`).
- `@if (isMobile())`: gruppi + `<app-transaction-row>` (§4.4), tap → `openEditModal(tx)`.
- `@if (!isMobile())`: `<table class="mtable">` attuale **invariata**.

### 6.4 FAB "Aggiungi" (mobile)
`@if (isMobile())`: bottone esteso flottante, `bottom: calc(var(--bottom-nav-height) + 12px)`, `--primary`, `add` + "Aggiungi" → `openAddModal()`.
`@if (!isMobile())`: bottone header attuale **invariato**.

### 6.5 Form transazione condiviso
Estrarre `TransactionFormComponent` standalone (non `<ng-template>`, per encapsulation pulita): riceve `[form]`/`(fieldChange)`/`(typeChange)`/`formError`, riusa `setType`/`updateForm` esistenti. Usato da:
- `.dialog` desktop (invariato come contenitore)
- bottom sheet mobile (§6.6)

### 6.6 Bottom sheet (mobile)
- `@if (isMobile() && showModal())`: pannello `.bottom-sheet` (`fixed`, `border-radius: 26px 26px 0 0`, drag-handle, slide-up; `prefers-reduced-motion` → niente transizione) contenente `<app-transaction-form>` + CTA full-width "Salva transazione".
- **Accessibilità**: `role="dialog" aria-modal="true"`, focus trap (`@angular/cdk/a11y` `CdkTrapFocus`, già disponibile via CDK), chiusura su `ESC` e tap su scrim.
- `@if (!isMobile() && showModal())`: `.scrim`/`.dialog` attuale **invariato**, stesso `<app-transaction-form>`.
- `saveTransaction()`/`closeModal()`/validazione **invariati**.

### 6.7 Stati UI
Skeleton lista (5-7 righe), empty (`receipt_long`), error (`error`) in stile lista per mobile.

---

## 7. Checklist verifica anti-collisione con desktop

| Area | Rischio | Mitigazione |
|---|---|---|
| Breakpoint | Nessuno: 768px invariato | Verificare comunque a 767px/768px/769px che lo switch shell sia identico a oggi. |
| ngx-charts | Stile/dimensioni SVG diverse su desktop | Spike preliminare (§5.0) + confronto visivo `charts-grid` desktop prima/dopo + fallback definito. |
| Rimozione popup mobile profilo | Riferimenti residui a `isMobileProfileOpen`/`toggleMobileProfile` | Grep prima della rimozione (§3.4). |
| Costanti categorie centralizzate | Refactor tocca 2 componenti esistenti | Solo spostamento di costanti identiche, nessun cambio di valori — verificare con diff che `CATEGORY_LABELS`/`ICONS`/colori siano identici tra le due copie prima di unificare. |
| `TransactionRowComponent`/`TransactionFormComponent` | Nuovi componenti usati in più punti | Usati solo dentro `@if (isMobile())` (row) o come contenitore neutro riusato da entrambi i layout (form) — nessun impatto su markup `≥768px` esistente. |
| Nuovi token CSS | Collisione con `:root` esistenti | Nomi nuovi e distinti (`--radius-hero`, `--shadow-elevated`, `--hero-*`, `--bottom-nav-height`), nessun token esistente sovrascritto. |
| Bottom nav height | `.main` padding-bottom e FAB offset disallineati | Entrambi derivano da `--bottom-nav-height` (§2.3). |

---

## 8. Ordine di implementazione consigliato (PR incrementali)

1. **Fondamenta** (§2): costanti categorie condivise (refactor non visivo) + `ResponsiveService` + nuovi token CSS. Nessun cambio visivo atteso.
2. **Shell mobile** (§3): app bar compatta, bottom nav con label, rimozione popup profilo, route `/profile` (stub).
3. **Pagina Profilo** completa (§4).
4. **Spike + eventuale migrazione ngx-charts** (§5.0–5.1) — PR isolata con esito A/B esplicito.
5. **Dashboard mobile**: balance hero, mini-row, lista ultime transazioni + `TransactionRowComponent` (§5.2–5.5).
6. **Transazioni mobile**: search, chip filtri, lista raggruppata, FAB, `TransactionFormComponent` + bottom sheet (§6).

---

## 9. Note tecniche residue / follow-up

- **Delta % saldo** (5.2): rimandato — richiede dato "saldo mese precedente" non presente in `Summary`.
- **Export CSV**: utility client-side, in `core/services` o nel componente Profilo.
- **QA matrix manuale** (per ogni fase con impatto UI): testare a **320px, 375px, 414px, 767px, 768px, 1024px, 1440px** — in particolare il confine 767/768px per verificare zero regressioni desktop.
- **Hit target ≥44×44px**: chip, righe lista, FAB, voci bottom nav.
- **`prefers-reduced-motion`**: bottom sheet + eventuali transizioni bottom nav.
