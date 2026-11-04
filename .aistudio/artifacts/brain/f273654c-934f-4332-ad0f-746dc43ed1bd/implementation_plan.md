# Implementation Plan - BD Shops Theme & Native Android App (React Native CLI)

## 1. Website Theme Update (Warm Amber Orange & Rose Pink)
- **Default Theme Configuration**: Update Tailwind / CSS styles (`src/index.css` and store default settings in `SettingsContext.tsx`) to set Warm Amber Orange (`#f97316` / `#f59e0b`) and Rose Pink (`#f43f5e` / `#e11d48`) as the primary brand colors.
- **Dynamic Persistence**: Ensure any changes made in the Admin Portal branding settings instantly persist to Firestore and update all user sessions in real-time, defaulting to warm amber & rose pink for new visitors.

## 2. Native Android App (`android-app/`)
- Create a complete React Native CLI project structure in `android-app/`:
  - `android-app/package.json`: Dependencies for React Native, Navigation, Firebase, and UI components.
  - `android-app/App.js` & `src/`: Full user storefront features (Home, Products, Cart, Checkout, Orders, Profile, Wishlist) connected to Firebase (`black-zone-shops`).
  - Strict exclusion of any Admin login, Admin dashboard, or delivery management UI.
  - Native Android configuration: `android/app/build.gradle`, `AndroidManifest.xml`, `metro.config.js`, etc.

## 3. GitHub Actions Workflow (`.github/workflows/android-apk.yml`)
- Set up a robust GitHub Actions workflow to build the Android APK using Node.js, Java (JDK 17), Android SDK, Gradle build, and artifact upload.

## 4. Documentation (`README.md`)
- Provide clear instructions on repository setup, GitHub Actions execution, APK artifact download, and local development.
