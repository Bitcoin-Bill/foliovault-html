# Map security fixes — review candidate

2026-10-12. Baseline: `8ccc9fc6b37a6d4982b23eea1aa24c9f73c5ed80`.
AI implementation/review assistance: OpenAI Codex.
Status: local, unmerged candidate for independent Kimi review; no upstream changes.

## Findings addressed

- F-01: separate in-memory edit revision from session epoch. An export clears dirty
  only when its captured revision is current. Newer edits keep their warning;
  navigation/lock/end-session epoch guards retain their existing meaning.
- F-02: null-prototype aggregation dictionaries and own-property lookup of record
  schemas. Validate known timelock text and amendment arrays before rendering.
  Ordinary custom strings, including prototype-property names, remain accepted.
- F-03: shared aggregate record/node/text budgets on imports and accepted edits.
  A rejected edit rolls back to the last accepted normalized snapshot; a microtask
  redraw replaces stale row closures after the current event finishes. Existing
  per-array/depth limits remain. Text inputs have the shared field length cap.
  The rollback snapshot is RAM-only and is cleared with the current session.
- F-04: enumerate upstream inputs from the pinned commit rather than git's index;
  include manifest/favicon, reject staged changes, check both build substitutions,
  compare actual Journal modules to compatibility fixtures, and verify before
  publishing the output. No existing host source is edited.
- F-05: dedicated integrated CI job, pinned/lockfiled test-only Playwright, two
  builds, public artifact verification, input-tamper regressions, public browser
  security tests, and a separately built Journal QA run. Upload only the tested
  public candidate and build identity/checksums. No website deployment.

## Regression evidence

Before source fixes, new F-01 session assertion failed because newer edits became
clean; F-02/F-03 tests failed on prototype-label rendering, invalid nested text and
missing aggregate limits; F-04 accepted a modified manifest; F-05 lacked the
integration job. The bundle's evidence folder preserves those results.

Passing local commands: `npm run build`, `npm test`, `npm run verify`, and
`MAP_HOST=... PLAYWRIGHT_MODULE=... CHROMIUM_BINARY=... npm run test:integration`.
The integration command covers `verify:map`, two byte-identical public builds,
actual encrypted snapshot/edit race with test-only delayed WebCrypto, encrypted
malformed-label import, inert HTML payload, aggregate edit rollback/import reject,
existing navigation and separate Journal lock/load/edit GUI regressions.
Node 24.19.0; Playwright 1.62.1; Chromium 153.0.8010.0. Exact source commit and
artifact hashes are in the bundle's BUILD-RECORD.txt and public/MAP-BUILD.json.
GitHub-hosted CI has not run: no branch was pushed during this task.

## Review focus

1. F-01: editing during export for both origins; failed export and session changes.
2. F-02: all custom lookup paths and rendered known nested fields; retain inert text.
3. F-03: limits, defaults, import rejection before adoption, all authoring paths
   (including repeaters/presets/notes), and rollback snapshot cleanup. Verify that
   rejected edits do not leave stale closures or false saved state. Assess the
   intentional compatibility limit for formerly accepted very large guides.
4. F-04: completeness of pinned host inputs and index-tamper failure; no accepted
   output copied before post-build comparison. Local installed dependencies are
   still a build trust boundary; the lockfile/CI installs do not certify them.
5. F-05: workflow/runner coverage and public-versus-QA separation. CI uploads are
   candidates, not an automatic release or merge. Confirm check names for future
   branch-protection configuration; this task did not change repository settings.

The audit's broader adoption notes (license agreement, translation catalogs,
complete accessibility, supported plugin API) are not claimed resolved by these
five fixes. Actual Safari/VoiceOver, real bfcache and other Issue #7 acceptance
remain open. Cryptographic algorithms, Journal format, wallet tools, host source
and global cleanup policy are unchanged. No guarantee of memory erasure.

Return one report with PASS / CHANGES REQUIRED per F-ID, exact reviewed commit/hash,
commands actually run, and blocked checks. Do not merge or publish audit details.
