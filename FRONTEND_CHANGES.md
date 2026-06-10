# Backend changes — da allineare nel frontend

**Data:** 2026-06-10

---

## 1. BREAKING — Risposta di `/auth/login` e `/auth/register` cambiata

**Prima:**
```json
{
  "user": { "id": "...", "email": "...", "name": "..." },
  "token": "eyJ..."
}
```

**Ora:**
```json
{
  "user": { "id": "...", "email": "...", "name": "..." },
  "accessToken": "eyJ...",
  "refreshToken": "a1b2c3..."
}
```

- `token` → rinominato in `accessToken`
- nuovo campo `refreshToken` (stringa opaca, da salvare in modo sicuro — es. storage non accessibile da JS se possibile, o comunque non in `localStorage` se evitabile)

---

## 2. Access token ora scade dopo 15 minuti (prima 7 giorni)

`accessToken` (JWT) ha TTL **15 minuti**. Il frontend deve gestire il refresh automatico:

- intercettare le risposte `401 Unauthorized` su chiamate autenticate
- chiamare `POST /auth/refresh` con il `refreshToken` corrente
- se il refresh ha successo, ritentare la richiesta originale con il nuovo `accessToken`
- se il refresh fallisce (`401`), fare logout e reindirizzare al login

---

## 3. Nuovi endpoint

### `POST /auth/refresh`

**Request:**
```json
{ "refreshToken": "a1b2c3..." }
```

**Response (200):**
```json
{
  "user": { "id": "...", "email": "...", "name": "..." },
  "accessToken": "eyJ...",
  "refreshToken": "d4e5f6..."
}
```

⚠️ **Il `refreshToken` ruota ad ogni chiamata** — quello vecchio viene invalidato. Il frontend deve sempre salvare e usare l'ultimo `refreshToken` ricevuto. Se viene usato un `refreshToken` già consumato/scaduto → `401 Unauthorized`.

### `POST /auth/logout`

**Request:**
```json
{ "refreshToken": "a1b2c3..." }
```

**Response:** `204 No Content`

Da chiamare al logout per invalidare la sessione lato server. Il frontend deve comunque cancellare `accessToken`/`refreshToken` localmente in ogni caso.

---

## 4. Rate limiting su `/auth/login` e `/auth/register`

Max **5 richieste al minuto per IP**. Oltre il limite → `429 Too Many Requests`. Da gestire in UI con un messaggio tipo "Troppi tentativi, riprova tra qualche minuto".

---

## 5. Validazioni più stringenti

- **Password registrazione**: minimo **12 caratteri** (prima 6), massimo 128
- **Nome utente**: massimo 100 caratteri
- **Descrizione transazione**: massimo 500 caratteri
- **Importo transazione**: massimo `9999999.99`
- **Campi extra non previsti dal DTO** ora causano `400 Bad Request` (prima venivano ignorati silenziosamente) — verificare che le request non includano campi superflui

---

## Riepilogo azioni frontend

- [ ] Aggiornare il parsing della risposta login/register (`token` → `accessToken` + nuovo `refreshToken`)
- [ ] Salvare `refreshToken` in modo sicuro
- [ ] Implementare interceptor HTTP per refresh automatico su `401`
- [ ] Implementare rotazione: aggiornare sempre `refreshToken` dopo ogni `/auth/refresh`
- [ ] Chiamare `/auth/logout` al logout
- [ ] Aggiornare validazione form password (min 12 caratteri)
- [ ] Gestire `429` su login/register
- [ ] Verificare che le request non inviino campi extra non previsti dai DTO
