# Viverst

Three sites in one repository: the group site and its subsidiaries.

| Site | Domain | Folder |
|---|---|---|
| Viverst Global Limited | viverst.com | `apps/main` |
| Viverst Agro | agro.viverst.com | `apps/agro` |
| Viverst Studio | studio.viverst.com | not yet built |

## Run it

```bash
npm install        # once, at the root — workspaces link everything

npm run dev:main   # http://localhost:5173
npm run dev:agro   # http://localhost:5174
```

## Check it

```bash
npm run lint                      # oxlint across the workspace
node verify.mjs                   # 29 regression checks
npm run test -w @viverst/main     # routes, interactions, accessibility
npm run test -w @viverst/agro
```

## Build it

```bash
npm run build -w @viverst/main
npm run build -w @viverst/agro

# one self-contained file for review, no server needed
npm run build:singlefile -w @viverst/agro
```

## Where things live

- `packages/brand` — colours, fonts and every logo and image, per site
- `packages/ui` — shared components, no motion library
- `apps/*/src/data` — all copy for that site, in one file

**Read `HANDOVER.md` before changing anything.** It records the brand rules,
the decisions already settled, and the bugs the audit exists to prevent.
