# CCD — A Better You Every Day & Automated Hospitality Job Engine

An executive-tier personal development, financial management, habit integrity, and automated hospitality career application system tailored for hospitality professionals.

---

## 🌟 Key Features

1. **Cyprus Job Market (Strict Isolation)**
   - Specifically dedicated to Cyprus hospitality openings across Limassol Marina, Paphos, Ayia Napa, Protaras, Larnaca, Nicosia, and Polis Chrysochous.
   - Target positions: Bartender, Barman, Barista, Mixologist, Hotel Bar, Restaurant Bar, Pool Bar, Lobby Bar, Café, and Beverage/Hospitality roles.

2. **Europe Job Market (Pan-European)**
   - Open search across top European hospitality markets (Cyprus, Greece, Malta, Italy, Spain, Portugal, France, Germany, Austria, Netherlands, Belgium, Ireland, Switzerland, Croatia, and more).

3. **10-Day Applied Job Hide System**
   - Automatically hides applied jobs from search results for 10 days to prevent duplicates.
   - Persistently stores Job ID, Company, Position, Job URL, Recipient Email, Application Date, Gmail Message ID, and Application Status.
   - Dedicated "10-Day Protected Vault" modal for tracking cooldowns.

4. **3-AI Verification Consensus (Gemini + OpenAI + Grok)**
   - Real-time search via Google Search Grounding.
   - Legitimacy verification, direct corporate HR email verification, and 3-month posting freshness checks.

5. **Gmail Direct Application Engine**
   - Sends individual, personalized emails directly from the user's connected Gmail account (no CC/BCC).
   - Automatically attaches candidate's CV (PDF from template or phone storage).
   - Full live bounce detection (`DELIVERY FAILED`) and incoming reply tracking.

6. **Native Android APK Packaging**
   - Packaged with an Android application wrapper in `/android`.
   - Embeds the web application assets for offline capability and rapid loading.
   - Supports native Android file picking for attaching CVs directly from phone storage.
   - Automated GitHub Actions workflow to build and download the Android APK artifact.

---

## 📱 Building the Android APK via GitHub Actions

This repository includes a pre-configured GitHub Actions workflow (`.github/workflows/build-android-apk.yml`) that automatically builds the Android APK.

### Step 1: Push Project to Your GitHub Repository

Initialize and push to your GitHub repository:

```bash
git add .
git commit -m "Complete project with Cyprus/Europe Job Markets and Android APK configuration"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git push -u origin main
```

### Step 2: Automatic APK Build on GitHub

1. Once pushed to GitHub, navigate to the **Actions** tab in your repository.
2. You will see the **Build Android APK** workflow running automatically.
3. You can also trigger it manually anytime by clicking **Run workflow** under **Actions** → **Build Android APK**.

### Step 3: Download and Install APK on Android Phone

1. In the **Actions** tab, click on the completed workflow run.
2. Scroll down to the **Artifacts** section at the bottom.
3. Click on **CCD-Hospitality-Android-App-Debug-APK** to download the ZIP file.
4. Unzip the file on your computer or phone to obtain `app-debug.apk`.
5. Transfer `app-debug.apk` to your Android phone (or download directly via browser on your phone).
6. Tap the APK file to install (allow "Install from Unknown Sources" if prompted by Android).

---

## 💻 Local Web & Backend Development

### Prerequisites

- Node.js 18+ or 20+
- npm

### Installation

```bash
npm install
```

### Run Dev Server (Vite + Express Backend)

```bash
npm run dev
```

The application runs on `http://localhost:3000`.

### Production Build

```bash
npm run build
npm start
```

---

## 🔒 Security & Environment Variables

Never commit private credentials or API keys directly to GitHub. Configure sensitive values in your repository's **Settings → Secrets and variables → Actions**:

- `GEMINI_API_KEY`: Google Gemini API key
- `OPENAI_API_KEY`: OpenAI API key
- `GROK_API_KEY`: xAI Grok API key

---

## 📂 Project Architecture

```
├── .github/workflows/       # GitHub Actions automated Android APK builder
│   └── build-android-apk.yml
├── android/                 # Android project source and Gradle configuration
│   ├── app/
│   │   ├── build.gradle.kts
│   │   ├── google-services.json
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/com/ccd/abetteryou/MainActivity.kt  # Full Android WebView host
│   │       └── assets/dist/                            # Bundled web application assets
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   ├── gradlew              # Executable Gradle wrapper
│   └── gradlew.bat
├── src/                     # React TypeScript frontend
│   ├── components/          # UI Components & AI Automated Job Engine
│   ├── services/            # Gmail, Firebase, Job Database & Cooldown Service
│   ├── types/               # Type definitions
│   └── views/               # Views (Job Engine, CV Manager, Finance, Habits)
├── server.ts                # Express backend with 3-AI search & verification pipeline
├── package.json
└── vite.config.ts
```
