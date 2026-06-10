# FinTrack — Specifiche Design Mobile

Documento di handoff per l'implementazione mobile-first della **Personal Finance Dashboard (PFD)** in Angular 17+ / Angular Material (tema Azure/Blue).
Riferimento visivo: `FinTrack Mobile.html` + `mobile.css`.

> **Scopo**: ridisegnare le viste private (Dashboard, Transazioni, Profilo) per il mobile, dove l'attuale layout desktop "schiacciato" non funziona (KPI giganti impilate, tabella in overflow orizzontale, filtri a tutta larghezza, mini-sheet di logout). Questo doc descrive il target.

---

## 1. Principi di redesign

1. **Mobile-first, non desktop ridotto.** I componenti vanno ripensati, non solo rimpiccioliti.
2. **Gerarchia chiara.** Il saldo è il dato n°1: vive in un *balance hero* prominente. Tutto il resto è secondario.
3. **Niente tabelle su mobile.** Le transazioni sono una **lista di righe** raggruppate per data, mai una `<table>` con scroll orizzontale.
4. **Filtri compatti.** Chip scrollabili orizzontalmente, non `mat-form-field` a tutta larghezza impilati.
5. **Azione primaria sempre raggiungibile.** FAB o bottone full-width per "Aggiungi transazione".
6. **Navigazione con bottom nav** a 3 voci, **con etichette** (non solo icone).

---

## 2. Breakpoint

| Nome | Range | Note |
|------|-------|------|
| `mobile` | `< 600px` | Layout descritto in questo doc. Sidebar → bottom nav. |
| `tablet` | `600–1024px` | Bottom nav resta; contenuto può andare a 2 colonne. |
| `desktop` | `≥ 1024px` | Layout esistente con sidebar fissa 240px. |

Usare `BreakpointObserver` (`@angular/cdk/layout`) nel `LayoutComponent` per commutare tra **sidebar desktop** e **bottom nav mobile**.

---

## 3. Design tokens

Definirli come variabili SCSS/CSS globali (es. `styles/_tokens.scss`). Allineati al tema Material Azure.

### Colori — brand & superfici
```scss
$primary:            #0061a4;  // Material Azure
$primary-2:          #2d8fe0;  // gradiente hero
$primary-container:  #d4e3ff;
$on-primary-container:#001d36;

$bg:           #f1f3f6;  // sfondo pagina
$surface:      #ffffff;  // card
$surface-alt:  #f7f9fc;  // riga premuta / hover
$sidebar:      #1a1a2e;  // top hero / chrome scuro

$text:    #1b1c1e;
$text-2:  #44474c;
$text-3:  #74787f;  // caption / placeholder
$outline: #e6e9ee;
$outline-strong: #d3d7dd;
```

### Colori — semantici finanza
```scss
$income:     #2e7d32;  // testo entrate
$income-bar: #4caf50;  // barre/grafici (da brief)
$income-bg:  #e7f6e8;  // chip/sfondo
$expense:     #c62828; // testo uscite
$expense-bar: #f44336; // barre/grafici (da brief)
$expense-bg:  #fdecec;
```

### Colori — categorie (icone & grafici)
```scss
food:          #ef6c00
transport:     #1e88e5
entertainment: #8e24aa
health:        #00897b
shopping:      #d81b60
salary:        #43a047
other:         #6d6f76
```

### Tipografia
- Famiglia: **SF Pro** → stack: `-apple-system, "SF Pro Display", "SF Pro Text", BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- Tutti i valori numerici/valuta: `font-variant-numeric: tabular-nums`.

| Ruolo | Size | Weight | Note |
|-------|------|--------|------|
| Titolo pagina (h1) | 24px | 700 | letter-spacing -0.02em |
| Saldo hero | 34px | 700 | tabular-nums |
| Sezione (h3) | 15px | 700 | |
| Valore riga/lista | 14.5px | 600 | |
| Importo lista | 15px | 700 | tabular-nums, colorato |
| Caption / crumb | 12–13px | 400–500 | colore `$text-3` |

### Spaziatura, raggi, ombre
```scss
$radius-hero:   22px;
$radius-card:   18px;
$radius-field:  12-13px;
$radius-chip:   18px;   // pill
$radius-fab:    27px;

$shadow-1: 0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.07); // card
$shadow-2: 0 6px 18px rgba(16,24,40,.10), 0 2px 6px rgba(16,24,40,.06); // elevata

padding pagina (body): 18px laterali
gap verticale tra sezioni: ~22px
```

### Icone
Material Symbols Outlined. Mapping categoria → icona:
```
food → restaurant · transport → directions_car / local_gas_station
entertainment → movie · health → medical_services
shopping → shopping_bag · salary → payments · other → category
```

---

## 4. Shell mobile (LayoutComponent)

Struttura verticale a tutto schermo:

```
┌─────────────────────────────┐
│ App bar (compatta, ~52px)   │  logo + "FinTrack" + icona notifiche
├─────────────────────────────┤
│                             │
│  <router-outlet>  (scroll)  │  contenuto pagina, padding 18px
│                             │
├─────────────────────────────┤
│ Bottom nav (76px, 3 voci)   │  Dashboard · Transazioni · Profilo
└─────────────────────────────┘
```

- **App bar**: sfondo `$bg` (chiara), NON la barra scura alta dell'attuale mobile. Logo 34px con gradiente azure, titolo 16px/700, icona campanella con badge.
- **Bottom nav**: `$surface`, bordo-top `$outline`, 3 voci. Voce attiva: colore `$primary` + icona `FILL 1`. Ogni voce = icona 24px + label 11px/600.
  - Implementabile con `MatTabNav` o custom; le voci instradano via router (`/dashboard`, `/transactions`, `/profile`).
- Le rotte pubbliche (`/auth/*`) restano **senza** shell.

---

## 5. Pagina: Dashboard

Ordine verticale dei blocchi:

### 5.1 Titolo
`crumb "Generale"` + `h1 "Dashboard"` + sub `"Panoramica · <mese> <anno>"`.

### 5.2 Balance hero (sostituisce le 4 KPI card)
Card `border-radius: 22px`, sfondo **gradiente** `linear-gradient(145deg, #1a1a2e, #1f2747 48%, #0061a4 132%)`, testo bianco.
- Label: `account_balance_wallet` + "Saldo totale" (12.5px, `#b9c1e0`).
- Valore: **34px/700**, tabular-nums (es. `€ 1.599,30`).
- Delta: `trending_up` + "+18,9% rispetto a <mese prec.>" (verde chiaro `#9fe6b0`).
- **Split entrate/uscite**: due riquadri affiancati (`rgba(255,255,255,.10)`, radius 14px):
  - Entrate: `south_west` + label, valore in `#8ff0a3`.
  - Uscite: `north_east` + label, valore in `#ff9d9d`.

> Mapping dati `Summary`: `balance` → valore hero; `totalIncome` → split entrate; `totalExpenses` → split uscite.

### 5.3 Mini-row transazioni
Card slim bianca: icona viola `receipt_long` + "Transazioni / questo mese · N in entrata" + conteggio grande a destra. (Conteggio = lunghezza lista transazioni del mese.)

### 5.4 Card "Andamento mensile" (bar chart)
- Header sezione + legenda (Entrate verde / Uscite rosso).
- **ngx-charts** `bar-vertical-2d` (raggruppato) sugli **ultimi 4 mesi** da `Summary.byMonth`.
- Schema colori: entrate `#4caf50`, uscite `#f44336`. Altezza ~150px. Etichette asse X = mesi abbreviati (Mar, Apr, Mag, Giu).

### 5.5 Card "Spese per categoria" (donut)
- **ngx-charts** `advanced-pie-chart` o `pie-chart` con `doughnut: true`, da `Summary.byCategory`.
- Diametro ~116px, valore totale spese al centro.
- Legenda a destra: dot colore categoria + nome + percentuale.

### 5.6 Lista "Ultime transazioni"
- Header sezione + link "Vedi tutte →" (naviga a `/transactions`).
- Card lista con le ultime **5** righe (vedi §6.4 per la riga).

### Stati UI (obbligatori)
- **loading**: skeleton per hero (blocco), mini-row, 1 chart placeholder, 2 righe lista.
- **empty**: card centrata, icona `savings`, "Nessun dato da mostrare" + CTA "Aggiungi transazione".
- **error**: card centrata, icona `cloud_off`, messaggio + bottone "Riprova".

---

## 6. Pagina: Transazioni

### 6.1 Titolo
`crumb "Generale"` + `h1 "Transazioni"` + sub `"Gestisci entrate e uscite"`.

### 6.2 Search
Campo unico full-width, radius 13px, icona `search` + input "Cerca descrizione…". (Filtro testuale sullo store.)

### 6.3 Filtri a chip (NON mat-form-field impilati)
Riga **scrollabile orizzontalmente** di chip pill (height 36px, radius 18px):
- `[Giugno 2026 ▾]` (mese/anno) — stato attivo = sfondo `$primary-container`.
- `[Categoria ▾]`
- `[Tipo ▾]`
- `[⚙ Filtri]` (apre bottom sheet con filtri avanzati, opzionale).

Ogni chip apre un menu/`mat-menu` o bottom sheet di selezione. Lo stato attivo (filtro applicato) evidenzia la chip e può mostrare una × per rimuoverlo.

### 6.4 Lista transazioni (sostituisce mat-table)
Raggruppata per data con label di gruppo (`Oggi · 10 giugno`, `9 giugno`, …).
Ogni **riga**:
```
[ icona categoria 42px ]  Descrizione (bold 14.5)        + € 1.600,00  (income, 15/700)
   (sfondo colore cat)    Categoria · <chip Tipo>        ↑ verde / rosso
```
- Icona: quadrato radius 12px, sfondo = colore categoria, glifo bianco.
- Riga 2: dot categoria + nome categoria + chip Tipo (`tag-income`/`tag-expense`).
- Importo a destra: `+`/`−` e colore verde/rosso secondo `type`.
- Tap sulla riga → dettaglio/modifica (apre la bottom sheet in modalità edit).
- `:active` → sfondo `$surface-alt`.

### 6.5 FAB "Aggiungi"
Pulsante esteso flottante in basso a destra (sopra la bottom nav, `bottom: 88px`), `$primary`, icona `add` + label "Aggiungi". Apre la bottom sheet di creazione.

### 6.6 Bottom sheet "Nuova transazione" (sostituisce mat-dialog su mobile)
`MatBottomSheet` con angoli `26px 26px 0 0`, drag-handle in alto. Campi:
- **Tipo**: toggle a 2 opzioni (Uscita / Entrata) — selezione colora il bottone (rosso/verde).
- **Importo**: field con icona `euro`.
- **Categoria** (select) + **Data** (datepicker) su 2 colonne.
- **Descrizione**: field con icona `notes`.
- CTA full-width "Salva transazione" (`$primary`, height 52, radius 26).

### Stati UI
- **loading**: 5–7 righe skeleton nella lista.
- **empty**: icona `receipt_long`, "Nessuna transazione trovata" + CTA.
- **error**: icona `error`, "Errore nel caricamento" + "Riprova".

---

## 7. Pagina: Profilo (sostituisce il mini-sheet di logout)

Schermata completa, non un bottom sheet con solo nome+logout.

### 7.1 Header profilo
Centrato: avatar 78px (iniziale, gradiente), nome (19px/700), email (`$text-3`).

### 7.2 Liste impostazioni (card raggruppate)
Gruppo 1:
- `person` **Dati personali** — "Nome, email, password" → chevron
- `sell` **Categorie** — "Personalizza le categorie" → chevron
- `notifications` **Notifiche** — "Avvisi e promemoria" → chevron

Gruppo 2:
- `download` **Esporta dati** — "Scarica in CSV"
- `help` **Aiuto e supporto**

Gruppo 3 (azione distruttiva):
- `logout` **Logout** — icona/testo in rosso (`$expense`).

Ogni riga: icona in tile `$primary-container` (radius 11px) + titolo/sottotitolo + chevron. `:active` → `$surface-alt`.
Logout → rimuove JWT da localStorage e naviga a `/auth/login`.

---

## 8. Mappatura su Angular / Material

| Elemento design | Implementazione consigliata |
|---|---|
| Shell + bottom nav | `LayoutComponent` standalone + `BreakpointObserver`; bottom nav custom o `MatTabNav` con `routerLink` |
| App bar | `MatToolbar` compatta (colore `$bg`) |
| Balance hero | `MatCard` custom con classe gradiente |
| KPI / mini-row | `MatCard` |
| Bar chart | `ngx-charts` `bar-vertical-2d` |
| Donut | `ngx-charts` `pie-chart [doughnut]="true"` (o `advanced-pie-chart`) |
| Lista transazioni | `*ngFor` su righe custom (NO `MatTable` su mobile) + raggruppamento per data |
| Filtri chip | `MatChipListbox` / chip custom scrollabili + `MatMenu` o `MatBottomSheet` per le opzioni |
| Search | `MatFormField` appearance outline o input custom |
| Aggiungi/Modifica | `MatBottomSheet` su mobile (`MatDialog` resta su desktop) |
| Toggle tipo | due bottoni custom o `MatButtonToggleGroup` |
| Datepicker | `MatDatepicker` |
| Categoria / Mese / Tipo | `MatSelect` |
| Snackbar conferma | `MatSnackBar` |
| Stato store | `NgRx SignalStore` (filtri come signal; lista derivata via `computed`) |

### Note tecniche
- Standalone components: ogni componente importa i moduli Material che usa.
- Lazy loading per feature (dashboard / transactions / profile).
- Interceptor JWT invariato.
- `MatDialog` vs `MatBottomSheet`: scegliere in base al breakpoint (bottom sheet < 600px, dialog ≥ 600px) per la stessa form di transazione.

---

## 9. Formattazione

- **Valuta**: `€ 1.500,00` — formato IT (`it-IT`), `CurrencyPipe: '€' :'symbol' :'1.2-2' :'it-IT'` o `DecimalPipe`. Segno `+`/`−` davanti per le transazioni in lista.
- **Date**: `DD/MM/YYYY` (input/tabelle) e label relative ("Oggi", "<giorno> <mese>") per i gruppi lista; locale `it-IT`.
- Importi sempre `tabular-nums`.

---

## 10. Accessibilità / qualità mobile

- Hit target minimo **44×44px** (nav, chip, righe, FAB).
- Contrasto testo su hero ≥ 4.5:1 (i valori chiari su sfondo scuro rispettano).
- Focus state visibile sugli elementi interattivi.
- `prefers-reduced-motion`: disabilitare transizioni della bottom sheet.
- Scroll orizzontale ammesso **solo** sulla riga chip filtri; mai sul contenuto principale.

---

_Riferimento visivo allegato: `FinTrack Mobile.html`, `mobile.css`. I colori semantici verde/rosso e il tema Azure derivano dal brief PFD originale._
