# Investigate Network Alarms with an Evidence-Backed Agent

Explore a synthetic telco timing incident, compare current diagnostics with historical context, and recommend a human-reviewed next step.

Network operations teams need to distinguish current observations from past incidents before attributing an alarm to a platform or hardware fault. This quickstart candidate teaches that decision using two contrasting synthetic scenarios. India Mobile Congress (IMC) is an audience profile, not a vendor dependency.

**Status:** container-packaged fixture proof, not an orderable quickstart or deployed lab. No live MCP connection, model inference, vector RAG, or remediation exists yet.

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

The local runner assembles an evidence ledger with identifiers and provenance. Fixture providers are replaceable behind bounded interfaces; the approved-tool adapter is not itself an MCP transport. Historical excerpts are labeled context, never live telemetry. The two scenarios point to different hypotheses.

### Architecture diagrams

![Synthetic alarm feeds read-only diagnostics and historical context into an evidence ledger and human-reviewed recommendation](docs/images/architecture.svg)

See the [architecture and event flow](docs/architecture.md), [lab contract](contracts/lab-contract.yaml), and [proof and onboarding gates](docs/proof-and-onboarding.md). The network data is vendor-neutral. Red Hat OpenShift and Intel hardware are reference integration boundaries, not claims of tested acceleration. Ericsson systems and branding are outside this implementation.

## Requirements

### Minimum hardware requirements

For the fixture proof: a computer able to run Python and a loopback service. Cluster sizing and concurrency remain unmeasured.

### Minimum software requirements

Python 3.10 or newer. The local application uses only the Python standard library.
Building the optional image requires Podman or an equivalent container builder.

### Required user permissions

Permission to run a local process bound to loopback. No cluster-scoped or remediation permissions are required.

## Deploy

### Prerequisites

Use a local checkout of this directory. Do not provide credentials: fixture mode never calls an external service.

### Installation

Run `make test-unit`, then `make run-local`. Open `http://127.0.0.1:8080`, choose either scenario, and select **Investigate**. For a terminal run, use `PYTHONPATH=src python3 -m network_ops ptp-hardware` or `ptp-platform`.
`make build-container` builds the fixture-only UBI Python image; no registry push or cluster deployment is implied.

### Validating the deployment

`make test-all` runs local behavior and HTTP checks. `/health` reports `synthetic_local_proof`, not model or MCP connectivity. Confirm distinct hypotheses and `action_executed: false`.

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
