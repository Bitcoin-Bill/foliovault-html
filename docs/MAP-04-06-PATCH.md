# MAP-04–06 session patch review

Base: `4dc594fc553a35064b4c98a3aeafa5da1bddec79`. This PR is independent
of the MAP-01–03 PR and is proposed code, not merged acceptance.

Implements Kimi's session-origin proposal. Journal-loaded/adopted guides retain
Journal provenance through editing and clear immediately on Journal lock.
Independent guides conceal and survive; storing them into Journal does not change
origin. New-guide and successful file-open replacements start a new independent
session and invalidate pending operations. Unknown origin fails closed on lock.
Global pagehide and persisted-pageshow still clear every origin. The native module
owns the wipe; the add-on restores only host tab UI, avoiding duplicate cleanup.
Export-button restoration and late import errors now respect the captured epoch.

## Evidence

Linux / Node v24.19.0: `npm run build`, `npm test`, `npm run verify`, and
`npm run build:map -- <pinned EntropyLab checkout>` passed. Builder compared all
original tracked upstream source/build/package inputs before and after packaging.
Existing crypto/legacy compatibility tests remain green.

`tests/map-session.cjs` runs in npm test with a deterministic DOM/event harness and
controlled promise completion. It covers independent conceal/resume, Journal read
and adoption wipe, store without reclassification, no demotion on edits, independent
export completing across lock, obsolete export suppression and button guards,
ordinary export failure, late decrypt suppression, fresh Journal reads, global
pagehide/persisted-pageshow for both origins, and new-guide/file replacement origin.
These tests are not a substitute for real host/browser lifecycle acceptance.

`tests/map-session-browser.cjs` ran in Chromium 153.0.8010.0 against a separate
Journal-enabled upstream QA build. Real disclosure, Journal create, Map create/store,
encrypted Map backup, Journal lock, new Journal/Notepad upload, Map load/edit/lock
all ran through GUI controls. Independent authored-and-stored work survived;
Journal-loaded/edited work cleared; synthetic pagehide left a populated blank home.
No page errors or HTTP(S) requests were observed.

Reproduce this optional GUI check with `PLAYWRIGHT_MODULE`, `CHROMIUM_BINARY` and
`MAP_QA_HTML` environment variables, then `node tests/map-session-browser.cjs`.
Generate the QA-only HTML using the additive `scripts/build-with-map.mjs` in the
pinned host checkout with `--test-hooks --out <outside-host-directory>` after
`build:map`. Never distribute that QA HTML as the public artifact.

Shipping HTML SHA-256:
`9ae424c8a68f45612f28c1ef5118823580acb65f90c0eb3ec2c6a7bb2252c1d1`.
Separate QA HTML SHA-256:
`2f3f0d09b2ea5ed94371d5ac9bafb82dd07de2d98d8d287539983a2fb17bb4f6`.

## Kimi review / remaining acceptance

Review the origin transitions, session invalidation, and single-owner cleanup
against docs/reviews/KIMI-MAP-FOLLOWUP.md. All nine requested cases remain the review
checklist: the adoption and deterministic async races are harness-tested, not all
rerun under real GUI timing; real back/forward caching and actual End session need
focused follow-up on the patched build. Safari, five-minute idle and full
accessibility remain open. The browser checks above are implementer evidence;
independent reviewer Journal GUI acceptance is not declared complete.

Node 24 build validation is established for this PR, not a blanket closure of
TEST-05 for a future combined/revised artifact. Kimi re-review and the owner's merge
decision remain required. No host source, crypto engine or notebook format changed.
