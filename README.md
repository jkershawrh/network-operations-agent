# Investigate Network Alarms with an Evidence-Backed Agent

Explore a synthetic telco timing incident, compare current diagnostics with historical context, and recommend a human-reviewed next step.

Network operations teams need to distinguish current observations from past incidents before attributing an alarm to a platform or hardware fault. This quickstart candidate teaches that decision using two contrasting synthetic scenarios. India Mobile Congress (IMC) is an audience profile, not a vendor dependency.

**Status:** container-packaged synthetic proof with working MCP transport, not an orderable quickstart or deployed lab. No live network diagnostics, model inference, vector RAG, or remediation exists yet.

## Table of Contents

- [Overview](#overview)
- [Detailed description](#detailed-description)
- [Requirements](#requirements)
- [Deploy](#deploy)
- [Repository structure](#repository-structure)
- [References](#references)
- [Tags](#tags)

## Overview

The learner investigates a synthetic network alarm, reviews network, platform, and hardware observations, compares approved historical excerpts, and proposes a diagnostic step for human review. Missing or contradictory diagnostics lead to abstention, never automatic resolution.

## Detailed description

The local runner assembles an evidence ledger with identifiers and provenance. Fixture providers are replaceable behind bounded interfaces; an official-SDK MCP server and client now exercise the synthetic diagnostics over Streamable HTTP. Historical excerpts are labeled context, never live telemetry. The two scenarios point to different hypotheses.

### Architecture diagrams

![Synthetic alarm feeds read-only diagnostics and historical context into an evidence ledger and human-reviewed recommendation](docs/images/architecture.svg)

See the [architecture and event flow](docs/architecture.md), [lab contract](contracts/lab-contract.yaml), and [proof and onboarding gates](docs/proof-and-onboarding.md). The network data is vendor-neutral. Red Hat OpenShift and Intel hardware are reference integration boundaries, not claims of tested acceleration. Ericsson systems and branding are outside this implementation.

## Requirements

### Minimum hardware requirements

For the fixture proof: a computer able to run Python and a loopback service. Cluster sizing and concurrency remain unmeasured.

### Minimum software requirements

Python 3.11 or newer. The fixture-only page uses the Python standard library;
MCP mode additionally requires `requirements-mcp.txt`. Building the optional
image requires Podman or an equivalent container builder.

### Required user permissions

Permission to run a local process bound to loopback. No cluster-scoped or remediation permissions are required.

## Deploy

### Prerequisites

Use a local checkout of this directory. Do not provide credentials: fixture mode never calls an external service.

### Installation

Create a virtual environment with Python 3.11 and install
`requirements-mcp.txt`. Run `make test-all PYTHON=.venv/bin/python`, then
`make run-local PYTHON=.venv/bin/python`. Open `http://127.0.0.1:8080`, choose
either scenario, and select **Investigate**. For a terminal-only fixture run,
use `PYTHONPATH=src .venv/bin/python -m network_ops ptp-hardware` or
`ptp-platform`.

To exercise real MCP transport locally, start `make run-mcp PYTHON=.venv/bin/python`
in another terminal, then start the web app with
`NETWORK_OPS_MCP_URL=http://127.0.0.1:8095/mcp make run-local PYTHON=.venv/bin/python`.
The MCP tools still read synthetic fixtures. The MCP server has no user
authentication; keep it on loopback and do not expose it through a public Route.
`make build-container` builds the fixture-only UBI Python image; no registry push or cluster deployment is implied.

### Validating the deployment

`make test-all PYTHON=.venv/bin/python` runs behavior, HTTP, and MCP checks.
`/health` reports `synthetic_local_proof`, not model or MCP connectivity.
Confirm distinct hypotheses and `action_executed: false`.

### Delete

Stop the local process with Ctrl-C. No participant state or secrets are stored.

## Repository structure

- `src/network_ops/`: investigation logic, providers, CLI, and local web service.
- `web/`: learner page for the synthetic proof.
- `data/`: synthetic scenarios and historical excerpts.
- `tests/`: behavior and HTTP checks.
- `contracts/`: proposed lab interface contract.
- `docs/`: architecture and proof gates.
- `Containerfile`: UBI-based packaging for the synthetic proof; not a published image.
- `requirements-mcp.txt`: pinned Python MCP SDK dependency.

## References

- [Proof and Launchpad onboarding plan](docs/proof-and-onboarding.md)
- [Integration decision for later source reuse](docs/architecture.md)

A separate lab catalog item must not reuse the existing 201 item or unrelated RAG lab. David Kypuros's work remains an integration candidate pending source and reuse review.

## Tags

- **Title:** Investigate Network Alarms with an Evidence-Backed Agent
- **Description:** Synthetic telco incident investigation with current diagnostics, historical context, and human review
- **Industry:** Telecommunications
- **Product:** Red Hat OpenShift; Intel hardware as an optional reference integration
- **Use case:** Network operations incident investigation
- **Partner:** Intel (reference integration, not required by fixture mode)
- **Contributor org:** Draft; ownership to be confirmed during intake
