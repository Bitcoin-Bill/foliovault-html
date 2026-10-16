# Map: focused EntropyLab alignment plan

Recorded 2026-10-15. **Planning only; implementation and test execution deferred.**
The owner authorized preparing and pushing this plan, not implementing its proposals,
merging this PR, deploying anything, or submitting an upstream feature PR.

## Purpose and baseline

Improve the existing working Map incrementally. No rebuild from scratch, new file
format, new crypto scheme, or major UI redesign is proposed.

- Planning base: Map main `1214f76ab5313d8ce7e3e169fa5204a2734cffb2`.
- Pinned EntropyLab: `289975672a7355a9376313a1a593252e67e1dcef`.
- Security fixes: merged PR #8; documentation follow-up: merged PR #9.
- README CI clarification is separately proposed in PR #10; this plan does not merge it.
- Outstanding manual acceptance remains in [issue #7](https://github.com/Bitcoin-Bill/map/issues/7).

Source direction: [MrHodlX's reply](https://github.com/OogaBoogaX/entropylab/issues/846#issuecomment-6166926311)
and [our response](https://github.com/OogaBoogaX/entropylab/issues/846#issuecomment-6171932579).
Upstream is in a bug-fix/audit phase. Map stays a separate companion for now.
These are our proposed improvements, not an upstream-approved API or acceptance specification.

## Alignment targets

| Maintainer concern | Current position | Limited next step |
| --- | --- | --- |
| Journal internals are not stable | Native Map imports Journal crypto/notebook functions; the bridge uses host DOM controls | Encapsulate these dependencies without changing their behavior or format |
| Single-file reproducible release | Existing builder verifies pinned inputs; integrated CI checks reproducibility | Preserve these guarantees and extend checks only where adapters change build inputs |
| Secrets excluded by design | No wallet seed/key fields, but free text and optional non-wallet direct credentials exist | Agree on a precise content policy, then add bounded local safeguards |
| No new upstream features yet | Separate repository and custom artifact | Keep work here; revisit upstream only when invited and owner-authorized |

## A1 — Contain the Journal dependency

Propose a small Map-owned adapter for encrypted file operations, separate from the
existing Journal page-exchange bridge. Keep editor/Heir rendering away from Journal
function names and DOM IDs. Reuse existing bridge structure instead of introducing
a generic plugin framework.
Shape the adapter around Map's open/save-encrypted-plan, legacy-import and error
needs, rather than mirroring Journal function signatures one for one. This is a
Map-owned boundary, not an upstream-approved interface.

Preserve unchanged host encryption, notebook framing, password requirements,
legacy encrypted imports, error behavior, epoch cancellation and revision tracking.
Keep Journal-origin lock wiping, independent-session conceal/retention, and absolute
End-session/pagehide cleanup. Missing or unsupported Journal controls must fail
closed for Journal exchange without breaking independent Map backup/open.

An adapter reduces coupling; it does not make private Journal internals stable or
remove the underlying dependency. Do not invent a supported upstream hook. A new
format or host hook would be a separate future design decision.

Acceptance later: encrypted round trips and legacy compatibility, pending-operation
interruption, both session origins, missing/locked Journal, public hidden-Journal
policy, and separate Journal QA workflows. Update builder module lists/source hashes
if files move. Reproducibility means repeated builds of the new source match; a
refactor may legitimately change the HTML hash from the earlier frozen artifact.
Extend module verification and `verify-map.mjs` expectations to the new layout;
retain every existing check at its current strictness, including CSP, no-QA-marker
checks, staged-index rejection and artifact identity. Add coverage; do not loosen checks.

Record old-to-new artifact hashes, each tied to its source state, in the A1 PR
description and provenance output. Append the A1 result to the historical lineage
in `docs/HEIR-NAVIGATION-AND-SAFARI.md` when it lands; never replace earlier records.
The existing public lineage includes `f690b516…` (PR #6 merge `8ccc9fc…`) followed
by `5c7d160f…` (PR #8 merge `79fcaa0…`); record full hashes in the implementation
evidence and append A1's new hash only after building and verifying it.

## A2 — Define and strengthen the guide-only boundary

First produce a short field-policy review, before changing behavior:

- Keep contacts, aliases, location hints, recovery instructions, notes and progress.
- Wallet seed words, private keys, wallet seed passphrases and full xpub values stay
  outside Map's guide scope. Distinguish spending secrets from privacy-sensitive
  wallet configuration; do not describe every excluded value as a spending key.
- Review `accessRecords.directAccess` and its optional guide/Journal/watch-only
  credential mode explicitly. MrHodlX did not provide a final policy for these
  non-wallet credentials. Prefer hints/custodian references for future alignment,
  but removal or conversion requires an owner decision; it is not approved here.
- The password used to open/encrypt Map remains an ephemeral operational input,
  not guide content, and must not be blocked by guide-content screening.

Then propose bounded, entirely local detection of recognizable prohibited material.
Specify supported formats, normalization, false-positive handling and limitations
before implementation. Check all content-entry boundaries: editing/paste, encrypted
import, Journal load/store and export, including Heir notes and any retained unknown
fields. UI-only checks are insufficient. No network checks, telemetry, secret echoes
in errors/logs, or additional persistence. Use invented fixtures only.

Pattern screening cannot detect arbitrary passphrases or deliberately disguised
secrets. Document what is actually enforced; never promise that free text is secret-free.
Keep controls narrow enough that ordinary recovery instructions remain useful.
The detector specification must distinguish meta-references, such as "the seed
words are in the bank vault envelope", from literal seed/key material. Define
the false-positive budget and its test corpus before implementation; ordinary
references to recovery materials must not be rejected simply for naming them.

Compatibility decision required before any stricter policy lands: existing guides
may contain newly disallowed content. Never silently strip values, rewrite original
encrypted files, or offer plaintext migration exports. Specify rejection/recovery
behavior and an explicit, reviewed migration path if needed. Until that decision,
do not remove direct-access fields or change unknown-field preservation.
No previously valid encrypted file may become unreadable without a documented,
usable recovery route. The choice between warn-and-allow, opening while restricting
re-save, or rejection with recovery remains deferred to the A2 decision session.

Preserve value-level round-trip fidelity of untouched unknown fields: each parsed
value must survive decrypt -> load -> re-save -> decrypt unchanged. The detector
may inspect unknown-field content but must not touch or rewrite those fields.
Verify this by structural comparison after a full encrypted round trip, not file
byte comparison. Fresh encryption randomness changes ciphertext, and JSON
serialization may legitimately change key order or whitespace. This requirement
does not decide how A2 handles restricted content or authorize silently dropping it.

Acceptance later: positive and negative invented examples, false positives, nested
and unknown fields, every entry boundary, bounded processing near guide limits,
no sensitive error output, unchanged original backup on rejection, and no lost
accepted edits or dirty-state regressions.

## A3 — Preserve release and review guarantees

Keep a self-contained custom HTML with its own identity; upstream published hashes
authenticate upstream artifacts, not our modified custom build. Preserve the pinned
source checks, unchanged crypto/CSP, license notices, no-runtime-network/storage
rules, and separation of public versus QA artifacts. Do not change upstream files.

Future implementation validation should use Node 24+, the existing build/test/verify
commands, integrated reproducibility and browser suites, and focused new regressions.
Follow the repository's test conventions and inspect upstream AGENTS.md at the pinned
revision before proposing an eventual upstream contribution. Record exact source and
artifact hashes, tool versions, results and blocked checks. CI does not close issue #7.

## Sequence and decisions

1. Review this plan with the owner/Kimi. No runtime work starts from this document alone.
2. When authorized, implement A1 as a behavior-preserving PR and obtain focused review.
3. Settle A2's credential scope, detector coverage and old-file handling in a small
   design update. Implement safeguards only after those choices are approved.
4. Review each behavioral PR with Kimi, run the affected checks, and request the
   owner's merge decision. Keep manual evidence and blocked cases explicit.
5. Revisit upstream integration only after its feature window opens; no adoption,
   release date, official endorsement or security certification is implied.

Status: all A1–A3 implementation work is deferred. This plan changes no application
behavior, encrypted file, existing review bundle, build artifact, or upstream source.
