import React, { useRef, useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Moon,
  Sun,
  Highlighter,
  PenTool,
  Stamp,
  MessageSquare,
  Underline as UnderlineIcon,
  Strikethrough as StrikeIcon,
  Save,
  Share2,
  Printer,
  X,
  FileText,
  RotateCw,
  LayoutGrid,
  Check,
  Edit3,
  Layers,
  ScanText,
} from 'lucide-react';
import { AnnotationItem } from '../types/pdf';
import { sharePdf, printPdfDocument } from '../utils/capacitorBridge';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.mjs';
}

interface MobiPdfReaderProps {
  pdfData: Uint8Array | null;
  fileName: string;
  onClose: () => void;
  onSaveAnnotatedPdf: (updatedData: Uint8Array, fileName: string) => void;
  onOpenEditor?: () => void;
  onOpenFillSign?: () => void;
  onOpenOrganize?: () => void;
  onOpenOcr?: () => void;
}

export const MobiPdfReader: React.FC<MobiPdfReaderProps> = ({
  pdfData,
  fileName,
  onClose,
  onSaveAnnotatedPdf,
  onOpenEditor,
  onOpenFillSign,
  onOpenOrganize,
  onOpenOcr,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.2);
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);
  const [pdfDocProxy, setPdfDocProxy] = useState<pdfjsLib.PDFDocumentProxy | null>(null);

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResultsCount, setSearchResultsCount] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Annotations state
  const [activeTool, setActiveTool] = useState<
    'none' | 'highlight' | 'underline' | 'strike' | 'pen' | 'stamp' | 'comment'
  >('none');
  const [penColor, setPenColor] = useState<string>('#ef4444');
  const [stampText, setStampText] = useState<string>('APPROVED');
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);

  // Comment dialog state
  const [commentDialogOpen, setCommentDialogOpen] = useState<boolean>(false);
  const [pendingCommentPos, setPendingCommentPos] = useState<{ x: number; y: number } | null>(null);
  const [commentInput, setCommentInput] = useState<string>('');

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Canvas refs
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const annotCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load PDF.js document
  useEffect(() => {
    if (!pdfData || pdfData.byteLength === 0) return;

    let isMounted = true;
    pdfjsLib.getDocument({ data: pdfData }).promise.then(async doc => {
      if (!isMounted) return;
      setPdfDocProxy(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);

      // Generate thumbnails for page reel
      const thumbs: string[] = [];
      const count = Math.min(doc.numPages, 12);
      for (let i = 1; i <= count; i++) {
        const p = await doc.getPage(i);
        const vp = p.getViewport({ scale: 0.25 });
        const c = document.createElement('canvas');
        c.width = vp.width;
        c.height = vp.height;
        const ctx = c.getContext('2d')!;
        await p.render({ canvasContext: ctx, viewport: vp, canvas: c }).promise;
        thumbs.push(c.toDataURL('image/jpeg', 0.8));
      }
      if (isMounted) setThumbnailUrls(thumbs);
    });

    return () => {
      isMounted = false;
    };
  }, [pdfData]);

  // Render current page
  useEffect(() => {
    if (!pdfDocProxy) return;

    pdfDocProxy.getPage(currentPage).then(page => {
      const canvas = pdfCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const viewport = page.getViewport({ scale: zoomScale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Sync annotation canvas dimensions
      if (annotCanvasRef.current) {
        annotCanvasRef.current.width = viewport.width;
        annotCanvasRef.current.height = viewport.height;
      }

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const renderContext = {
        canvasContext: ctx,
        viewport,
        canvas,
      };

      renderTaskRef.current = page.render(renderContext);
      renderTaskRef.current.promise
        .then(() => {
          redrawAnnotations();
        })
        .catch(() => {});
    });
  }, [pdfDocProxy, currentPage, zoomScale]);

  // Redraw annotations on top canvas
  const redrawAnnotations = () => {
    const canvas = annotCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pageAnnots = annotations.filter(a => a.pageIndex === currentPage - 1);
    for (const ann of pageAnnots) {
      if (ann.type === 'drawing' && ann.points && ann.points.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
      } else if (ann.type === 'highlight' && ann.rect) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
        ctx.fillRect(ann.rect.x, ann.rect.y, ann.rect.width, ann.rect.height);
      } else if (ann.type === 'underline' && ann.rect) {
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ann.rect.x, ann.rect.y + ann.rect.height);
        ctx.lineTo(ann.rect.x + ann.rect.width, ann.rect.y + ann.rect.height);
        ctx.stroke();
      } else if (ann.type === 'strike' && ann.rect) {
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ann.rect.x, ann.rect.y + ann.rect.height / 2);
        ctx.lineTo(ann.rect.x + ann.rect.width, ann.rect.y + ann.rect.height / 2);
        ctx.stroke();
      } else if (ann.type === 'stamp' && ann.rect) {
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.strokeRect(ann.rect.x, ann.rect.y, ann.rect.width, ann.rect.height);
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(ann.text || 'APPROVED', ann.rect.x + 12, ann.rect.y + 26);
      } else if (ann.type === 'comment' && ann.rect) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(ann.rect.x + 12, ann.rect.y + 12, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('💬', ann.rect.x + 6, ann.rect.y + 16);
      }
    }
  };

  // Perform PDF text search
  const handlePerformSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || !pdfDocProxy) {
      setSearchResultsCount(0);
      return;
    }

    setIsSearching(true);
    let count = 0;
    try {
      for (let i = 1; i <= pdfDocProxy.numPages; i++) {
        const page = await pdfDocProxy.getPage(i);
        const textContent = await page.getTextContent();
        const str = textContent.items.map((it: any) => it.str).join(' ');
        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = str.match(regex);
        if (matches) {
          count += matches.length;
        }
      }
      setSearchResultsCount(count);
    } catch (e) {
      // ignore
    } finally {
      setIsSearching(false);
    }
  };

  // Handle pointer down for drawing & annotations
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = annotCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (activeTool === 'pen') {
      setIsDrawing(true);
      setCurrentStroke([{ x, y }]);
    } else if (activeTool === 'stamp') {
      const newAnnot: AnnotationItem = {
        id: `st-${Date.now()}`,
        type: 'stamp',
        pageIndex: currentPage - 1,
        color: '#dc2626',
        text: stampText,
        rect: { x, y, width: 140, height: 38 },
      };
      setAnnotations(prev => [...prev, newAnnot]);
    } else if (activeTool === 'highlight') {
      const newAnnot: AnnotationItem = {
        id: `hl-${Date.now()}`,
        type: 'highlight',
        pageIndex: currentPage - 1,
        color: '#facc15',
        rect: { x: 40, y, width: canvas.width - 80, height: 20 },
      };
      setAnnotations(prev => [...prev, newAnnot]);
    } else if (activeTool === 'underline') {
      const newAnnot: AnnotationItem = {
        id: `ul-${Date.now()}`,
        type: 'underline',
        pageIndex: currentPage - 1,
        color: '#2563eb',
        rect: { x: 40, y, width: canvas.width - 80, height: 16 },
      };
      setAnnotations(prev => [...prev, newAnnot]);
    } else if (activeTool === 'strike') {
      const newAnnot: AnnotationItem = {
        id: `st-${Date.now()}`,
        type: 'strike',
        pageIndex: currentPage - 1,
        color: '#dc2626',
        rect: { x: 40, y, width: canvas.width - 80, height: 16 },
      };
      setAnnotations(prev => [...prev, newAnnot]);
    } else if (activeTool === 'comment') {
      setPendingCommentPos({ x, y });
      setCommentInput('Verified & confirmed.');
      setCommentDialogOpen(true);
    }
  };

  const handleSaveComment = () => {
    if (pendingCommentPos && commentInput.trim()) {
      const newAnnot: AnnotationItem = {
        id: `cmt-${Date.now()}`,
        type: 'comment',
        pageIndex: currentPage - 1,
        color: '#f59e0b',
        text: commentInput.trim(),
        rect: { x: pendingCommentPos.x, y: pendingCommentPos.y, width: 28, height: 28 },
      };
      setAnnotations(prev => [...prev, newAnnot]);
    }
    setCommentDialogOpen(false);
    setPendingCommentPos(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool !== 'pen') return;
    const canvas = annotCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    setCurrentStroke(prev => [...prev, { x, y }]);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    if (currentStroke.length > 0) {
      const last = currentStroke[currentStroke.length - 1];
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && activeTool === 'pen' && currentStroke.length > 1) {
      const newAnnot: AnnotationItem = {
        id: `pen-${Date.now()}`,
        type: 'drawing',
        pageIndex: currentPage - 1,
        color: penColor,
        points: currentStroke,
      };
      setAnnotations(prev => [...prev, newAnnot]);
    }
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  // Burn and save annotations permanently into the PDF with pdf-lib
  const handleBurnAndSave = async () => {
    if (!pdfData) return;
    try {
      const pdfDoc = await PDFDocument.load(pdfData);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      for (const ann of annotations) {
        if (ann.pageIndex < pdfDoc.getPageCount()) {
          const page = pdfDoc.getPage(ann.pageIndex);
          const { height } = page.getSize();

          if (ann.type === 'highlight' && ann.rect) {
            page.drawRectangle({
              x: ann.rect.x * 0.75,
              y: height - (ann.rect.y + ann.rect.height) * 0.75,
              width: ann.rect.width * 0.75,
              height: ann.rect.height * 0.75,
              color: rgb(0.98, 0.8, 0.08),
              opacity: 0.35,
            });
          } else if (ann.type === 'stamp' && ann.rect) {
            page.drawRectangle({
              x: ann.rect.x * 0.75,
              y: height - (ann.rect.y + ann.rect.height) * 0.75,
              width: ann.rect.width * 0.75,
              height: ann.rect.height * 0.75,
              borderColor: rgb(0.85, 0.15, 0.15),
              borderWidth: 2,
            });
            page.drawText(ann.text || 'APPROVED', {
              x: (ann.rect.x + 20) * 0.75,
              y: height - (ann.rect.y + 35) * 0.75,
              size: 16,
              font,
              color: rgb(0.85, 0.15, 0.15),
            });
          }
        }
      }

      const savedBytes = await pdfDoc.save();
      onSaveAnnotatedPdf(savedBytes, fileName);
      showToast('✓ Annotations saved into PDF!');
    } catch (err: any) {
      showToast(`Save error: ${err.message}`);
    }
  };

  const handleNativeShare = async () => {
    if (!pdfData) return;
    const blob = new Blob([pdfData as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    await sharePdf(url, fileName, pdfData);
  };

  const handleNativePrint = async () => {
    if (!pdfData) return;
    const blob = new Blob([pdfData as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    await printPdfDocument(url, fileName);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col ${
        isNightMode ? 'bg-stone-950 text-stone-100' : 'bg-stone-100 text-stone-900'
      } select-none`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 text-white px-4 py-2 rounded-2xl shadow-xl text-xs font-bold border border-stone-700 animate-in fade-in duration-200">
          {toastMessage}
        </div>
      )}

      {/* Top Reading Toolbar */}
      <div
        className={`h-14 px-3 sm:px-4 flex items-center justify-between border-b ${
          isNightMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
        } shrink-0 z-20`}
      >
        <div className="flex items-center space-x-2 truncate max-w-[35%] sm:max-w-[45%]">
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X size={18} />
          </button>
          <span className="font-bold text-xs truncate">{fileName}</span>
        </div>

        {/* Page Switcher */}
        <div className="flex items-center space-x-1 px-2 py-1 bg-stone-200/60 dark:bg-stone-800 rounded-full text-xs font-semibold">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="p-1 rounded-full disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="p-1 rounded-full disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded-xl cursor-pointer ${
              isSearchOpen ? 'bg-red-100 text-red-600 dark:bg-red-950/60' : 'hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
            title="Search text in document"
          >
            <Search size={16} />
          </button>
          <button
            onClick={() => setZoomScale(z => Math.max(0.6, z - 0.2))}
            className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer hidden xs:inline-flex"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => setZoomScale(z => Math.min(2.5, z + 0.2))}
            className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer hidden xs:inline-flex"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setIsNightMode(!isNightMode)}
            className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
            title="Toggle Night Mode"
          >
            {isNightMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
            title="Toggle Page Reel"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={handleNativeShare}
            className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
            title="Share via Android Share Sheet"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={handleBurnAndSave}
            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md cursor-pointer ml-1"
          >
            <Save size={14} />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>

      {/* In-App Text Search Bar */}
      {isSearchOpen && (
        <div
          className={`px-4 py-2 border-b flex items-center space-x-2 shrink-0 ${
            isNightMode ? 'bg-stone-900 border-stone-800' : 'bg-stone-50 border-stone-200'
          }`}
        >
          <Search size={15} className="text-stone-400" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={e => handlePerformSearch(e.target.value)}
            placeholder="Search text in document..."
            className="flex-1 bg-transparent text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden"
          />
          {isSearching && <span className="text-[11px] text-stone-400">Searching...</span>}
          {!isSearching && searchQuery && (
            <span className="text-[11px] font-bold text-red-600">
              {searchResultsCount} {searchResultsCount === 1 ? 'match' : 'matches'}
            </span>
          )}
          <button
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery('');
            }}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Secondary Annotation Toolbar */}
      <div
        className={`h-11 px-4 border-b flex items-center justify-between overflow-x-auto scrollbar-none text-xs shrink-0 ${
          isNightMode ? 'bg-stone-900 border-stone-800' : 'bg-stone-50 border-stone-200'
        }`}
      >
        <div className="flex items-center space-x-2">
          <span className="text-[10px] uppercase font-bold text-stone-400">Annotate:</span>
          {[
            { id: 'highlight', label: 'Highlight', icon: Highlighter },
            { id: 'underline', label: 'Underline', icon: UnderlineIcon },
            { id: 'strike', label: 'Strike', icon: StrikeIcon },
            { id: 'pen', label: 'Pen', icon: PenTool },
            { id: 'stamp', label: 'Stamp', icon: Stamp },
            { id: 'comment', label: 'Note', icon: MessageSquare },
          ].map(t => {
            const Icon = t.icon;
            const isSelected = activeTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTool(activeTool === t.id ? 'none' : (t.id as any))}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg cursor-pointer ${
                  isSelected
                    ? 'bg-red-600 text-white font-bold shadow-xs'
                    : 'hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}

          {activeTool === 'stamp' && (
            <div className="flex items-center space-x-1 pl-2">
              {['APPROVED', 'CONFIDENTIAL', 'VOID', 'PAID'].map(s => (
                <button
                  key={s}
                  onClick={() => setStampText(s)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    stampText === s ? 'bg-red-700 text-white' : 'bg-stone-200 dark:bg-stone-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {annotations.length > 0 && (
            <button
              onClick={() => setAnnotations([])}
              className="text-[11px] text-red-500 hover:underline cursor-pointer pl-3"
            >
              Clear ({annotations.length})
            </button>
          )}
        </div>

        {/* Quick Tools Shortcuts (Version 1 Only) */}
        <div className="hidden sm:flex items-center space-x-1 border-l border-stone-300 dark:border-stone-700 pl-3 shrink-0">
          {onOpenFillSign && (
            <button
              onClick={onOpenFillSign}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
            >
              <PenTool size={13} />
              <span className="text-[11px]">Fill & Sign</span>
            </button>
          )}
          {onOpenOrganize && (
            <button
              onClick={onOpenOrganize}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
            >
              <Layers size={13} />
              <span className="text-[11px]">Organize</span>
            </button>
          )}
        </div>
      </div>

      {/* Main View Area (Reel + Document Canvas) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Page Reel */}
        {showThumbnails && (
          <div
            className={`w-24 md:w-32 border-r p-2 overflow-y-auto space-y-2 shrink-0 ${
              isNightMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}
          >
            <p className="text-[10px] font-bold uppercase text-stone-400 text-center">Pages</p>
            {thumbnailUrls.map((thumb, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`p-1 rounded-lg border cursor-pointer transition-all ${
                  currentPage === idx + 1
                    ? 'border-red-600 bg-red-50 dark:bg-red-950/40 shadow-xs'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-400'
                }`}
              >
                <img
                  src={thumb}
                  alt={`Page ${idx + 1}`}
                  className="w-full aspect-3/4 object-cover rounded"
                />
                <span className="block text-center text-[10px] font-medium mt-1">{idx + 1}</span>
              </div>
            ))}
          </div>
        )}

        {/* Center Canvas Viewport */}
        <div className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center">
          <div
            className={`relative rounded-sm shadow-2xl overflow-hidden transition-all duration-150 ${
              isNightMode ? 'invert contrast-125' : ''
            }`}
          >
            {/* Base PDF Canvas */}
            <canvas ref={pdfCanvasRef} className="block" />

            {/* Overlay Annotations Canvas */}
            <canvas
              ref={annotCanvasRef}
              className={`absolute inset-0 cursor-${activeTool !== 'none' ? 'crosshair' : 'default'}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            />
          </div>
        </div>
      </div>

      {/* Note / Comment Modal */}
      {commentDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 w-full max-w-sm border border-stone-200 dark:border-stone-800 shadow-2xl space-y-3">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center space-x-2">
              <MessageSquare size={16} className="text-amber-500" />
              <span>Add Document Note</span>
            </h3>
            <textarea
              autoFocus
              rows={3}
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              className="w-full p-3 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs focus:outline-hidden focus:ring-2 focus:ring-red-500 resize-none"
              placeholder="Enter your comment..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setCommentDialogOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveComment}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
