# Titanes Dominó — Android 1.0.3 closed-test release gate

Reason: Google Play test app uses bundled Capacitor assets and still runs an older `loadMe()` with `SELECT *`, which fails after the production PIN hash SELECT grant was removed. Web deployment is already corrected.

1. Keep app ID `com.titanesdomino.app`; do not change signing identity or uninstall user app.
2. On a machine with Android SDK, Java, Node and repository's existing Android native project: `npm ci` and `bash scripts/prepare-android-release.sh`. If `android/` is absent, restore native project from the prior signed release or generate and review it with `npx cap add android`; confirm applicationId, SDK and signing config match prior release.
3. In `android/app/build.gradle`, set `versionCode` to at least 4 (strictly greater than current Play versionCode 3), and `versionName` to `1.0.3`. Never commit signing credentials.
4. Verify `www/index.html` and bundled Android assets exclude `select('*')` on member profile; run build and test login, profile, game flow with an authorized tester.
5. Produce **signed release AAB** with the **same upload key** as the existing Google Play listing. Verify signature and package name.
6. Upload AAB to the existing **closed testing track** in Play Console, complete review/rollout, install update through the same testing link, and verify login works. Only then request official production rollout.

Not completed by this branch: native Android build, signed AAB, Google Play upload or on-device smoke tests. No secrets are stored here.
