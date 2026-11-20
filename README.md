# Keystone

A calm, local-first goals planner for a busy brain. Brain-dump with text or voice; Keystone splits it into actionable tasks, finds dates, and links tasks to short- and long-term goals. Today highlights just three next steps. No accounts, backend, subscription or push service.

## A little delight

iOS uses native navigation bars, SF Symbols and SwiftUI lists, forms and sheets via `@expo/ui`. On iOS 26, the system tab bar and voice capture button use Liquid Glass. Swipe a task to complete it or snooze it, or touch and hold for more actions. Completion uses haptics and respects Reduce Motion. The web preview uses the React Native layout.

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

Install or update Keystone at **https://appdrop.app/d/ht7jeyqp93**. Successful builds pushed to `main` update this AppDrop link automatically.

1. Download `keystone.ipa` from the repository's latest GitHub Release, or unzip the `keystone-ipa` artifact on a successful Actions run.
2. Go to **https://appdrop.app** and upload the IPA. Follow its current signing and installation steps on your iPhone.
3. If prompted, trust the resulting profile in iPhone Settings.

**Important:** This pipeline deliberately does not sign the app. iOS cannot install an unsigned IPA by itself. AppDrop (or another signing service) must sign it using a valid provisioning route. Availability, cost, certificate revocation and eligibility are controlled by that service, not Keystone; a free installation without an Apple developer account is not guaranteed. Local notifications do not require APNs or a paid developer account, but the app itself still needs valid signing. Never upload your Gemini key to an installation service.

## Optional free Gemini key

1. Create a key at **https://aistudio.google.com/apikey**, choosing a project with free-tier quota. Availability/limits vary by region and Google policy; no billing setup is required by Keystone.
2. Open Settings in the installed app and paste the key. On iOS, tap **Done** or leave the field to save it. It stays in the secure keychain, never in SQLite or exports.
3. New captures use `gemini-2.5-flash`. Captured text and existing goal context are sent to Google. Review Google's free-tier data-use terms before sending personal information. Timeouts, quota errors and invalid output always fall back to the offline parser.

Remove the key to return to local-only organizing. Offline rules recognize today, tomorrow, weekdays, next week, “by 25th”, and optional am/pm times; undated tasks stay undated. Commas/newlines and actionable “and” phrases split a dump, while titles like “data and algorithms” stay together. Categorized tasks attach to an existing goal in that area, or a new suggested goal is created automatically. Unclassified items remain in Today's Inbox; use Edit details to link them manually.

## Reminders & privacy

Enable local notification permission from Settings. Morning and optional 20:00 evening reminders repeat locally. Up to 60 nearest future task reminders are scheduled within iOS's notification limit. Morning focus counts are a snapshot from the last app visit, not background computation. Reopen the app to refresh schedules. Snoozing moves a task to tomorrow at 09:00. Dates without a time default to 18:00 local time.

All goals, tasks, captures and preferences are stored in the on-device SQLite database; no analytics or remote database. Voice prefers on-device recognition when supported; otherwise Apple's recognition service may process audio. You can deny microphone access and still type. JSON export uses the native share sheet and excludes the API key. On iOS, weekly backups appear in Files › On My iPhone › Keystone. **Restore Backup** replaces the current plan with a backup you choose. There is no automatic cross-device sync.

## Quick capture from anywhere

Keystone opens straight into capture from the `keystone://capture` link, and `keystone://capture?voice=1` starts listening right away. To use it from the Action Button or Back Tap, make a Shortcut with one **Open URL** action set to `keystone://capture?voice=1`, then pick that Shortcut under Settings › Action Button (or Accessibility › Touch › Back Tap). No widget or app extension is needed, so it works with AppDrop's free signing.
