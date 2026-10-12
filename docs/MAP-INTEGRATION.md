# Map integration contract

## Host source stays unchanged

`map/map-entry.js` imports the unchanged `app.js`, then installs `map-addon.js`.
`build-map.mjs` copies four additive modules and creates a separate additive build
script from the upstream builder. The original build script is never overwritten.
The extra entry uses the same imports, WASM engines, shell, CSS, encryption module,
private-data controls, application self-tests, and package lockfile.

The existing upstream tracked inputs are checked byte-for-byte against the pinned
commit before and after build. No schemas, supported Journal method list, wallet
state, cryptographic algorithms, default export settings, or original navigation
functions are edited. The output is a separately identified custom HTML artifact.

## Optional tool registration

`installMapAddon()` registers a Map tab after the host's runtime tabs exist, which
happens after its original startup checks. Its panel shares the host workspace.
Switching tools restores the original panel/tab state before the host click handler
runs. The module owns only its own state and lifetime. No iframe is used.

For official adoption, import/install these modules through the team's preferred
optional tool registry, keep notebook compatibility tests, and review the DOM slot
contract below. Omit the module to omit the tab. This package does not patch or
submit any change to the official EntropyLab repository or deployment.

## Stable host controls used

- `workspace-tabs`, `workspace-panel`, `[data-workspace]`: optional Map slot.
- Existing `journal.js`: key derivation, notebook serialization/open/export.
- Existing `conceal-on-leave.js`: blur/visibility/idle protection.
- Existing `i18n.js` / host privacy field observers: UI integration.
- `journal-global-download.disabled`: locked/unlocked boundary observation.
- `journal-notes-text`: explicit selected-page exchange, through its normal input event.
- `add-journal-page`: create a separate page before replacing ordinary notes.

There is no access to internal `hodlKeys`, wallet seeds, derived keys, Journal
CryptoKey objects or event-log input values. Map derives its own backup keys via
the imported unchanged Journal function using the user's entered backup password.
A file can also be opened through the Journal if its current password matches.

## Persistence and security boundaries

A Map backup is a standard encrypted notebook whose ordinary text contains a Map
marker plus validated JSON. It is not a new entropy/key entry. Journal encrypted
notepad re-export remains readable by Map, without modifying the host loader.
The Journal's optional blank-password behavior remains unchanged. Map's own backup
requires a 12+ character password; storing a page in an unprotected Journal does
not create access protection. Users must keep the Journal encryption option on.

Journal lock clears Map when the host transitions from unlocked to locked. Host
End session dispatches pagehide; Map clears its fields/state and invalidates pending
work, then the host retires its original modules. This is best-effort erasure.

The currently pinned release hides Journal. No test hooks, hidden-tool activation,
or alternate visibility controller ship in this Map artifact. A separate upstream
QA build made its existing Journal UI accessible for integration testing. Runtime
file compatibility is independent of that navigation policy.

## What to review before official adoption

Notebook limits/validation, marker escaping, import boundaries, selected-page
exchange, no secrets in controls/attributes/logging, asynchronous teardown, tab
focus/aria behavior, and per-engine rendering. The add-on currently binds stable
DOM IDs rather than an upstream plugin API. A future host release needs a checked
foundation update. Complete keyboard parity and Firefox/Safari acceptance remain
review items; do not infer universal host-version compatibility.
