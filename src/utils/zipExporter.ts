import JSZip from 'jszip';
import { ANDROID_PROJECT_FILES } from '../data/androidProjectFiles';

/**
 * Packs all Kotlin, Gradle, Manifest, and configuration files into an Android Studio project ZIP.
 */
export async function generateAndroidProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // Root files
  zip.file(
    'README.md',
    `# PDF Tools Pro - Capacitor 8 & React 19 Android Project

An offline-first PDF suite for Android built with React 19, TypeScript, Vite, Tailwind CSS v4, and wrapped for Android with Capacitor 8.

## Tech Stack
- React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons
- Capacitor 8 (@capacitor/core, @capacitor/android, @capacitor/filesystem, @capacitor/share, @capacitor/preferences, @capacitor/app, @capacitor/camera, @capacitor-community/file-opener)
- On-device PDF engines: pdf-lib, @cantoo/pdf-lib, pdfjs-dist, tesseract.js, jspdf (with locally bundled workers, 0 CDN calls)
- Android SDK: minSdk 24, compileSdk 36, targetSdk 36
- Automated GitHub Actions APK builder (.github/workflows/build-apk.yml)

## How to Build the APK Locally
1. Ensure Node.js 22 and Java 21 are installed.
2. Run:
   npm install
   npx vite build
   npx cap sync android
   cd android && chmod +x gradlew && ./gradlew assembleDebug
3. Find your debug APK at:
   android/app/build/outputs/apk/debug/app-debug.apk
`
  );

  zip.file(
    'build.gradle.kts',
    `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.hilt) apply false
    alias(libs.plugins.ksp) apply false
}
`
  );

  zip.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "iLovePDF-Android"
include(":app")
`
  );

  // Add all codebase files
  for (const file of ANDROID_PROJECT_FILES) {
    zip.file(file.path, file.code);
  }

  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
