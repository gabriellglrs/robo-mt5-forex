---
phase: 08
slug: motor-de-estados-fimathe
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-16
---

# Phase 08 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest |
| **Config file** | none - direct test invocation |
| **Quick run command** | `python -m py_compile src/analysis/fimathe_state_engine.py src/analysis/signals.py src/main.py` |
| **Full suite command** | `pytest tests/test_fimathe_state_engine.py tests/test_fimathe_cycle.py -q` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `python -m py_compile src/analysis/fimathe_state_engine.py src/analysis/signals.py src/main.py`
- **After every plan wave:** Run `pytest tests/test_fimathe_state_engine.py tests/test_fimathe_cycle.py -q`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | FIM-001..FIM-004 | T-08-01 / low | State transitions deterministic for context/trend/projection gates | unit | `pytest tests/test_fimathe_state_engine.py -q` | no | pending |
| 08-01-02 | 01 | 1 | FIM-005..FIM-008 | T-08-02 / low | Blocking reasons map to correct rule metadata | unit | `pytest tests/test_fimathe_state_engine.py -q` | no | pending |
| 08-02-01 | 02 | 2 | Runtime compatibility | T-08-03 / medium | Payload contract remains compatible with runtime consumer | integration | `python tests/verify_signals.py` | yes | pending |

Status legend: pending / green / red / flaky

---

## Wave 0 Requirements

- Existing infrastructure covers this phase.
- New file expected in wave 1: `tests/test_fimathe_state_engine.py`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Runtime event readability in dashboard | FIM-014 support continuity | UI/runtime rendering not fully covered by unit tests | Run robot in paper mode and inspect `logs/fimathe_runtime.json` for state/rule continuity |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or explicit manual fallback
- [ ] Sampling continuity respected across both waves
- [ ] No watch-mode flags in commands
- [ ] Feedback latency below 30s for quick checks
- [ ] `nyquist_compliant: true` set after execution pass

**Approval:** pending
