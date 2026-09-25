# Persistent Flightpath demo

The standalone presenter environment runs outside Launchpad seat lifecycle in
the `network-operations-demo` namespace on Flightpath. It contains the web
story, investigation API, and private MCP diagnostics service.

- Workspace: `/`
- Presentation: `/story/`
- Readiness: `/ready`
- Live proof API: `POST /api/investigate`
- Route: `network-operations-demo-network-operations-demo.apps.flightpath.fm2aihpcsed.com`

Deploy the immutable one-seat-certified image with an explicit Flightpath
kubeconfig:

```bash
KUBECONFIG=/absolute/path/to/flightpath.kubeconfig \
  oc create namespace network-operations-demo

KUBECONFIG=/absolute/path/to/flightpath.kubeconfig \
  helm upgrade --install network-operations-demo chart \
  --namespace network-operations-demo \
  --values deploy/flightpath-demo-values.yaml \
  --wait --timeout=5m
```

The optional model client is intentionally disabled. The two evidence-backed
investigations are live and deterministic without model wording. If a model is
later enabled, create a dedicated namespace-local Secret through the approved
Flightpath credential process and set `model.existingSecret`; never reuse a
Launchpad seat key.

The Flightpath wildcard Route currently presents a certificate chain that is
not trusted by the local system CA. Do not bypass browser TLS warnings for an
external presentation. Use an approved trusted Route certificate or an
authenticated internal access path before audience delivery.
