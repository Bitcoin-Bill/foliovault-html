# Kimi — Map follow-up: reconciliation & MAP-04 design

2026-10-13 · Review and design only: no implementation, no repeated full audit, no pushes,
merges, deployment, or maintainer contact.
Reference: PR #2 snapshot `1218dce` (merged, `bedc0f43`); documentation PR #3 commit
`1046c6a224b912ac5e19a278308b8317b34c40e3`; EntropyLab foundation `28997567…`.
This note supersedes my interim KIMI-MAP-RECONCILIATION.md (same content, plus the
retain-vs-change analysis requested in the assignment).

## 1. Reconciliation with Codex's Mac browser results

**Same artifact — confirmed.** Codex's ZIP `3416ae3e…3406b` and HTML `874b473e…9e7d5`
match the copies I hold (re-hashed today) and the artifact I reproduced byte-for-byte from
the pinned checkout. Both reviews cover one snapshot; the tracker's rule that any patch
means a new hash and focused re-review is endorsed.

**No conflicting claims found.** Codex's live Chrome/Firefox results — tab install,
questionnaire traversal, Home/End/arrow tab keyboarding, encrypted backup/open with the
exact wrong-password error string, Heir masking and progress backup, import/export
interruption with no late download, blur/pagehide/persisted-pageshow behavior, no HTTP(S),
no Map data in browser storage — are all consistent with my code audit and Linux Chromium
checks. Two results actively **cross-validate** my static findings: the interruption trial
confirms the async epoch guards, and the keyboard sweep confirms the tab-rotation glue.

**Verdict difference is scope, not disagreement.** Codex's CONDITIONAL PASS conditions
were Safari acceptance and an independent clean rebuild. My byte-identical rebuild closes
the second; Safari (TEST-01) remains open. Shared caveat: both of us ran tests on Node 20
against a declared Node ≥24 engine — green, but not Node-24 validation; follow-up builds
need TEST-05 on the declared runtime.

**Independently tested vs supplied evidence.** Reviewer-established: artifact identity
(both), reproducible build and crypto/boundary probes (me), live Mac browser acceptance
(Codex), live lifecycle/keyboard/no-network checks (both, different platforms). Still
supplied project evidence, not independently rerun: upstream `test:ci` (2,227), the
Journal-enabled QA-build GUI flows (TEST-04), bundled screenshots/logs, Safari, real
five-minute idle (TEST-02), accessibility audit (TEST-03).

**Acceptance gaps remaining:** TEST-01…05 as listed in the tracker; nothing new emerged
from the cross-read, and none of my six P3 findings (MAP-01…06) is contradicted.

## 2. MAP-04 — smallest safe design

**Problem.** `map-addon.js:55-59`: any Journal unlocked→locked transition runs
`lockJournalFolio()` → full `clearFolioSession()`, destroying even Map work that never
touched the Journal.

**Proposed policy — one session field, `S.origin`, conservative default:**

- `independent` (default): created in Map, opened from an encrypted file, or legacy-v1
  import. Set on those entry paths.
- `journal`: content entered the session **from** the Journal — successful
  `journalBridge.read()` load, or `adoptJournalFolio(guide)` with non-null guide. Never
  demoted within the session; edits on top of journal-loaded content stay journal-derived.
- Storing Map → Journal (`bridge.store`) does **not** reclassify: the Journal's copy is
  protected by the Journal's own lock; the authoring session originated outside it.

**On unlocked→locked:**

| `S.origin` | Behavior |
|---|---|
| `journal` | Immediate full clear — today's exact behavior, kept. The lock's concealment semantics are preserved absolutely. |
| `independent` | Conceal, don't clear: `concealNativeFolio()` plus a status note ("Journal locked — Map work untouched; download an encrypted copy to keep it"). The bridge already reports unavailable while locked, so no Journal interaction is possible. |

Global cleanup is untouched: pagehide, persisted pageshow, and host End session wipe
**everything regardless of origin**, and host locking is never delayed behind any dialog.

**Pending operations.** A lock-triggered clear bumps `sessionEpoch`, so late
decrypt/export results are discarded (kept for `journal` origin). An in-flight export from
an `independent` session may legitimately finish and download after the lock — the work is
independent — with MAP-06's `sessionCurrent` re-enable guard applying unchanged. Bridge
read/store are synchronous; no Journal operation can straddle a lock.

**Why change rather than retain wipe-all.** Retaining is simpler and maximally
conservative, and is an acceptable *interim* (the tracker's "back up Map before locking
Journal" workaround covers it). But the security delta of the proposal is nil for what the
lock actually protects: journal-derived material still dies instantly, and independent
material is concealed from screen the moment the lock fires — the same visible end state
as today. What changes is only that unsaved, never-Journal work survives in memory. That
matters because the current behavior trains users to avoid locking (or to make hurried
plaintext backups) to protect their work — a worse real-world outcome. The proposal also
adds no new retained state beyond one enum and no new code path to the wipe chain itself.
If maintainers judge even that too much pre-adoption, retain wipe-all and document; the
policy above can land with the host-integration work later.

**Residual, document-only:** edits made *in the Journal* to a stored Map page do not flow
back into a live Map session (true today, unchanged); one doc line suffices.

## 3. Regression cases (for the implementing PR)

1. Independent plan + lock → intact, concealed, resume restores identical state.
2. Journal-loaded plan + lock → wiped; home rendered; no field residue.
3. `adoptJournalFolio(guide)` + lock → wiped.
4. Independent + `bridge.store()` + lock → intact (store does not reclassify).
5. Journal-loaded then edited + lock → wiped (no demotion).
6. In-flight independent export crossing a lock → completes/downloads, controls usable;
   in-flight decrypt resolving after a `journal`-origin wipe → discarded, no late UI.
7. Lock → unlock → load a changed Journal Map page → fresh read, no stale reuse.
8. End session / pagehide / bfcache wipe both origins (guards against the new branch
   weakening global cleanup).
9. Cases 1–6 rerun in the Journal-enabled QA build with real lock controls; QA hooks stay
   out of the public artifact; new artifact hash recorded.

**MAP-05/MAP-06 interactions.** MAP-05's lifecycle consolidation should land with or
before MAP-04: the new conceal-but-keep branch makes a single owner for session clearing
(`clearFolioSession` in map-native; add-on owns only tab/panel UI) the difference between
one fix and two diverging ones — and it removes the empty-card-after-pagehide wrinkle as a
side effect. MAP-06 is orthogonal but adjacent: epoch-guard the save-button re-enable;
under MAP-04, post-lock re-enable becomes a *legitimate* outcome, so the guard (not a
blanket disable) is the right shape. MAP-01/02/03 do not interact.

## 4. Blockers

None for design. For acceptance: TEST-01 (Safari, manual acceptable), TEST-02 (real
five-minute idle), TEST-03 (accessibility), TEST-04 (independent Journal-enabled GUI),
TEST-05 (Node 24+ follow-up build with new hash + focused re-review). My environment has
neither Safari/macOS nor Node 24, so I can re-review code and Linux-browser behavior for
the patch PRs, but cannot close TEST-01 or the runtime half of TEST-05 from here.

No security certification is given or implied; browser memory erasure remains best-effort.
