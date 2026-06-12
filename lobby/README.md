# THE LOBBY — Backend + Database

This version replaces browser `localStorage` with a real backend server and
a SQLite database file, so your tournament data lives on a server instead of
just one browser.

## What changed

- **Before:** all data was saved with `localStorage.setItem(...)` — only
  existed in one browser, on one device.
- **Now:** the frontend talks to a small Node.js server over a simple API,
  and the server stores everything in `thelobby.db` (SQLite).

## Requirements

- Node.js **22.5+** (uses the built-in `node:sqlite` module — no extra
  packages to install).

## Running it

```bash
cd lobby
node server.js
```

Then open **http://localhost:3000** in your browser.

The database file `thelobby.db` will be created automatically in the
`lobby/` folder the first time you run it.

## API

| Method | Endpoint     | Description                                   |
|--------|--------------|------------------------------------------------|
| GET    | `/api/data`  | Returns all data (tournaments, stats)          |
| POST   | `/api/data`  | Replaces all data (body = full JSON object)    |
| DELETE | `/api/data`  | Wipes everything and resets to empty defaults  |

## Notes

- The frontend auto-saves to the server ~300ms after every change (debounced).
- The "Delete All Data" button in Settings now calls the server's `DELETE
  /api/data` endpoint, which clears the SQLite database.
- To deploy online, host this folder on any Node-capable host (Render,
  Railway, a VPS, etc.) and point your domain at it. The SQLite file persists
  on disk between restarts as long as the disk itself is persistent.
- To back up your data, just copy `thelobby.db`.
