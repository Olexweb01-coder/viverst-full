# Viverst

Three sites in one repository: the group site and its subsidiaries.

| Site | Domain | Folder |
|---|---|---|
| Viverst Global Limited | viverst.com | `apps/main` |
| Viverst Agro | agro.viverst.com | `apps/agro` |
| Viverst Studio | studio.viverst.com | `apps/studio` |

Each is a separate Vercel project pointing at its own folder in this repo.

## Run it

```bash
npm install          # once, at the root — workspaces link everything

npm run dev:main     # http://localhost:5173
npm run dev:agro     # http://localhost:5174
npm run dev:studio   # http://localhost:5175
```

## Check it

Run all four before pushing. `base.css` and `packages/ui` are shared, so a
change meant for one site can reach the other two.

```bash
npm run lint                      # oxlint across the workspace
node verify.mjs                   # 108 regression checks
npm run test -w @viverst/main     # 13 routes, interactions, accessibility
npm run test -w @viverst/agro     #  6 routes
npm run test -w @viverst/studio   #  7 routes
```

## Build it

```bash
npm run build -w @viverst/main
npm run build -w @viverst/agro
npm run build -w @viverst/studio

# one self-contained file for review, no server needed
npm run build:singlefile -w @viverst/studio
```

## Where things live

- `packages/brand` — colours, fonts and every logo and image, per site
- `packages/ui` — shared components, no motion library
- `apps/*/src/data` — all copy for that site, in one file, including its
  social profile links (`SOCIALS`) and WhatsApp number (`WHATSAPP`). The shop's
  are in `apps/shop/src/lib/config.js`.

## Before changing anything

**Read `HANDOVER.md`.** It records the brand rules, the decisions already
settled, and the bug behind every check in `verify.mjs`.

Two things that catch people out:

- `verify.mjs` reports the number of checks, not a pass rate. If it says
  fewer than 108 total, you are running an older copy.
- Studio's Work page and Agro's Products page carry sample records flagged
  `sample: true` in their data files, and show a notice on screen saying so.
  Remove the flag as real records ship; the notice disappears by itself.
- Careers for the whole group live on viverst.com only (`/careers`). The
  subsidiary sites 301 their old `/careers` URL there via `vercel.json`.