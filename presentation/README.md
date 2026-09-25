# Network Operations demo story

This standalone React/Vite presentation converts the short Evidence-Backed
Network Operations Agent quickstart into a Red Hat × Intel hero's-journey demo.
It does not replace the Showroom quickstart or the separate 90-minute lab.

## Run with live proof

Start the existing quickstart API from the repository root:

```bash
make run-local PYTHON=.venv/bin/python
```

In another terminal:

```bash
npm run presentation:dev
```

The Vite development server proxies `/api` to `http://127.0.0.1:8080`. A
deployed presentation must route `/api/investigate` to the same quickstart
service. If that endpoint is unavailable, the two proof scenes use the
checked-in synthetic fixture and visibly display `REHEARSAL` or `OFFLINE`.

## Validate

```bash
npm run presentation:check
npm --prefix presentation run test:visual
```

The source narrative and evidence classifications are recorded in
`story.brief.yaml`.
