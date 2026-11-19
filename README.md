# Keystone · three looks

Choose **Settings → Looks → A / B / C**. The choice is saved in local SQLite and overrides the build-time default:

- **A · Aurora Night** — a precise, Raycast-inspired command center: near-black, soft ambient glow, compact icon rows and inline voice capture. System SF on iOS.
- **B · Candy Pop** — Nunito Black, pastel sticker cards, emoji area badges, springy oversized checkboxes and a real completion streak.
- **C · Paper Zen** — Fraunces, warm paper, generous whitespace, quiet area dots and an editorial focus list.

All three retain native Liquid Glass cards and tabs on supported iOS versions, plus the SwiftUI evening toggle. Web and older iOS use themed translucent surfaces. Reduced Motion disables the ambient/pulse animations and completion springs. Web is centered at a maximum width of 430px.

```sh
# From the repo root; use a fresh browser origin/profile for first-launch demo data.
EXPO_PUBLIC_LOOK=a EXPO_PUBLIC_DEMO=1 npm run web -w mobile -- --port 8090
```

`EXPO_PUBLIC_LOOK=a|b|c` selects the default only when there is no saved look. `EXPO_PUBLIC_DEMO=1` seeds OS coursework, a DBMS quiz, internship applications, LeetCode and gym **only when no database state exists**; it never replaces an existing planner. Omit it for an empty planner. Fonts are bundled locally; no runtime Google Fonts request is needed.

## Build and run in an iOS simulator (macOS, Xcode 26)

Install Xcode 26, its iOS simulator runtime, Node 22 and CocoaPods. From the repo root:

```sh
npm ci
cd apps/mobile
export EXPO_PUBLIC_LOOK=a  # a = Aurora Night, b = Candy Pop, c = Paper Zen
export EXPO_PUBLIC_DEMO=1 # optional; first launch only
npx expo prebuild -p ios --no-install
cd ios && pod install && cd ..
xcodebuild -workspace ios/Keystone.xcworkspace -scheme Keystone \
  -configuration Release -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath build-sim CODE_SIGNING_ALLOWED=NO build
xcrun simctl list devices available
open -a Simulator
# Choose an available iPhone simulator UDID from the list above:
export SIMULATOR_UDID='<your-iPhone-simulator-UDID>'
xcrun simctl boot "$SIMULATOR_UDID" # skip if already booted
xcrun simctl bootstatus "$SIMULATOR_UDID" -b
xcrun simctl install "$SIMULATOR_UDID" build-sim/Build/Products/Release-iphonesimulator/Keystone.app
xcrun simctl launch "$SIMULATOR_UDID" com.siddhj2206.keystone
```

This Release simulator build embeds the JS bundle and does not need Metro. Change looks instantly in Settings. To change the compiled default, re-export `EXPO_PUBLIC_LOOK` and rebuild; a saved selection still wins. For a **disposable simulator only**, `xcrun simctl uninstall "$SIMULATOR_UDID" com.siddhj2206.keystone` resets first-launch state (deletes all planner data), after which install/launch again. Simulator signing does not need a paid developer account. Actual Liquid Glass and voice permissions require native runtime testing; web screenshots are not evidence of native rendering.
## About Keystone

A calm, local-first goals planner for a busy brain. Brain-dump with text or voice; Keystone splits it into actionable tasks, finds dates, and links tasks to short- and long-term goals. Today highlights just three next steps. No accounts, backend, subscription or push service.

## A little delight

Pastel aurora gradients, colorful area accents, gentle completion celebrations and haptics make the routine feel lighter. iOS 26 uses native Liquid Glass cards and capture surfaces (`expo-glass-effect`), native liquid-glass tabs and a SwiftUI evening toggle (`@expo/ui`). Older iOS and web retain translucent cards over the same dark-mode-aware gradients. The CI explicitly selects Xcode 26 and prints the iPhone SDK version. Reduced-motion settings skip completion animation.

## Workspace

- `apps/mobile`: Expo SDK 58, TypeScript, Expo Router, SQLite, local notifications, native speech recognition and SecureStore.
- `packages/core`: shared types, offline organizer, optional Gemini REST engine and Jest tests.
- `.github/workflows/ios.yml`: unsigned iPhone build on macOS, triggered by main/feature pushes, PRs and manual dispatch. Main publishes the IPA to the `latest` release; other builds upload an artifact.

Node 22+ and npm are required. From the repo root:

```sh
npm ci
npx tsc --noEmit
npx jest
cd apps/mobile
npx expo-doctor
npx expo export -p ios
npx expo start --web
```

Expo automatically resolves npm workspaces with Metro. SQLite web uses WASM and SharedArrayBuffer: serve web with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers (Expo dev server provides these via the project's Metro middleware). Web is a preview; speech and keychain storage are intended for the installed native app. A native development build is needed for speech; Expo Go does not bundle the recognition module.

## Install on iPhone via AppDrop

1. Download `keystone.ipa` from the repository's latest GitHub Release, or unzip the `keystone-ipa` artifact on a successful Actions run.
2. Go to **https://appdrop.app** and upload the IPA. Follow its current signing and installation steps on your iPhone.
3. If prompted, trust the resulting profile in iPhone Settings.

**Important:** This pipeline deliberately does not sign the app. iOS cannot install an unsigned IPA by itself. AppDrop (or another signing service) must sign it using a valid provisioning route. Availability, cost, certificate revocation and eligibility are controlled by that service, not Keystone; a free installation without an Apple developer account is not guaranteed. Local notifications do not require APNs or a paid developer account, but the app itself still needs valid signing. Never upload your Gemini key to an installation service.

## Optional free Gemini key

1. Create a key at **https://aistudio.google.com/apikey**, choosing a project with free-tier quota. Availability/limits vary by region and Google policy; no billing setup is required by Keystone.
2. Open Settings in the installed app, paste the key and tap **Save key securely**. It stays in the iOS keychain, never in SQLite or exports.
3. New captures use `gemini-2.5-flash`. Captured text and existing goal context are sent to Google. Review Google's free-tier data-use terms before sending personal information. Timeouts, quota errors and invalid output always fall back to the offline parser.

Remove the key to return to local-only organizing. Offline rules recognize today, tomorrow, weekdays, next week, “by 25th”, and optional am/pm times; undated tasks stay undated. Commas/newlines and actionable “and” phrases split a dump, while titles like “data and algorithms” stay together. Categorized tasks attach to an existing goal in that area, or a new suggested goal is created automatically. Unclassified items remain in Today's Inbox; use Edit details to link them manually.

## Reminders & privacy

Enable local notification permission from Settings. Morning and optional 20:00 evening reminders repeat locally. Up to 60 nearest future task reminders are scheduled within iOS's notification limit. Morning focus counts are a snapshot from the last app visit, not background computation. Reopen the app to refresh schedules. Snoozing moves a task to tomorrow at 09:00. Dates without a time default to 18:00 local time.

All goals, tasks, captures and preferences are stored in the on-device SQLite database; no analytics or remote database. Voice prefers on-device recognition when supported; otherwise Apple's recognition service may process audio. You can deny microphone access and still type. JSON export uses the native share sheet and excludes the API key. Exports contain personal data; store them safely. There is no import/sync or automatic cross-device backup feature.
