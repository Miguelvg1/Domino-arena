# Titanes Dominó — Android 1.0.3 closed-test release gate

Reason: Google Play test app uses bundled Capacitor assets and still runs an older `loadMe()` with `SELECT *`, which fails after the production PIN hash SELECT grant was removed. Web deployment is already corrected.

1. Keep app ID `com.titanesdomino.app`; do not change signing identity or uninstall user app.
2. On a machine with Android SDK, Java and Node, install dependencies with `npm install --ignore-scripts --no-package-lock --no-audit --no-fund` (a reproducible lockfile is not yet committed), then run `bash scripts/prepare-android-release.sh`. If `android/` is absent, restore the prior native project when possible, or generate and review it with `npx cap add android` **after** the web bundle is prepared. Then run `npx cap sync android`; confirm applicationId, SDK and signing config match the prior release.
3. In `android/app/build.gradle`, set `versionCode` strictly greater than the **actual** highest versionCode currently registered in Play Console (4 is only a provisional value), and `versionName` to `1.0.3`. Verify that `android/variables.gradle` targets **API 36 or higher**, required for app updates from 2026-08-31; the CI workflow intentionally fails until that is satisfied. Changing target API and regenerating the native project requires device regression tests. Never commit signing credentials.
4. Verify `www/index.html` and bundled Android assets exclude `select('*')` on member profile; run build and test login, profile, game flow with an authorized tester.
5. Produce **signed release AAB** with the **same upload key** as the existing Google Play listing. Verify signature and package name.
6. Upload AAB to the existing **closed testing track** in Play Console, complete review/rollout, install update through the same testing link, and verify login works. Only then request official production rollout.

Not completed by this branch: native Android build, signed AAB, Google Play upload or on-device smoke tests. No secrets are stored here.

## 2026-10-28 audit finding

The original CI workflow ran `npm ci` despite no committed `package-lock.json` and invoked `npx cap add android` before creating `www/index.html`. Both prevented a reliable Android build. The corrected workflow prepares assets first and explicitly blocks bundles that target below Android 16 (API 36). No changes were made to authentication, database permissions, scoring, rankings or competitive rules. This is a CI-only preparation; signed release, Play Console rollout and Android smoke testing remain manual release gates.
