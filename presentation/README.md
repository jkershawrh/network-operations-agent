# Network Operations demo story

This React/Vite presentation converts the Evidence-Backed Network Operations
Agent into a Red Hat × Intel hero's-journey story. In a built runtime image it
is served at `/story/` and appears as the *Story* tab beside the live Workspace,
Terminal, OpenShift Console, and Showroom guide.

## Run with live proof

Start the existing quickstart API from the repository root:

```bash
make run-local PYTHON=.venv/bin/python
```

In another terminal:

```bash
npm run presentation:dev
```

The Vite development server proxies `/api` to `http://127.0.0.1:8080`. The
runtime serves the built story and `/api/investigate` from the same origin. If
that endpoint is unavailable, the two proof scenes use the
checked-in synthetic fixture and visibly display `REHEARSAL` or `OFFLINE`.

## Validate

```bash
npm run presentation:check
npm --prefix presentation run test:visual
```

The source narrative and evidence classifications are recorded in
`story.brief.yaml`.
