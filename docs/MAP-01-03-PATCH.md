# MAP-01–03 patch review

Base: documentation merge `4dc594fc553a35064b4c98a3aeafa5da1bddec79`.
Changes are proposed, not merged; Kimi review requested before merge.

- MAP-01: replace ignored inline layout declarations with existing host classes;
  quorum uses the host row and threshold-number classes. Keep arbitrary style
  attributes blocked. Other spacing follows host defaults/classes.
- MAP-02: invoke the existing synthetic-plan rejection at the encryption export
  boundary. Ordinary encrypted notebook and legacy import behavior is unchanged.
- MAP-03: remove unused test-mode constants and surplus open-boundary argument.
  Synthetic-open rejection remains enforced; no test mode is introduced.

Validation on Linux, Node v24.19.0: build, test, verify, and build:map passed.
The pinned builder verified all original upstream source/build/package inputs
unchanged. Added synthetic export/open regression assertions; existing crypto
round-trip, tamper, password, size, and legacy-v1 tests passed.
Chromium 153 layout check: real disclosure flow, Map creation, added vault;
quorum controls share one row at 1280 and 390 px, with no page errors.

HTML SHA-256: `05c9c30cac5e57d3bf6ccf76f12423d5ac817a54d82e94b4259ec8106cf5c202`.
The frozen review artifact is unchanged; rebuild this patch to obtain this HTML.
Safari, full accessibility, real idle and independent Journal GUI acceptance
remain open. This targeted check does not close those acceptance tasks.
