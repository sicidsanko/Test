import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  Download,
  Copy,
  Check,
  Code2,
  FileText,
  Search,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ANDROID_PROJECT_FILES, CodeFile } from '../data/androidProjectFiles';
import { generateAndroidProjectZip, downloadBlob } from '../utils/zipExporter';

export const AndroidCodeHub: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(ANDROID_PROJECT_FILES[3]); // Default to PdfBoxEngine.kt
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'code'>('list');

  const categories = [
    { id: 'all', label: 'All Files' },
    { id: 'capacitor', label: 'Capacitor Config' },
    { id: 'workflow', label: 'GitHub CI' },
    { id: 'gradle', label: 'Gradle & SDK 36' },
    { id: 'manifest', label: 'Manifest & Perms' },
    { id: 'bridge', label: 'Capacitor Bridge' },
    { id: 'engine', label: 'Offline Engines' },
  ];

  const filteredFiles = ANDROID_PROJECT_FILES.filter(file => {
    const matchesCat = activeCategory === 'all' || file.category === activeCategory;
    const matchesSearch =
      !searchCode ||
      file.name.toLowerCase().includes(searchCode.toLowerCase()) ||
      file.description.toLowerCase().includes(searchCode.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      const zipBlob = await generateAndroidProjectZip();
      downloadBlob(zipBlob, 'PDFToolsPro-Capacitor8-Android-Project.zip');
    } catch (err) {
      console.error('Failed to export zip:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-stone-900 text-stone-100 font-sans">
      {/* Left File Tree Sidebar */}
      <div className={`w-full md:w-80 bg-stone-950 border-r border-stone-800 flex flex-col shrink-0 overflow-hidden ${mobileView === 'code' ? 'hidden md:flex' : 'flex'}`}>
        {/* Top Header */}
        <div className="p-4 border-b border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                CAP
              </div>
              <div>
                <h3 className="font-bold text-xs text-stone-100">Capacitor 8 Android</h3>
                <p className="text-[10px] text-stone-400">React 19 • Vite • SDK 36</p>
              </div>
            </div>

            <button
              disabled={isExporting}
              onClick={handleExportZip}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-md flex items-center space-x-1 cursor-pointer transition-colors"
              title="Download entire ready-to-open Android Studio project as ZIP"
            >
              <Download size={13} />
              <span>{isExporting ? 'Zipping...' : 'Export ZIP'}</span>
            </button>
          </div>

          {/* Search file */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              value={searchCode}
              onChange={e => setSearchCode(e.target.value)}
              placeholder="Filter Kotlin files..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-stone-900 text-xs text-stone-200 placeholder-stone-500 border border-stone-800 focus:outline-none focus:border-stone-600"
            />
          </div>

          {/* Category Chips */}
          <div className="flex space-x-1 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2 py-0.5 rounded-md text-[10px] whitespace-nowrap cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                    : 'text-stone-400 hover:bg-stone-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredFiles.map(file => {
            const isSelected = selectedFile.path === file.path;
            return (
              <button
                key={file.path}
                onClick={() => {
                  setSelectedFile(file);
                  setMobileView('code');
                }}
                className={`w-full text-left p-2 rounded-xl flex items-start space-x-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 shadow-xs'
                    : 'text-stone-300 hover:bg-stone-900/80 border border-transparent'
                }`}
              >
                <div
                  className={`mt-0.5 p-1 rounded-md text-[10px] font-bold ${
                    file.language === 'kotlin'
                      ? 'bg-purple-950 text-purple-400'
                      : file.language === 'gradle'
                      ? 'bg-blue-950 text-blue-400'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  <FileCode size={13} />
                </div>
                <div className="truncate flex-1">
                  <p className="text-xs font-semibold truncate leading-tight">{file.name}</p>
                  <p className="text-[10px] text-stone-500 truncate mt-0.5">{file.path}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Code Display Area */}
      <div className={`flex-1 flex flex-col h-full bg-stone-900 overflow-hidden ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        {/* File details bar */}
        <div className="px-5 py-3 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileView('list')}
              className="md:hidden px-2 py-1 rounded-lg bg-stone-800 text-stone-300 text-xs font-medium cursor-pointer"
            >
              ← Files
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-emerald-400">{selectedFile.path}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 uppercase font-medium">
                  {selectedFile.language}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">{selectedFile.description}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-medium text-stone-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Content with syntax-like styling */}
        <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed bg-[#121316]">
          <pre className="text-stone-300">
            <code>
              {selectedFile.code.split('\n').map((line, idx) => (
                <div key={idx} className="table-row hover:bg-stone-800/40">
                  <span className="table-cell pr-4 text-stone-600 select-none text-right w-8 text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="table-cell whitespace-pre">{line}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};
