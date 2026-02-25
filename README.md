# VibeNVR Telemetry Dashboard (Cloudflare Worker)

Questo modulo gestisce l'ingestione della telemetria anonima di VibeNVR e genera automaticamente un'elegante Dashboard Pubblica, senza esporre dati sensibili o IP degli utenti.

## Funzionalità
1. **Ingestione Sicura**: il backend chiama `GET /telemetry.png` inviando dati di sistema di base (nessun IP, nessuna pwd). La nazione viene dedotta tramite gli header di Cloudflare e non salvata testualmente ma aggregata.
2. **Dashboard Integrazione**: Una Dashboard scura (Dark Mode) con `Chart.js` disponibile alla rotta `/dashboard`.
3. **API Privata (Worker-to-CF)**: Il Worker fa da proxy per i dati, chiamando le API di Analytics Engine autenticandosi da dietro le quinte tramite *Worker Secrets*, quindi le chiavi non arrivano mai al browser utente.

## Come testare e fare il deploy

1. Entra nella cartella: `cd cloudflare-telemetry`
2. Installa le dipendenze: `npm install`
3. Esegui il deploy sul tuo account Cloudflare: `npx wrangler deploy`

## Configurazione della Sicurezza (obbligatorio per la Dashboard)

Affinchè la pagina `/dashboard` mostri i grafici, devi abilitare il worker a leggere i suoi stessi dati su Analytics Engine inserendo Account ID e API Token. **Queste chiavi vanno caricate come SECRETS e non hard-coded nel file.**

1. Dal pannello Cloudflare, vai sul tuo Profilo (in alto a destra) > **API Tokens** e crea un token con permessi **Account > Analytics > Read**.
2. Estrai il tuo **Account ID** (reperibile dalla dashboard laterale di qualsiasi tuo dominio).
3. Dalla console del tuo PC, nella cartella `cloudflare-telemetry` lancia:

```bash
npx wrangler secret put ACCOUNT_ID
# Incolla il tuo Account ID e premi invio

npx wrangler secret put API_TOKEN
# Incolla il Token API creato e premi invio
```

Una volta configurati i secret, apri `https://tuo-worker.workers.dev/dashboard` e vedrai le statistiche reali!

## Agganciare il Worker a VibeNVR

Nei file di configurazione (`docker-compose.yml` / `docker-compose.prod.yml`), imposta la nuova variabile per la produzione o sviluppo:

```env
CLOUDFLARE_TELEMETRY_URL=https://tuo-worker-nome.<tuo-username>.workers.dev/telemetry.png
```

Se non impostato, il backend farà fallback automaticamente sul vecchio Scarf Pixel.
