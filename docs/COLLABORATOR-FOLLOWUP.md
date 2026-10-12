# Map collaborator follow-up

Recorded 2026-10-12. Documentation only: no fixes applied and no artifact replaced.

## Exact baseline

- Repository: https://github.com/Bitcoin-Bill/map
- Implementation PR: https://github.com/Bitcoin-Bill/map/pull/2 (merged with owner authorization).
- Reviewed source: `1218dceaf17c8024ef030e45c4e882fe76462dee`.
- Merge commit: `bedc0f43e03f41658ecc2bde6d3627a85c559950`.
- EntropyLab foundation: `289975672a7355a9376313a1a593252e67e1dcef`.
- Review ZIP SHA-256: `3416ae3ef33f1d29b41e1e923d890073cf6fa5155b7c815d94672eff6783406b`.
- HTML SHA-256: `874b473e329c0adfe99ed35446b34b3af8dc1ffc5b4fac230e012381cb49e7d5`.

These reports apply to this snapshot only. New changes require a new artifact hash and
focused re-review; do not relabel the old ZIP or HTML as a patched build.

## Evidence received

- [Kimi review](reviews/KIMI-MAP-REVIEW.md): PASS for the custom-artifact route;
  independently reproduced the exact HTML from a fresh pinned upstream checkout,
  checked unchanged source inputs, ran compatibility/negative probes and targeted
  Chromium UI checks. Six P3 findings remain open.
- [Updated Codex acceptance](reviews/CODEX-MAP-ACCEPTANCE.md): CONDITIONAL PASS;
  live Mac Chrome and Firefox questionnaire/UI checks; Chrome backup/open, Heir
  progress, interruption, cleanup and keyboard checks. No demonstrated defect in
  those trials. Safari and Codex's own clean rebuild were incomplete.
- [Initial Codex report](reviews/CODEX-MAP-ACCEPTANCE-INITIAL.md): historical limited
  inspection, superseded for current acceptance status by the updated report.

Reports are preserved as supplied. Kimi's internal review date says 2026-10-13;
this record received it on 2026-10-12. Its reference to draft PR #2 describes the
review snapshot; that PR has since merged. Both external reviewers used Node 20
for their reported test runs; that does not establish Node 24 validation. Existing
project CI uses Node 24 and passed for the implementation PR.

Kimi's independent rebuild closes the independent-reproduction evidence gap for
this snapshot, although Codex did not rebuild on the Mac. Neither report is a
security certification. Journal-enabled GUI behavior still relies on the original
project QA evidence, not an independent rerun by either reviewer.

## Open implementation work

All six items are Kimi's P3 findings; no fix is included in this documentation PR.
Claim an item in a linked PR and report the before/after behavior and test evidence.

- [ ] MAP-01 — Layout: `map/map-native.js` `el()` drops inline style attributes.
  Use host-compatible classes or a narrowly justified implementation compatible
  with the unchanged CSP. Verify the quorum M/N row and affected layouts at narrow
  and desktop widths. Do not blindly enable arbitrary style attributes.
- [ ] MAP-02 — Unused export guard: `prepareExportPlan` is never called. Decide
  whether to enforce synthetic-plan rejection at the export boundary or remove
  dead code with rationale. Test the chosen boundary and ordinary exports without
  adding any shipping test mode or weakening validation.
- [ ] MAP-03 — Dead test-mode plumbing: remove unused constants/extra argument to
  `checkOpenBoundary` while preserving synthetic-file rejection. Verify rejection
  and confirm the distributed HTML contains no enabled test/debug hooks.
- [ ] MAP-04 — Journal-lock data loss: the unlocked-to-locked observer clears all
  Map work, including a separately authored guide. Design and review provenance
  handling before changing it: distinguish independent, Journal-loaded and
  Journal-linked work; consider pending imports/exports and later Journal changes.
  Preserve immediate clearing of Journal-derived data on lock and global cleanup
  on End session/pagehide. Do not delay host locking behind a confirmation dialog.
  Verify independent unsaved-work behavior and all Journal-linked lock paths in a
  separate Journal-enabled QA build. Until fixed, back up Map before locking Journal.
- [ ] MAP-05 — Duplicate pagehide cleanup: native and add-on handlers can leave an
  empty card after cleanup. Consolidate lifecycle ownership without retaining plan
  data. Verify pagehide, actual back/forward navigation, persisted pageshow and host
  End session, including invalidation of pending work.
- [ ] MAP-06 — Stale export UI: guard the final save-button re-enable across session
  changes. Verify interrupted export cannot download, update stale UI, or change a
  new session's controls; verify ordinary success/failure restores usable controls.

## Remaining acceptance work

- [ ] TEST-01 — Safari hands-on acceptance: disclosure, Map tab, all questionnaire
  controls, encrypted backup/open, wrong password, Heir masking/notes/checks,
  conceal/resume and End session. Manual testing is acceptable; changing system
  WebDriver settings is not a prerequisite. Record browser/OS and exact artifact.
- [ ] TEST-02 — Real five-minute idle expiry and resume, with invented unsaved data;
  distinguish concealment from destructive session cleanup. Verify activity resets
  the idle timer. Record timing and outcome.
- [ ] TEST-03 — Accessibility: full Tab/Shift-Tab order, visible focus, labels,
  keyboard-only forms and screen-reader tab/panel behavior. Existing Home/End/arrow
  results do not establish full accessibility acceptance.
- [ ] TEST-04 — Independent Journal-enabled GUI: upload Map backup using the host
  Notepad loader; select/load/store Map pages; preserve ordinary notes; verify
  multiple-page behavior, encrypted notepad re-export and lock transitions. Keep
  QA-only hooks out of the public artifact. Download journal entries and Download
  notepad remain separate exports.
- [ ] TEST-05 — Follow-up build validation: use declared Node 24+, run documented
  build/test/verify and build:map commands, check unchanged upstream inputs, run
  focused regression tests for the changed items and record a new HTML hash.

Broader malformed-file fuzzing, browser/OS residue investigation and feature-by-feature
Heir parity with the desktop edition have not been established; scope them separately
if pursued. Never claim tests prove secure erasure.

## Contribution boundaries

Map is an optional native tab in a custom EntropyLab HTML build. Preserve existing
upstream source, engine, notebook format and hidden-Journal release policy. No new
network/storage paths, plaintext Map exports or Linux environment gates.

Official adoption is a separate coordination task: propose a supported registration
point to maintainers if authorized. The current DOM-bound add-on does not establish
an official plugin API or readiness for unconditional upstream adoption.

Keep follow-up changes small and link MAP/TEST IDs in each PR. Include artifact/source
identity, invented fixtures, exact tests and remaining limits. Request re-review of
behavioral fixes before merge. The owner decides merges; this tracker does not
approve deployments or upstream changes. Desktop vault-folio work is outside scope.

## Kimi follow-up completed; next implementation review

[Kimi's final follow-up](reviews/KIMI-MAP-FOLLOWUP.md), received 2026-10-12,
supersedes the interim reconciliation note. It confirms matching artifacts and no
conflicting review claims. Its internal 2026-10-13 date is preserved as supplied.

MAP-04 proposal: track session origin. Journal-derived sessions clear immediately
on Journal lock; independent sessions conceal and retain work. Storing an independent
Map into Journal does not reclassify it; Journal-derived sessions never demote.
End session, pagehide and persisted pageshow still clear both origins. The proposal
is not implemented or validated by this documentation merge. The report's security
assessment remains a design claim pending implementation review and regression tests.

Implement MAP-05 lifecycle consolidation with or before MAP-04, and use MAP-06's
epoch guard for save-button restoration. Cover all nine regression cases in the
follow-up, including asynchronous operations and the separate Journal-enabled QA build.
Keep MAP-01/02/03 independently reviewable. All six findings remain open.

Next: prepare focused patch PRs for Kimi's review, record Node 24+ validation and
new artifact hashes, then perform affected browser acceptance/user testing.
The current frozen build may be tested with invented data; it does not contain
these proposed fixes. TEST-01 through TEST-05 remain open. Kimi cannot independently
close Safari or Node 24 runtime validation in the environment stated in the report.
