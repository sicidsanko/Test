import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Cpu,
  Layers,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Server,
  Smartphone,
  Scale,
} from 'lucide-react';

export const ArchitectureGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'libs' | 'office' | 'phases' | 'arch'>('libs');

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-stone-50 dark:bg-stone-950 p-4 md:p-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <Cpu size={24} />
          <h2 className="text-xl font-bold tracking-tight">
            PDF Tools Pro - Capacitor 8 & React 19 Android Architecture
          </h2>
        </div>
        <p className="text-xs md:text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-4xl">
          Complete offline PDF suite architecture: React 19 + TypeScript + Vite, packaged for Android with Capacitor 8,
          bundled with local workers (pdfjs-dist & tesseract.js), and automated CI APK generation.
        </p>

        {/* Section Navigation Tabs */}
        <div className="flex items-center space-x-2 pt-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'libs', label: '1. Offline Libraries & Local Workers', icon: Scale },
            { id: 'office', label: '2. Office Docs Offline Feasibility', icon: Server },
            { id: 'phases', label: '3. Phased Roadmap', icon: Layers },
            { id: 'arch', label: '4. Capacitor 8 & APK Build CI', icon: Smartphone },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: LIBRARIES & LICENSES */}
      {activeSection === 'libs' && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-3">
            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm">Critical Licensing Warning: iText AGPLv3 vs PdfBox Apache 2.0</p>
              <p className="leading-relaxed">
                Many online tutorials suggest using <strong>iText 7</strong>. However, iText is licensed under{' '}
                <strong>AGPLv3</strong> (or commercial license costing thousands of dollars). If you distribute an app
                using iText without a paid license, you are legally obligated to release your app's entire source code
                under AGPL!
                <br />
                <strong>Recommendation:</strong> Use <strong>PdfBox-Android</strong> (Apache 2.0) — 100% free and
                permissive for commercial closed-source apps.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Library 1: PdfBox-Android */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  PdfBox-Android (com.tom-roush:pdfbox-android)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Apache 2.0 (Safe)
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                Port of Apache PDFBox for Android. Handles PDF merge, split, watermark, page extraction, rotation,
                metadata stripping, encryption (AES-128 / AES-256), and image embedding.
              </p>
              <div className="text-[11px] space-y-1 bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl border border-stone-200/60 dark:border-stone-700/60">
                <p><strong>APK Overhead:</strong> ~4.8 MB</p>
                <p><strong>License:</strong> Apache License 2.0 (Commercial-friendly)</p>
                <p><strong>Best For:</strong> Offline PDF merging, splitting, watermarking, encryption.</p>
              </div>
            </div>

            {/* Library 2: Native Android PdfRenderer */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Android Native PdfRenderer (android.graphics.pdf)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  AOSP Built-in (0 MB)
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                Native C++ Skia-backed hardware accelerated page renderer available since Android 5.0 (API 21).
                Renders any PDF page to high-res Bitmap for Jetpack Compose with zero lag.
              </p>
              <div className="text-[11px] space-y-1 bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl border border-stone-200/60 dark:border-stone-700/60">
                <p><strong>APK Overhead:</strong> 0 KB (Pre-installed in OS)</p>
                <p><strong>License:</strong> Android Open Source Project</p>
                <p><strong>Best For:</strong> In-app PDF Viewer & Page Thumbnails reel.</p>
              </div>
            </div>

            {/* Library 3: ML Kit */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Google ML Kit On-Device (Text Recognition & Doc Scanner)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  Google Play Services
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                Powers OCR and Document Scanning. Runs neural models entirely on the user's NPU/CPU without cloud data
                uploads. The ML Kit Document Scanner API handles edge detection, shadow removal, and perspective warp.
              </p>
              <div className="text-[11px] space-y-1 bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl border border-stone-200/60 dark:border-stone-700/60">
                <p><strong>Network:</strong> 100% Offline (Models downloaded once or provided via Play Services)</p>
                <p><strong>License:</strong> Free Google Play Services API</p>
                <p><strong>Best For:</strong> OCR PDF, Searchable text, Scan to PDF.</p>
              </div>
            </div>

            {/* Library 4: CameraX */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Android Jetpack CameraX (androidx.camera)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Apache 2.0 (Google)
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                Lifecycle-aware camera library abstracting Android Camera2 across thousands of OEM device quirks.
                Provides image analysis use-cases for live document boundary detection.
              </p>
              <div className="text-[11px] space-y-1 bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl border border-stone-200/60 dark:border-stone-700/60">
                <p><strong>Compatibility:</strong> Tested on over 99% of Android devices</p>
                <p><strong>License:</strong> Apache 2.0</p>
                <p><strong>Best For:</strong> Camera viewfinder, high-res doc captures.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: HONEST OFFICE CONVERSION REALITY */}
      {activeSection === 'office' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center space-x-2">
              <Server size={18} className="text-red-600" />
              <span>Why Word, Excel, and PowerPoint to PDF is Hard to Do Offline on Android</span>
            </h3>

            <div className="space-y-3 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              <p>
                Converting <strong>Word (.docx)</strong>, <strong>PowerPoint (.pptx)</strong>, and{' '}
                <strong>Excel (.xlsx)</strong> into faithful PDF documents offline on an Android device is one of the
                hardest engineering challenges in mobile development. Here is the unvarnished truth:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 space-y-1.5">
                  <p className="font-bold text-stone-900 dark:text-stone-100">1. Missing Layout Engine</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Office XML files (.docx) only contain semantic tags (paragraphs, tables, styles). They do NOT
                    contain page geometry. To calculate where page breaks, word-wraps, and columns occur, you need a full
                    layout rasterizer with font metrics identical to Microsoft Word.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 space-y-1.5">
                  <p className="font-bold text-stone-900 dark:text-stone-100">2. Apache POI is Incomplete on Android</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Apache POI can read and extract data from DOCX/XLSX, but it relies on Java AWT (which does not exist
                    on Android). POI has no PDF export engine. Porting POI adds ~45MB to your APK without solving the
                    actual visual layout rendering.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 space-y-1.5">
                  <p className="font-bold text-stone-900 dark:text-stone-100">3. LibreOffice Android Bloat</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Compiling LibreOffice for Android (LibreOfficeKit) produces native .so libraries of <strong>150MB+</strong>.
                    It has high RAM consumption (&gt;500MB) causing Android's Low Memory Killer (LMK) to terminate your
                    app on budget and mid-tier phones.
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <p className="font-bold text-emerald-900 dark:text-emerald-200 text-sm flex items-center space-x-1.5">
                  <CheckCircle2 size={16} />
                  <span>The Recommended Hybrid Solution (What iLovePDF Actually Does)</span>
                </p>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Notice that iLovePDF itself processes <strong>Merge, Split, Rotate, Watermark, and Protect</strong> on
                  the client device or fast worker, but sends Office documents to a specialized cloud conversion cluster.
                  <br />
                  <strong>Best Architecture for Your App:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1 text-emerald-800 dark:text-emerald-300 text-[11px]">
                  <li>
                    <strong>90% of tools (PDF operations, Images, OCR, Sign)</strong> run 100% on-device offline using
                    PdfBox-Android and ML Kit.
                  </li>
                  <li>
                    <strong>Office tools (Word/Excel/PowerPoint)</strong> detect network connection:
                    if offline, show an informative dialog explaining that Office layout rendering requires the cloud
                    worker; if online, send to a self-hosted Gotenberg microservice (Docker with LibreOffice) or CloudConvert API.
                  </li>
                  <li>
                    <strong>Alternative:</strong> Use Gemini 2.5 Flash Multimodal to analyze and extract doc structure into
                    a pristine PDF layout.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: PHASED ROADMAP */}
      {activeSection === 'phases' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center space-x-2">
              <Layers size={18} className="text-red-600" />
              <span>Phased Implementation Strategy</span>
            </h3>

            <div className="space-y-3">
              {[
                {
                  phase: 'Phase 1: Core Foundation & Essential Tools',
                  status: 'Ready / Implemented',
                  items: [
                    'Material 3 Jetpack Compose Home Screen with search & category filter chips',
                    'Built-in PDF Viewer with native PdfRenderer & page thumbnail reel',
                    'Merge PDF with drag-and-drop file reordering (PdfBox-Android)',
                    'Split PDF (by page ranges, extract all, every N pages)',
                    'Compress PDF (low / recommended / extreme levels)',
                    'Rotate PDF (single page or all pages 90/180/270)',
                    'JPG/PNG to PDF converter with margin & orientation control',
                  ],
                },
                {
                  phase: 'Phase 2: Document Scanning, Organizing & E-Signature',
                  status: 'Ready / Implemented',
                  items: [
                    'Scan to PDF using CameraX + ML Kit Document Scanner edge detection',
                    'Interactive Signature Pad with smooth quadratic Bezier canvas',
                    'Add Page Numbers with custom placement (bottom-right, center, header)',
                    'Add Watermark (diagonal text, opacity slider, custom angle)',
                    'PDF to JPG high-resolution page extraction',
                    'Room Database for Recent Files tracking & favorites',
                  ],
                },
                {
                  phase: 'Phase 3: Security & Optimization',
                  status: 'Configured in Architecture',
                  items: [
                    'Protect PDF with AES-128 / AES-256 password lock',
                    'Unlock PDF (password decryption with authorization)',
                    'Redact PDF (permanent blackout zone burning)',
                    'OCR PDF via ML Kit on-device text recognition with invisible text layer',
                    'Repair PDF (xref table recovery for damaged byte streams)',
                  ],
                },
                {
                  phase: 'Phase 4: PDF Intelligence & Hybrid Office Conversion',
                  status: 'Configured in Architecture',
                  items: [
                    'Gemini AI PDF Summarizer (executive briefs, key action items)',
                    'Gemini AI Document Translator (multilingual translation)',
                    'Hybrid Office to PDF Worker (Gotenberg / LibreOffice cloud endpoint)',
                    'Storage Access Framework (SAF) scoped storage export to /Downloads',
                  ],
                },
              ].map((p, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs md:text-sm text-stone-900 dark:text-stone-100">
                      {p.phase}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {p.status}
                    </span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[11px] text-stone-600 dark:text-stone-300">
                    {p.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: ARCHITECTURE & MVVM */}
      {activeSection === 'arch' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center space-x-2">
            <Smartphone size={18} className="text-red-600" />
            <span>Modern Android Architecture (MVVM + Clean Architecture)</span>
          </h3>

          <div className="p-4 rounded-2xl bg-stone-950 text-stone-200 font-mono text-xs overflow-x-auto space-y-2 leading-relaxed">
            <p className="text-emerald-400 font-bold">// Data Flow & Dependency Direction:</p>
            <p>UI Layer (Jetpack Compose M3) ➔ ViewModel (StateFlow&lt;UiState&gt;) ➔ UseCase / Repository ➔ Engines</p>
            <div className="pt-2 text-stone-400 text-[11px] space-y-1">
              <p>├── UI: HomeScreen, PdfViewerScreen, ToolModal, SignaturePad</p>
              <p>├── ViewModel: PdfViewModel (handles coroutines on Dispatchers.IO)</p>
              <p>├── DI: Hilt AppModule (@InstallIn(SingletonComponent::class))</p>
              <p>├── Database: Room AppDatabase (RecentFilesDao, RecentFileEntity)</p>
              <p>└── Engines: PdfBoxEngine (Apache 2.0), PdfRendererHelper (AOSP), ML Kit OCR</p>
            </div>
          </div>

          <div className="text-xs text-stone-600 dark:text-stone-300 space-y-2 leading-relaxed">
            <p><strong>Storage Access Framework (SAF) Best Practices:</strong></p>
            <p>
              Since Android 10 (API 29) and Scoped Storage enforcement in Android 11-14, applications do NOT need
              `WRITE_EXTERNAL_STORAGE`. Instead:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[11px]">
              <li>
                To open files: Use <code>ActivityResultContracts.OpenDocument()</code> (returns a content Uri).
              </li>
              <li>
                To save files: Use <code>ActivityResultContracts.CreateDocument("application/pdf")</code> or write to
                <code>MediaStore.Downloads</code>.
              </li>
              <li>
                To share files: Use <code>FileProvider.getUriForFile()</code> with temporary read permissions.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
