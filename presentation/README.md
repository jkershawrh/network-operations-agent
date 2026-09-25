# Network Operations demo story

This React/Vite presentation converts the Evidence-Backed Network Operations
Agent into a Red Hat × Intel hero's-journey story. In a built presenter image it
is served at `/story/` beside the bounded live Network Operations proof.
The separately orderable Launchpad lab is not embedded in this runtime.

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
that endpoint is unavailable, the proof scene uses the checked-in synthetic
fixture and visibly displays `REHEARSAL` or `OFFLINE`.

The presenter story is intentionally limited to 5–7 minutes and seven or fewer
top-level scenes. The architecture act reveals one operator question and one
responsibility boundary at a time. Press `P` to show speaker prompts. At the
finale, stop presenting or follow the single Launchpad link to order the
separate hands-on Network Operations lab.

## Validate

```bash
npm run presentation:check
npm --prefix presentation run test:visual
```

The source narrative and evidence classifications are recorded in
`story.brief.yaml`.

The acceptance criteria and red/amber/green review are in
`../docs/journey-acceptance-matrix.md`.
