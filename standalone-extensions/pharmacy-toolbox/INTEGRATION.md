# Future tool integration

The 0.1.0 release is a launcher shell. No clinical workflows or migration run.

- Keep the stable manifest key, tool ID, management storage key, updater database and package format.
- Register each future entry in toolbox-core.js explicitly. Do not accept URLs or executable code from a page message.
- Set readiness only when the actual module is included, tested and versioned. Until then launch returns pending.
- Give each module its own extension window when useful; reuse that module's existing window.
- Gate actual operations through assertManaged and the shared busy/update-lock protocol. Add all active work pages to CONFIG.workPages so updates refuse to overwrite a running workflow.
- Defaults stay OFF for barcode-return and controlled-inventory. Preferences are intent only until the corresponding implementation is available.
- Keep the two automated page integrations origin- and path-scoped; turning OFF must remove only this extension's own enhancement.
- Audit and migrate each old module's data separately before recommending uninstall. Version migrations and retain an export/recovery path.
- Do not expose enrollment secrets to content scripts. Current content scripts use a restricted service-worker bridge and local storage is TRUSTED_CONTEXTS only.
- Keep old extensions unchanged during this shell release. Backend adds only ntuh-pharmacy-toolbox with its own full tool scope.

Release: run `node scripts/build-release.mjs`, then `node --test tests/*.test.mjs`.
Commit package, announcement, install ZIP and matching runtime together. Publish catalog only after the asset commit exists.
