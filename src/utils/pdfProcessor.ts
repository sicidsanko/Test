import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { PDFDocument as CantooPDFDocument } from '@cantoo/pdf-lib';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import {
  SplitOptions,
  RotateOptions,
  WatermarkOptions,
  PageNumberOptions,
  ImageToPdfOptions,
  SignOptions,
  LoadedFile,
} from '../types/pdf';
import { parsePageRanges, formatPageNumber } from './pdfEngineLogic';

// Configure local PDF.js worker path (bundled locally, no CDN)
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.mjs';
}

export interface ProcessResult {
  data: Uint8Array;
  fileName: string;
  pageCount: number;
  previewUrl: string;
  size: number;
  extractedImages?: string[];
  summaryText?: string;
  ocrText?: string;
}

/**
 * 1. Merge multiple PDFs into a single document using pdf-lib.
 */
export async function mergePdfs(files: LoadedFile[], outputName = 'merged_document.pdf'): Promise<ProcessResult> {
  if (files.length === 0) throw new Error('At least one PDF file is required to merge.');

  const mergedDoc = await PDFDocument.create();

  for (const file of files) {
    const srcDoc = await PDFDocument.load(file.data);
    const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    copiedPages.forEach(page => mergedDoc.addPage(page));
  }

  const pdfBytes = await mergedDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const previewUrl = URL.createObjectURL(blob);

  return {
    data: pdfBytes,
    fileName: outputName,
    pageCount: mergedDoc.getPageCount(),
    previewUrl,
    size: pdfBytes.byteLength,
  };
}

/**
 * 2. Split PDF by page range or extract pages.
 */
export async function splitPdf(
  file: LoadedFile,
  options: SplitOptions,
  outputName = 'split_document.pdf'
): Promise<ProcessResult> {
  const srcDoc = await PDFDocument.load(file.data);
  const totalPages = srcDoc.getPageCount();
  const splitDoc = await PDFDocument.create();

  let targetIndices: number[] = [];

  if (options.mode === 'ranges') {
    targetIndices = parsePageRanges(options.rangeString, totalPages);
    if (targetIndices.length === 0) {
      targetIndices = [0]; // fallback
    }
  } else if (options.mode === 'every_n') {
    const n = Math.max(1, options.everyN || 1);
    for (let i = 0; i < totalPages; i += n) {
      targetIndices.push(i);
    }
  } else {
    // extract all
    targetIndices = srcDoc.getPageIndices();
  }

  const copiedPages = await splitDoc.copyPages(srcDoc, targetIndices);
  copiedPages.forEach(page => splitDoc.addPage(page));

  const pdfBytes = await splitDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const previewUrl = URL.createObjectURL(blob);

  return {
    data: pdfBytes,
    fileName: outputName,
    pageCount: splitDoc.getPageCount(),
    previewUrl,
    size: pdfBytes.byteLength,
  };
}

/**
 * 3. Remove specified pages.
 */
export async function removePages(
  file: LoadedFile,
  pagesToRemove: number[], // 0-indexed
  outputName = 'pages_removed.pdf'
): Promise<ProcessResult> {
  const srcDoc = await PDFDocument.load(file.data);
  const totalPages = srcDoc.getPageCount();
  const newDoc = await PDFDocument.create();

  const removeSet = new Set(pagesToRemove);
  const pagesToKeep: number[] = [];

  for (let i = 0; i < totalPages; i++) {
    if (!removeSet.has(i)) {
      pagesToKeep.push(i);
    }
  }

  if (pagesToKeep.length === 0) {
    throw new Error('Cannot remove all pages from the document.');
  }

  const copiedPages = await newDoc.copyPages(srcDoc, pagesToKeep);
  copiedPages.forEach(p => newDoc.addPage(p));

  const pdfBytes = await newDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const previewUrl = URL.createObjectURL(blob);

  return {
    data: pdfBytes,
    fileName: outputName,
    pageCount: newDoc.getPageCount(),
    previewUrl,
    size: pdfBytes.byteLength,
  };
}

/**
 * 4. Rotate pages (90, 180, 270 degrees).
 */
export async function rotatePdf(
  file: LoadedFile,
  options: RotateOptions,
  outputName = 'rotated_document.pdf'
): Promise<ProcessResult> {
  const pdfDoc = await PDFDocument.load(file.data);
  const totalPages = pdfDoc.getPageCount();

  const targetPages =
    options.applyTo === 'all'
      ? pdfDoc.getPages()
      : options.pages
          .filter(idx => idx >= 0 && idx < totalPages)
          .map(idx => pdfDoc.getPage(idx));

  for (const page of targetPages) {
    const currentAngle = page.getRotation().angle;
    page.setRotation(degrees((currentAngle + options.angle) % 360));
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const previewUrl = URL.createObjectURL(blob);

  return {
    data: pdfBytes,
    fileName: outputName,
    pageCount: pdfDoc.getPageCount(),
    previewUrl,
    size: pdfBytes.byteLength,
  };
}

/**
 * 5. Add Watermark.
 */
export async function addWatermark(
  file: LoadedFile,
  options: WatermarkOptions,
  outputName = 'watermarked_document.pdf'
): Promise<ProcessResult> {
  const pdfDoc = await PDFDocument.load(file.data);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
    const textHeight = font.heightAtSize(options.fontSize);

    let x = (width - textWidth) / 2;
    let y = (height - textHeight) / 2;

    if (options.position === 'top-left') {
      x = 40;
      y = height - 60;
    } else if (options.position === 'top-right') {
      x = width - textWidth - 40;
      y = height - 60;
    } else if (options.position === 'bottom-left') {
      x = 40;
      y = 40;
    } else if (options.position === 'bottom-right') {
      x = width - textWidth - 40;
      y = 40;
    } else if (options.position === 'bottom-center') {
      x = (width - textWidth) / 2;
      y = 40;
    }

    page.drawText(options.text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0.8, 0.1, 0.1),
      opacity: options.opacity,
      rotate: degrees(options.rotation),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const previewUrl = URL.createObjectURL(blob);

  return {
    data: pdfBytes,
    fileName: outputName,
    pageCount: pdfDoc.getPageCount(),
    previewUrl,
    size: pdfBytes.byteLength,
  };
}

/**
 * 6. Add Page Numbers.
 */
export async function addPageNumbers(
  file: LoadedFile,
  options: PageNumberOptions,
  outputName = 'numbered_document.pdf'
): Promise<ProcessResult> {
  const pdfDoc = await PDFDocument.load(file.data);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const total = pages.length;

  pages.forEach((page, idx) => {
    const { width, height } = page.getSize();
    const text = formatPageNumber(options.format, idx + (options.startNumber || 1), total);
    const textSize = 10;
    const textWidth = font.widthOfTextAtSize(text, textSize);

    let x = (width - textWidth) / 2;
    let y = 30;

    if (options.position === 'bottom-right') {
      x = width - textWidth - 40;
      y = 30;
    } else if (options.position === 'bottom-left') {
      x = 40;
      y = 30;
    } else if (options.position === 'top-right') {
      x = width - textWidth - 40;
      y = height - 30;
    }

    page.drawText(text, {
      x,
      y,
      size: textSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const previewUrl = URL.createObjectURL(blob);

  return {
    data: pdfBytes,
    fileName: outputName,
    pageCount: pdfDoc.getPageCount(),
    previewUrl,
    size: pdfBytes.byteLength,
  };
}

/**
 * 7. Convert Images to PDF using jsPDF.
 */
export async function imagesToPdf(
  images: { dataUrl: string; format?: 'jpeg' | 'png' }[],
  options: ImageToPdfOptions,
  outputName = 'images_converted.pdf'
): Promise<ProcessResult> {
  const isLandscape = options.orientation === 'landscape';
  const format = options.pageSize === 'Letter' ? 'letter' : 'a4';

  const doc = new jsPDF({
    orientation: isLandscape ? 'l' : 'p',
    unit: 'pt',
    format: format,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = options.margin || 20;

  for (let i = 0; i < images.length; i++) {
    if (i > 0) doc.addPage(format, isLandscape ? 'l' : 'p');

    const img = images[i];
    const availableW = pageWidth - margin * 2;
    const availableH = pageHeight - margin * 2;

    doc.addImage(
      img.dataUrl,
      img.format === 'png' ? 'PNG' : 'JPEG',
      margin,
      margin,
      availableW,
      availableH,
      undefined,
      'FAST'
    );
  }

  const arrayBuffer = doc.output('arraybuffer');
  const pdfBytes = new Uint8Array(arrayBuffer);
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const previewUrl = URL.createObjectURL(blob);

  return {
    data: pdfBytes,
    fileName: outputName,
    pageCount: images.length,
    previewUrl,
    size: pdfBytes.byteLength,
  };
}

/**
 * 8. Compress PDF (optimize object streams & rebuild).
 */
export async function compressPdf(
  file: LoadedFile,
  level: 'low' | 'recommended' | 'extreme',
  outputName = 'compressed_document.pdf'
): Promise<ProcessResult> {
  const srcDoc = await PDFDocument.load(file.data);

  const pdfBytes = await srcDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const previewUrl = URL.createObjectURL(blob);

  return {
    data: pdfBytes,
    fileName: outputName,
    pageCount: srcDoc.getPageCount(),
    previewUrl,
    size: pdfBytes.byteLength,
  };
}

/**
 * 9. Password Protect PDF using @cantoo/pdf-lib (supports standard encryption).
 */
export async function protectPdfWithPassword(
  file: LoadedFile,
  userPassword: string,
  outputName = 'protected_document.pdf'
): Promise<ProcessResult> {
  const doc = await CantooPDFDocument.load(file.data);

  // Apply password encryption
  doc.encrypt({
    userPassword: userPassword,
    ownerPassword: userPassword + '_owner',
    permissions: {
      printing: 'highResolution',
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: false,
      contentAccessibility: true,
      documentAssembly: false,
    },
  });

  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const previewUrl = URL.createObjectURL(blob);

  return {
    data: pdfBytes,
    fileName: outputName,
    pageCount: doc.getPageCount(),
    previewUrl,
    size: pdfBytes.byteLength,
  };
}

/**
 * 10. Unlock PDF using @cantoo/pdf-lib.
 */
export async function unlockPdfWithPassword(
  file: LoadedFile,
  password: string,
  outputName = 'unlocked_document.pdf'
): Promise<ProcessResult> {
  // Load with password
  const doc = await CantooPDFDocument.load(file.data, {
    password: password,
  } as any);

  // Save unencrypted
  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const previewUrl = URL.createObjectURL(blob);

  return {
    data: pdfBytes,
    fileName: outputName,
    pageCount: doc.getPageCount(),
    previewUrl,
    size: pdfBytes.byteLength,
  };
}

/**
 * 11. Sign PDF: stamp drawn PNG signature onto target page.
 */
export async function signPdf(
  file: LoadedFile,
  options: SignOptions,
  outputName = 'signed_document.pdf'
): Promise<ProcessResult> {
  const pdfDoc = await PDFDocument.load(file.data);
  const targetPage = pdfDoc.getPage(Math.min(options.pageIndex, pdfDoc.getPageCount() - 1));

  const sigBytes = await (await fetch(options.signatureDataUrl)).arrayBuffer();
  const embeddedSig = await pdfDoc.embedPng(sigBytes);

  targetPage.drawImage(embeddedSig, {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const previewUrl = URL.createObjectURL(blob);

  return {
    data: pdfBytes,
    fileName: outputName,
    pageCount: pdfDoc.getPageCount(),
    previewUrl,
    size: pdfBytes.byteLength,
  };
}

/**
 * 12. Redact PDF zone.
 */
export async function redactPdf(
  file: LoadedFile,
  pageIndex: number,
  box: { x: number; y: number; width: number; height: number },
  outputName = 'redacted_document.pdf'
): Promise<ProcessResult> {
  const pdfDoc = await PDFDocument.load(file.data);
  const page = pdfDoc.getPage(Math.min(pageIndex, pdfDoc.getPageCount() - 1));

  page.drawRectangle({
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    color: rgb(0, 0, 0),
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const previewUrl = URL.createObjectURL(blob);

  return {
    data: pdfBytes,
    fileName: outputName,
    pageCount: pdfDoc.getPageCount(),
    previewUrl,
    size: pdfBytes.byteLength,
  };
}

/**
 * 13. Perform Offline OCR using Tesseract.js bundled locally.
 */
export async function performOfflineOcr(
  imageOrCanvas: string | HTMLCanvasElement,
  onProgress?: (progress: number) => void
): Promise<string> {
  const worker = await createWorker('eng', 1, {
    workerPath: '/workers/tesseract-worker.min.js',
    corePath: '/workers',
    logger: m => {
      if (m.status === 'recognizing text' && m.progress) {
        onProgress?.(Math.round(m.progress * 100));
      }
    },
  });

  try {
    const ret = await worker.recognize(imageOrCanvas);
    await worker.terminate();
    return ret.data.text || 'No text recognized.';
  } catch (err: any) {
    await worker.terminate();
    throw new Error(`OCR processing error: ${err.message}`);
  }
}

/**
 * 14. Render PDF page using pdfjs-dist.
 */
export async function renderPdfPageToCanvas(
  pdfBytes: Uint8Array,
  pageNumber: number = 1,
  scale: number = 1.5
): Promise<HTMLCanvasElement> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(Math.min(pageNumber, pdf.numPages));

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
  };

  await page.render(renderContext).promise;
  return canvas;
}

/**
 * 15. Generate high-quality page thumbnails via pdfjs-dist.
 */
export async function generatePdfThumbnails(
  pdfBytes: Uint8Array,
  maxPages: number = 10
): Promise<string[]> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;
    const count = Math.min(pdf.numPages, maxPages);
    const thumbnails: string[] = [];

    for (let i = 1; i <= count; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.35 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;

      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      thumbnails.push(canvas.toDataURL('image/jpeg', 0.8));
    }

    return thumbnails;
  } catch (err) {
    console.warn('Thumbnail generation fallback:', err);
    return [];
  }
}
