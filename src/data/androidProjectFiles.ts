/**
 * Capacitor 8 Android & React Project Structure & Configuration Files
 */

export interface CodeFile {
  path: string;
  name: string;
  language: 'kotlin' | 'xml' | 'toml' | 'gradle' | 'markdown' | 'typescript' | 'yaml';
  category: 'capacitor' | 'gradle' | 'manifest' | 'workflow' | 'engine' | 'bridge';
  description: string;
  code: string;
}

export const ANDROID_PROJECT_FILES: CodeFile[] = [
  // 1. capacitor.config.ts
  {
    path: 'capacitor.config.ts',
    name: 'capacitor.config.ts',
    language: 'typescript',
    category: 'capacitor',
    description: 'Capacitor 8 configuration with appId com.pdftoolspro.app and androidScheme https.',
    code: `import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pdftoolspro.app',
  appName: 'PDF Tools Pro',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
`,
  },

  // 2. GitHub Actions Workflow
  {
    path: '.github/workflows/build-apk.yml',
    name: 'build-apk.yml',
    language: 'yaml',
    category: 'workflow',
    description: 'GitHub Actions CI workflow compiling React 19 app and assembling Android debug APK.',
    code: `name: Build Android APK

on:
  push:
    branches: [main, master]
  workflow_dispatch:

jobs:
  build:
    name: Build Debug APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Setup Java 21 (Temurin)
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Install dependencies
        run: npm install

      - name: Build web assets
        run: npx vite build

      - name: Sync Capacitor Android
        run: npx cap sync android

      - name: Assemble Debug APK
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleDebug

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-debug
          path: android/app/build/outputs/apk/debug/app-debug.apk
          if-no-files-found: error
`,
  },

  // 3. android/variables.gradle
  {
    path: 'android/variables.gradle',
    name: 'variables.gradle',
    language: 'gradle',
    category: 'gradle',
    description: 'SDK configuration: minSdk 24, compileSdk 36, targetSdk 36.',
    code: `ext {
    minSdkVersion = 24
    compileSdkVersion = 36
    targetSdkVersion = 36
    androidxActivityVersion = '1.11.0'
    androidxAppCompatVersion = '1.7.1'
    androidxCoordinatorLayoutVersion = '1.3.0'
    androidxCoreVersion = '1.17.0'
    androidxFragmentVersion = '1.8.9'
    coreSplashScreenVersion = '1.2.0'
    androidxWebkitVersion = '1.14.0'
    junitVersion = '4.13.2'
    androidxJunitVersion = '1.3.0'
    androidxEspressoCoreVersion = '3.7.0'
    cordovaAndroidVersion = '14.0.1'
}
`,
  },

  // 4. android/app/build.gradle
  {
    path: 'android/app/build.gradle',
    name: 'app/build.gradle',
    language: 'gradle',
    category: 'gradle',
    description: 'Android App module Gradle build script with Capacitor plugins.',
    code: `apply plugin: 'com.android.application'

android {
    namespace = "com.pdftoolspro.app"
    compileSdk = rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId "com.pdftoolspro.app"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        aaptOptions {
            ignoreAssetsPattern = '!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~'
        }
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation fileTree(include: ['*.jar'], dir: 'libs')
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
    implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
    implementation project(':capacitor-android')
    implementation project(':capacitor-cordova-android-plugins')
}

apply from: 'capacitor.build.gradle'
`,
  },

  // 5. AndroidManifest.xml
  {
    path: 'android/app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    language: 'xml',
    category: 'manifest',
    description: 'Manifest declaring Camera, Storage, FileProvider and Deep Links.',
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation|density"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Open PDFs with PDF Tools Pro -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="application/pdf" />
            </intent-filter>
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>

    <!-- Permissions for Camera & Filesystem -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
</manifest>
`,
  },

  // 6. Capacitor Bridge
  {
    path: 'src/utils/capacitorBridge.ts',
    name: 'capacitorBridge.ts',
    language: 'typescript',
    category: 'bridge',
    description: 'Bridge uniting @capacitor/filesystem, @capacitor/share, @capacitor/camera, and file-opener.',
    code: `import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Preferences } from '@capacitor/preferences';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FileOpener } from '@capacitor-community/file-opener';

export const isNative = Capacitor.isNativePlatform();

export async function savePdfToDevice(data: Uint8Array, fileName: string) {
  // Encodes base64 and saves to Directory.Documents or downloads in browser
}

export async function sharePdf(fileUri: string, fileName: string, data?: Uint8Array) {
  // Triggers native Android share sheet with temporary FileProvider permissions
}

export async function openWithExternalReader(fileUri: string) {
  // Launches external reader via @capacitor-community/file-opener
}
`,
  },

  // 7. Offline PDF Engine
  {
    path: 'src/utils/pdfProcessor.ts',
    name: 'pdfProcessor.ts',
    language: 'typescript',
    category: 'engine',
    description: 'Offline engine integrating pdf-lib, @cantoo/pdf-lib, pdfjs-dist, tesseract.js, jspdf with local workers.',
    code: `import { PDFDocument } from 'pdf-lib';
import { PDFDocument as CantooPDFDocument } from '@cantoo/pdf-lib';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Local worker configuration - 0 CDN calls:
pdfjsLib.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.mjs';

// Tesseract local offline worker:
const worker = await createWorker('eng', 1, {
  workerPath: '/workers/tesseract-worker.min.js',
  corePath: '/workers',
});
`,
  },
];
