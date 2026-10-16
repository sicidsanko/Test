import React, { useState, useRef } from 'react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import {
  X,
  Type,
  Square,
  Circle,
  PenTool,
  Image as ImageIcon,
  Save,
  Plus,
  Sliders,
  FilePlus,
  Check,
} from 'lucide-react';
import { LoadedFile } from '../types/pdf';

interface EditorElement {
  id: string;
  type: 'text' | 'rect' | 'circle' | 'image';
  text?: string;
  fontSize?: number;
  color: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  imageDataUrl?: string;
}

interface PdfEditorModalProps {
  file: LoadedFile | null;
  onClose: () => void;
  onSaveEditedPdf: (data: Uint8Array, fileName: string) => void;
}

export const PdfEditorModal: React.FC<PdfEditorModalProps> = ({
  file,
  onClose,
  onSaveEditedPdf,
}) => {
  const [isCreatingBlank, setIsCreatingBlank] = useState<boolean>(!file);
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pageStyle, setPageStyle] = useState<'blank' | 'lined' | 'grid'>('blank');

  // Element state
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [selectedTool, setSelectedTool] = useState<'text' | 'rect' | 'circle' | 'image' | 'none'>('text');
  const [textInput, setTextInput] = useState('Add Your Custom Text');
  const [fontSize, setFontSize] = useState(20);
  const [colorHex, setColorHex] = useState('#ef4444');
  const [isSaving, setIsSaving] = useState(false);

  // Add text element to page
  const handleAddText = () => {
    const newEl: EditorElement = {
      id: `el-${Date.now()}`,
      type: 'text',
      text: textInput,
      fontSize,
      color: colorHex,
      x: 80,
      y: 200 + elements.length * 40,
    };
    setElements(prev => [...prev, newEl]);
  };

  // Add rectangle
  const handleAddRect = () => {
    const newEl: EditorElement = {
      id: `el-${Date.now()}`,
      type: 'rect',
      color: colorHex,
      x: 100,
      y: 300,
      width: 180,
      height: 100,
    };
    setElements(prev => [...prev, newEl]);
  };

  // Add image element
  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newEl: EditorElement = {
        id: `el-${Date.now()}`,
        type: 'image',
        color: '#000000',
        x: 120,
        y: 250,
        width: 140,
        height: 140,
        imageDataUrl: reader.result as string,
      };
      setElements(prev => [...prev, newEl]);
    };
    reader.readAsDataURL(f);
  };

  const handleSaveDocument = async () => {
    setIsSaving(true);
    try {
      let pdfDoc: PDFDocument;

      if (isCreatingBlank || !file) {
        pdfDoc = await PDFDocument.create();
        const baseW = pageSize === 'A4' ? 595.28 : 612.0;
        const baseH = pageSize === 'A4' ? 841.89 : 792.0;
        const width = orientation === 'portrait' ? baseW : baseH;
        const height = orientation === 'portrait' ? baseH : baseW;
        const page = pdfDoc.addPage([width, height]);

        // Background styling (lined or grid)
        if (pageStyle === 'lined') {
          for (let y = 60; y < height - 60; y += 28) {
            page.drawLine({
              start: { x: 40, y },
              end: { x: width - 40, y },
              thickness: 0.5,
              color: rgb(0.85, 0.85, 0.85),
            });
          }
        } else if (pageStyle === 'grid') {
          for (let x = 40; x < width - 40; x += 25) {
            page.drawLine({
              start: { x, y: 40 },
              end: { x, y: height - 40 },
              thickness: 0.5,
              color: rgb(0.9, 0.9, 0.9),
            });
          }
          for (let y = 40; y < height - 40; y += 25) {
            page.drawLine({
              start: { x: 40, y },
              end: { x: width - 40, y },
              thickness: 0.5,
              color: rgb(0.9, 0.9, 0.9),
            });
          }
        }
      } else {
        pdfDoc = await PDFDocument.load(file.data);
      }

      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const page = pdfDoc.getPage(0);
      const { height } = page.getSize();

      // Burn all elements
      for (const el of elements) {
        if (el.type === 'text' && el.text) {
          page.drawText(el.text, {
            x: el.x,
            y: height - el.y,
            size: el.fontSize || 18,
            font,
            color: rgb(0.85, 0.15, 0.15),
          });
        } else if (el.type === 'rect' && el.width && el.height) {
          page.drawRectangle({
            x: el.x,
            y: height - el.y - el.height,
            width: el.width,
            height: el.height,
            borderColor: rgb(0.85, 0.15, 0.15),
            borderWidth: 2,
          });
        } else if (el.type === 'image' && el.imageDataUrl) {
          const imgBytes = await (await fetch(el.imageDataUrl)).arrayBuffer();
          const img = await pdfDoc.embedPng(imgBytes).catch(() => pdfDoc.embedJpg(imgBytes));
          page.drawImage(img, {
            x: el.x,
            y: height - el.y - (el.height || 100),
            width: el.width || 120,
            height: el.height || 120,
          });
        }
      }

      const savedBytes = await pdfDoc.save();
      const name = isCreatingBlank ? `New_Document_${Date.now()}.pdf` : `Edited_${file?.name || 'Doc.pdf'}`;
      onSaveEditedPdf(savedBytes, name);
      onClose();
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-3xl h-[88vh] bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden text-stone-900 dark:text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3 shrink-0">
          <div className="flex items-center space-x-2">
            <FilePlus size={22} className="text-red-600" />
            <div>
              <h3 className="font-bold text-sm">
                {isCreatingBlank ? 'Create Blank PDF Document' : 'PDF Page Editor'}
              </h3>
              <p className="text-[11px] text-stone-500">Add text, drawings, shapes, and images</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-stone-400 hover:text-stone-700">
            <X size={18} />
          </button>
        </div>

        {/* Blank PDF Setup Section (if blank) */}
        {isCreatingBlank && (
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-3 shrink-0">
            <h4 className="font-bold text-xs uppercase text-stone-600 dark:text-stone-300">
              Page Specifications
            </h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-stone-500 block mb-1">Paper Size</label>
                <select
                  value={pageSize}
                  onChange={e => setPageSize(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                >
                  <option value="A4">A4 (210 × 297 mm)</option>
                  <option value="Letter">US Letter</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-stone-500 block mb-1">Orientation</label>
                <select
                  value={orientation}
                  onChange={e => setOrientation(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-stone-500 block mb-1">Template Style</label>
                <select
                  value={pageStyle}
                  onChange={e => setPageStyle(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                >
                  <option value="blank">Plain White</option>
                  <option value="lined">Ruled / Lined</option>
                  <option value="grid">Grid / Math</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center space-x-2 py-2 border-b border-stone-200 dark:border-stone-800 text-xs shrink-0 overflow-x-auto">
          <div className="flex items-center space-x-1">
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Text to add..."
              className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs w-44"
            />
            <button
              onClick={handleAddText}
              className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 flex items-center space-x-1 cursor-pointer"
            >
              <Type size={14} />
              <span>Add Text</span>
            </button>
          </div>

          <button
            onClick={handleAddRect}
            className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center space-x-1 cursor-pointer"
          >
            <Square size={14} />
            <span>Add Box</span>
          </button>

          <label className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center space-x-1 cursor-pointer">
            <ImageIcon size={14} />
            <span>Add Photo</span>
            <input type="file" accept="image/*" onChange={handleAddImage} className="hidden" />
          </label>
        </div>

        {/* Preview Sheet Canvas */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-stone-100 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800">
          <div
            className="w-[420px] h-[580px] bg-white rounded-lg shadow-xl relative border border-stone-300 p-6 overflow-hidden"
            style={{
              backgroundImage:
                pageStyle === 'lined'
                  ? 'repeating-linear-gradient(transparent, transparent 27px, #e2e8f0 28px)'
                  : pageStyle === 'grid'
                  ? 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)'
                  : 'none',
              backgroundSize: pageStyle === 'grid' ? '25px 25px' : 'auto',
            }}
          >
            <div className="absolute top-4 right-4 text-[9px] text-stone-400 font-bold uppercase">
              {pageSize} • {pageStyle.toUpperCase()}
            </div>

            {/* Rendered editor elements */}
            {elements.map(el => (
              <div
                key={el.id}
                style={{ position: 'absolute', left: el.x, top: el.y }}
                className="group cursor-move select-none"
              >
                {el.type === 'text' && (
                  <span
                    style={{ fontSize: el.fontSize, color: el.color }}
                    className="font-bold border border-transparent group-hover:border-red-400 p-0.5 rounded"
                  >
                    {el.text}
                  </span>
                )}
                {el.type === 'rect' && (
                  <div
                    style={{
                      width: el.width,
                      height: el.height,
                      borderColor: el.color,
                      borderWidth: 2,
                    }}
                    className="border-dashed group-hover:border-solid bg-red-500/10"
                  />
                )}
                {el.type === 'image' && (
                  <img
                    src={el.imageDataUrl}
                    alt="Embedded"
                    style={{ width: el.width, height: el.height }}
                    className="object-contain border border-stone-300 rounded shadow-xs"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex space-x-3 pt-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            disabled={isSaving}
            onClick={handleSaveDocument}
            className="flex-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Save size={14} />
            <span>{isSaving ? 'Saving...' : 'Save Document'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
