import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Maximize2,
  FileText,
  RotateCw,
  Info,
} from 'lucide-react';
import { formatBytes } from '../utils/pdfEngineLogic';

interface BuiltInPdfViewerProps {
  pdfUrl: string | null;
  fileName: string;
  onClose?: () => void;
  onOpenSample?: () => void;
}

export const BuiltInPdfViewer: React.FC<BuiltInPdfViewerProps> = ({
  pdfUrl,
  fileName,
  onOpenSample,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = 4; // Display pages
  const [rotation, setRotation] = useState<number>(0);

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(200, Math.max(50, prev + delta)));
  };

  const handleRotate = () => {
    setRotation(r => (r + 90) % 360);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-100 dark:bg-stone-950 overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-12 px-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center space-x-2 truncate max-w-[45%]">
          <FileText size={16} className="text-red-600 shrink-0" />
          <span className="font-bold text-stone-800 dark:text-stone-200 truncate">
            {fileName || 'No document loaded'}
          </span>
        </div>

        {/* Page navigation controls */}
        <div className="flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-xl">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="p-1 rounded text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-30 cursor-pointer"
            aria-label="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-1 text-xs font-semibold text-stone-700 dark:text-stone-300">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="p-1 rounded text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-30 cursor-pointer"
            aria-label="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => handleZoom(-15)}
            className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-[11px] font-semibold text-stone-500 w-9 text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={() => handleZoom(15)}
            className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleRotate}
            className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            title="Rotate View"
            aria-label="Rotate View"
          >
            <RotateCw size={16} />
          </button>
        </div>
      </div>

      {/* Main Viewport Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Page Thumbnails Strip */}
        <div className="w-20 md:w-28 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 p-2 overflow-y-auto space-y-2.5 shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 text-center">
            Pages
          </p>
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            const isSelected = currentPage === pageNum;
            return (
              <div
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`p-1 rounded-xl cursor-pointer transition-all border text-center ${
                  isSelected
                    ? 'border-red-600 bg-red-50 dark:bg-red-950/40 shadow-xs'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-400'
                }`}
              >
                {/* Thumbnail card mock */}
                <div className="w-full aspect-3/4 bg-white dark:bg-stone-800 shadow-inner rounded-sm flex flex-col justify-between p-1 text-[8px] text-stone-400">
                  <div className="h-1.5 w-8 bg-stone-300 dark:bg-stone-600 rounded"></div>
                  <div className="space-y-1">
                    <div className="h-1 w-full bg-stone-200 dark:bg-stone-700 rounded"></div>
                    <div className="h-1 w-3/4 bg-stone-200 dark:bg-stone-700 rounded"></div>
                  </div>
                  <div className="text-right text-[7px] font-bold text-stone-500">{pageNum}</div>
                </div>
                <span className="text-[10px] font-medium text-stone-600 dark:text-stone-400">
                  {pageNum}
                </span>
              </div>
            );
          })}
        </div>

        {/* Center PDF Canvas / Viewer */}
        <div className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center bg-stone-200/60 dark:bg-stone-950">
          {pdfUrl ? (
            <div
              className="bg-white shadow-2xl rounded-sm transition-transform duration-200 border border-stone-300 dark:border-stone-700 overflow-hidden flex flex-col"
              style={{
                width: `${(595 * zoomLevel) / 100}px`,
                minHeight: `${(842 * zoomLevel) / 100}px`,
                transform: `rotate(${rotation}deg)`,
              }}
            >
              {/* Document Header Banner */}
              <div className="h-16 bg-red-600 text-white px-8 flex items-center justify-between">
                <div>
                  <h1 className="font-bold text-lg leading-tight">{fileName || 'Sample Document'}</h1>
                  <p className="text-[11px] opacity-90">Jetpack Compose PdfRenderer Preview</p>
                </div>
                <div className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">
                  Page {currentPage} of {totalPages}
                </div>
              </div>

              {/* Document Content simulated sheet */}
              <div className="p-8 space-y-6 flex-1 text-stone-800 font-sans">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-stone-900">
                    {currentPage === 1
                      ? '1. Executive Project Summary'
                      : currentPage === 2
                      ? '2. Architectural Blueprint'
                      : currentPage === 3
                      ? '3. Engine Benchmarks & Performance'
                      : '4. Security Signoff & Final Approval'}
                  </h2>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    This preview is rendered using native Android PdfRenderer mechanics. In the Kotlin implementation,
                    ParcelFileDescriptor opens the file stream, and each page is rasterized hardware-accelerated directly
                    onto a Compose Canvas with zero UI thread stutter.
                  </p>
                </div>

                <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-2 text-xs">
                  <p className="font-bold text-stone-900">Embedded Engine Specifications:</p>
                  <ul className="list-disc pl-5 space-y-1 text-stone-600 text-[11px]">
                    <li>Storage Access Framework: Scoped storage compliant (Android 14/15)</li>
                    <li>PdfBox-Android: 2.0.27.0 (Apache 2.0 License)</li>
                    <li>Native PdfRenderer: Skia graphics C++ acceleration</li>
                    <li>ML Kit OCR: On-device text recognition Latin & CJK</li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-3 bg-stone-100 rounded-lg">
                    <p className="text-[10px] text-stone-500 font-semibold uppercase">Memory Footprint</p>
                    <p className="text-sm font-bold text-stone-800">~14 MB Heap</p>
                  </div>
                  <div className="p-3 bg-stone-100 rounded-lg">
                    <p className="text-[10px] text-stone-500 font-semibold uppercase">Offline Execution</p>
                    <p className="text-sm font-bold text-emerald-600">Active (Safe)</p>
                  </div>
                </div>

                {/* Footer of page */}
                <div className="pt-12 mt-auto border-t border-stone-200 flex justify-between text-[10px] text-stone-400">
                  <span>Confidential • Internal Distribution Only</span>
                  <span>Page {currentPage}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-red-100 dark:bg-red-950/60 text-red-600 mx-auto flex items-center justify-center">
                <FileText size={32} />
              </div>
              <h3 className="font-bold text-base text-stone-800 dark:text-stone-200">
                No PDF Document Loaded
              </h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Select a tool to process a document, or click below to load an instant demonstration document.
              </p>
              {onOpenSample && (
                <button
                  onClick={onOpenSample}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-md cursor-pointer"
                >
                  Load Demo PDF
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
