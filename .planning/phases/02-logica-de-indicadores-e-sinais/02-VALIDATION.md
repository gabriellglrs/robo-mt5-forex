---
phase: 02
slug: logica-de-indicadores-e-sinais
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-16
---

# Phase 02 - Validation Strategy

Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | pytest |
| Config file | none |
| Quick run command | `python -m py_compile src/analysis/indicators.py src/analysis/signals.py src/main.py` |
| Full suite command | `python tests/verify_signals.py` |
| Estimated runtime | ~30 seconds |

## Sampling Rate

- After every task commit: run quick command.
- After plan wave complete: run full command.
- Before `$gsd-verify-work`: full command must be green.
- Max feedback latency: 60 seconds.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | STRAT-02-INDICATORS | static | `python -m py_compile src/analysis/indicators.py` | yes | pending |
| 02-01-02 | 01 | 1 | STRAT-02-SCORING | static | `python -m py_compile src/analysis/signals.py` | yes | pending |
| 02-01-03 | 01 | 1 | STRAT-02-MTF | integration | `python tests/verify_signals.py` | yes | pending |

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

## Manual-Only Verifications

All phase behaviors have automated verification.

## Validation Sign-Off

- [ ] All tasks have automated verification.
- [ ] Sampling continuity is maintained.
- [ ] No watch-mode commands.
- [ ] Feedback latency < 60s.
- [ ] `nyquist_compliant: true` set in frontmatter.

Approval: pending

