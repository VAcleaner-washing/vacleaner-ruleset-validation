# Isolated native Ruleset validation

Synthetic GitHub admission fixtures for `VAcleaner-washing/vacleaner-ruleset-validation` only. This repository contains no VAcleaner application, production credentials, business data, Pages/CNAME/deployment, package dependency or production CI.

The three synthetic check names intentionally match the proposed required contexts. A green fixture is **not** application QA, semantic regression review, independent approval or production acceptance.

`native-probe-mode.txt` selects `full`, `docs-only`, `failed`, `skipped` or `cancel-window`. Every scenario must use a fresh head SHA. Configuration/producer commands validate the exact isolated repository and real runner event; copying these fixtures to the production repository makes their commands fail. This accidental-copy guard is not tamper-proof against an author replacing the fixture itself.

- full: three required checks succeed; synthetic heavy check succeeds.
- docs-only: three required checks succeed; the non-required synthetic heavy check skips. This models native context compatibility, not the real application classifier.
- failed: readiness exits1 while classifier/scope succeed.
- skipped: readiness job deliberately skips; capture native admission instead of calling this fail-closed.
- cancel-window: cancel the isolated Actions run via its UI while readiness prints `CANCEL_WINDOW_OPEN`. If not cancelled within120seconds, readiness fails. No timeout leads to green acceptance.

Missing readiness requires removing its entire producer job on a separate fresh SHA. Workflow-replacement tests require a distinct deliberately modified workflow. Keep one active fixture workflow per scenario: do not add another successful same-name check on a head under test. Do not use shell exit78 as a neutral result. Wrong-App and legitimate same-App neutral checks need separately available capabilities; mark unavailable checks NOT RUN.

Owner setup: initialize main and this synthetic bootstrap **before** activating required checks. Then import/read back the exact approved Solo Owner configuration in this repository only. Preserve the repository and all runs until evidence acceptance. Never run destructive/ref probes against production.
