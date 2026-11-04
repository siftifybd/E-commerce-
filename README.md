# Black Zone E-Commerce & Native Android App

Welcome to **Black Zone**, a full-stack e-commerce web platform and Native Android Application powered by React, TypeScript, Tailwind CSS, Firebase, and GitHub Actions.

---

## 🌟 Key Features

1. **Warm Amber Orange & Rose Pink Theme**:
   - The default theme features a vibrant warm amber orange and rose pink palette across all storefronts, fully customizable by the admin and persisting in real-time.
2. **Strict Admin & User Separation**:
   - **User Storefront (`/`)**: Only regular customers can log in or register. Admin and delivery emails are strictly blocked from logging into the user storefront with a full-screen alert modal.
   - **Admin Portal (`/admin`)**: Standalone admin management dashboard. Unauthorized regular users who attempt to access or log in on `/admin` are automatically banned and suspended in Firebase with `🚨 অটো ব্যানড (অ্যাডমিন অনুপ্রবেশের চেষ্টা)`.
3. **Native Android App (`android-app/`)**:
   - A standalone React Native CLI application located in `/android-app/` containing all customer features (Home, Products, Cart, Checkout, Order History, User Profile) connected to the exact same Firebase backend (`black-zone-shops`).
   - Excludes all admin and delivery management portals from the Android build.
4. **Cloud APK Build via GitHub Actions (`.github/workflows/android-apk.yml`)**:
   - Automated Gradle build pipeline for compiling the release APK on GitHub Actions without requiring local Android Studio or a computer.

---

## 📂 Project Structure

- `src/` — React website source code (Vite + TypeScript + Tailwind CSS)
- `android-app/` — Native Android Application source code (React Native CLI)
- `.github/workflows/` — GitHub Actions automated APK build workflow (`android-apk.yml`)
- `firestore.rules` — Hardened Firebase security rules

---

## 🚀 Getting Started & GitHub Actions APK Build

1. **Push to GitHub**:
   - Push this complete repository to a GitHub repository.
2. **Run GitHub Actions**:
   - Go to your repository on GitHub -> **Actions** tab -> **Build Android APK** workflow -> click **Run workflow**.
3. **Download APK**:
   - Once the build succeeds, download the compiled `.apk` artifact directly from the GitHub Actions run summary page.
