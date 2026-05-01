# Inferiva Firebase Clean Rebuild v4

This package avoids the previous corrupted `workbench-core.html` cache problem by using a new core filename:

`workbench-core-fixed.html`

`workbench.html` loads:

`workbench-core-fixed.html?v=4`

## Replace these files in your deployment

- login.html
- workbench.html
- workbench-core-fixed.html
- workbench-core.html
- firebase-app.js
- diagnostics.html
- admin.html
- setup.html
- firestore.rules
- storage.rules
- firebase.json

## Important

If you still see JavaScript source text in the browser, the old corrupted file is still being served. Delete the old deployed file and redeploy, then hard refresh.

## Demo user profile must contain

`role: Compliance Officer`

Path:

`users/{demoAuthUid}`
