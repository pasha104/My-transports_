# My-transports_ Android APK

This is a starter Android wrapper for the complete website. It is intentionally in the `android-apk` branch and does not change the published website.

## What it does
- Builds an installable debug APK with GitHub Actions.
- Packages the root website HTML/CSS/JS into the app's local assets.
- Enables JavaScript, DOM storage and file selection in WebView.
- Keeps website links within the app when they use local files or GitHub Pages; other web links open externally.

## Build
The workflow `.github/workflows/android-apk.yml` creates `app-debug.apk` as a downloadable Actions artifact.

## Offline limitations to test
Local pages and browser storage are available offline, but remote services, Supabase sync, external JavaScript/CSS libraries and OpenStreetMap tile servers need internet. An offline map requires a properly licensed tile package or offline map dataset and code that reads it; this starter does not yet bundle map tiles. Existing browser storage is not automatically imported from Chrome into the app.

## Next validation steps
1. Confirm all site pages open from local assets.
2. Test creating/editing a vehicle card, re-opening the app and checking persistence.
3. Test import/export and file picker.
4. Test route builder and map with and without internet.
5. Implement a licensed offline map dataset and local-first data migration before calling it fully offline.
