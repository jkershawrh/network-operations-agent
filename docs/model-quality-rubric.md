# Optional model review rubric

Run `make test-model PYTHON=.venv/bin/python` only after an endpoint owner
assigns the model URL, model name, and API key through runtime environment
variables. The command prints synthetic drafts and cited evidence IDs, never
the key or endpoint. It checks response shape and citations; a human must
assess whether the wording is actually grounded.

Review both the hardware and platform scenarios. Score each item 0 (fails),
1 (partly), or 2 (clear and correct):

1. Identifies the observed signal supporting the selected hypothesis.
2. Distinguishes current tool observations from retrieved historical precedent.
3. Uses cited IDs accurately and makes no unsupported operational claim.
4. Preserves uncertainty and recommends review, not automatic remediation.

For this small instructional sample, a proposed acceptance gate is at least
7/8 on each case, with item 4 scoring 2/2. This is a planned rubric, not a
measured result or a claim that two examples establish general model quality.
Record the model ID, evaluation date, reviewer, both scores, and any failure
examples. Do not record credentials. Add more synthetic alarm patterns before
making broader model-quality or capacity claims.
