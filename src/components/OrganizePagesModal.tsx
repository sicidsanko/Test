import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';
import {
  X,
  RotateCw,
  Copy,
  Trash2,
  Plus,
  ArrowLeft,
  ArrowRight,
  Check,
  Save,
  Layers,
} from 'lucide-react';
import { LoadedFile } from '../types/pdf';

interface PageItem {
  id: string;
  originalIndex: number;
  rotation: number;
  thumbnailUrl: string;
  isBlank?: boolean;
}

interface OrganizePagesModalProps {
  file: LoadedFile;
  onClose: () => void;
  onSaveOrganizedPdf: (data: Uint8Array, fileName: string) => void;
}

export const OrganizePagesModal: React.FC<OrganizePagesModalProps> = ({
  file,
  onClose,
  onSaveOrganizedPdf,
}) => {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load and render all page thumbnails via PDF.js
  useEffect(() => {
    let active = true;
    pdfjsLib.getDocument({ data: file.data }).promise.then(async doc => {
      const items: PageItem[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;

        items.push({
          id: `page-${i}-${Date.now()}`,
          originalIndex: i - 1,
          rotation: 0,
          thumbnailUrl: canvas.toDataURL('image/jpeg', 0.8),
        });
      }
      if (active) {
        setPages(items);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [file]);

  const handleRotate = (index: number) => {
    setPages(prev =>
      prev.map((p, idx) => (idx === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const handleDuplicate = (index: number) => {
    const target = pages[index];
    const newPage: PageItem = {
      ...target,
      id: `copy-${Date.now()}`,
    };
    const updated = [...pages];
    updated.splice(index + 1, 0, newPage);
    setPages(updated);
  };

  const handleDelete = (index: number) => {
    if (pages.length <= 1) {
      alert('A PDF must contain at least one page.');
      return;
    }
    setPages(prev => prev.filter((_, idx) => idx !== index));
    setSelectedPageIndex(null);
  };

  const handleInsertBlank = (index: number) => {
    // Generate blank white canvas thumbnail
    const blankCanvas = document.createElement('canvas');
    blankCanvas.width = 150;
    blankCanvas.height = 210;
    const ctx = blankCanvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 150, 210);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(4, 4, 142, 202);

    const blankPage: PageItem = {
      id: `blank-${Date.now()}`,
      originalIndex: -1,
      rotation: 0,
      thumbnailUrl: blankCanvas.toDataURL(),
      isBlank: true,
    };

    const updated = [...pages];
    updated.splice(index + 1, 0, blankPage);
    setPages(updated);
  };

  const movePage = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= pages.length) return;
    const updated = [...pages];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setPages(updated);
    setSelectedPageIndex(toIndex);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const srcDoc = await PDFDocument.load(file.data);
      const newDoc = await PDFDocument.create();

      for (const p of pages) {
        if (p.isBlank) {
          const blank = newDoc.addPage([595.28, 841.89]);
          if (p.rotation !== 0) blank.setRotation(degrees(p.rotation));
        } else {
          const [copiedPage] = await newDoc.copyPages(srcDoc, [p.originalIndex]);
          if (p.rotation !== 0) {
            const current = copiedPage.getRotation().angle;
            copiedPage.setRotation(degrees((current + p.rotation) % 360));
          }
          newDoc.addPage(copiedPage);
        }
      }

      const savedBytes = await newDoc.save();
      onSaveOrganizedPdf(savedBytes, `Organized_${file.name}`);
      onClose();
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-4xl h-[90vh] bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden text-stone-900 dark:text-stone-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Layers size={20} className="text-red-600" />
            <div>
              <h3 className="font-bold text-sm">Organize PDF Pages</h3>
              <p className="text-[11px] text-stone-500">{pages.length} pages total • Reorder, rotate, duplicate, or delete</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleInsertBlank(pages.length - 1)}
              className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <Plus size={14} />
              <span>Insert Blank Page</span>
            </button>
            <button
              disabled={isSaving}
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <Save size={14} />
              <span>{isSaving ? 'Saving...' : 'Save PDF'}</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Page Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-sm font-semibold text-stone-400">
              Rendering page thumbnails with PDF.js...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {pages.map((p, idx) => {
                const isSelected = selectedPageIndex === idx;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPageIndex(idx)}
                    className={`relative p-2.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-red-600 bg-red-50/50 dark:bg-red-950/40 shadow-md'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/80 hover:border-stone-400'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div
                      className="w-full aspect-3/4 rounded-xl overflow-hidden bg-white shadow-inner flex items-center justify-center border border-stone-200/60 dark:border-stone-700/60 transition-transform"
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                    >
                      <img src={p.thumbnailUrl} alt={`Page ${idx + 1}`} className="w-full h-full object-contain" />
                    </div>

                    {/* Page number */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-100 dark:border-stone-700 text-xs">
                      <span className="font-bold text-stone-700 dark:text-stone-300">
                        {idx + 1} {p.isBlank ? '(Blank)' : ''}
                      </span>

                      {/* Action buttons on card */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            movePage(idx, 'left');
                          }}
                          disabled={idx === 0}
                          className="p-1 rounded text-stone-400 hover:text-stone-800 disabled:opacity-20 cursor-pointer"
                          title="Move Left"
                        >
                          <ArrowLeft size={13} />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            movePage(idx, 'right');
                          }}
                          disabled={idx === pages.length - 1}
                          className="p-1 rounded text-stone-400 hover:text-stone-800 disabled:opacity-20 cursor-pointer"
                          title="Move Right"
                        >
                          <ArrowRight size={13} />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleRotate(idx);
                          }}
                          className="p-1 rounded text-stone-400 hover:text-stone-800 cursor-pointer"
                          title="Rotate 90°"
                        >
                          <RotateCw size={13} />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDuplicate(idx);
                          }}
                          className="p-1 rounded text-stone-400 hover:text-stone-800 cursor-pointer"
                          title="Duplicate Page"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDelete(idx);
                          }}
                          className="p-1 rounded text-red-500 hover:text-red-700 cursor-pointer"
                          title="Delete Page"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
