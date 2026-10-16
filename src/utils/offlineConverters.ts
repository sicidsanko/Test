/**
 * 100% On-Device Offline Document & PDF Conversion Engine.
 * Supports Word, Excel, PowerPoint, Images, ePub, and PDF conversions
 * using local JS libraries (mammoth, docx, xlsx, jspdf, jspdf-autotable, pptxgenjs, html2canvas, pdfjs-dist, JSZip).
 */

import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { ProcessResult } from './pdfProcessor';

// Configure local PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.mjs';
}

/**
 * 1. Images to PDF (JPEG/PNG -> PDF using jsPDF)
 */
export async function convertImagesToPdf(
  images: { dataUrl: string; format: string }[],
  outputName: string = 'Converted_Images.pdf'
): Promise<ProcessResult> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 0; i < images.length; i++) {
    if (i > 0) doc.addPage();
    const img = images[i];
    doc.addImage(img.dataUrl, img.format.toUpperCase(), 10, 10, pageWidth - 20, pageHeight - 20);
  }

  const pdfOutput = doc.output('arraybuffer');
  const data = new Uint8Array(pdfOutput);
  const blob = new Blob([data as unknown as BlobPart], { type: 'application/pdf' });
  const previewUrl = URL.createObjectURL(blob);

  return {
    data,
    fileName: outputName,
    pageCount: images.length,
    previewUrl,
    size: data.byteLength,
  };
}

/**
 * 2. PDF to JPG/PNG (Extract each page as an image)
 */
export async function convertPdfToImages(
  pdfBytes: Uint8Array,
  format: 'jpeg' | 'png' = 'jpeg'
): Promise<{ dataUrl: string; name: string }[]> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdfDoc = await loadingTask.promise;
  const results: { dataUrl: string; name: string }[] = [];

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const dataUrl = canvas.toDataURL(`image/${format}`, 0.9);
    results.push({
      dataUrl,
      name: `Page_${i}.${format === 'jpeg' ? 'jpg' : 'png'}`,
    });
  }

  return results;
}

/**
 * 3. Word (.docx) to PDF (mammoth -> HTML -> html2canvas -> jsPDF)
 */
export async function convertDocxToPdf(
  docxBuffer: ArrayBuffer,
  outputName: string = 'Word_Document.pdf'
): Promise<ProcessResult> {
  const result = await mammoth.convertToHtml({ arrayBuffer: docxBuffer });
  const htmlString = result.value || '<p>Empty Document</p>';

  // Create temporary container for html2canvas rendering
  const container = document.createElement('div');
  container.innerHTML = `
    <div style="font-family: Arial, sans-serif; padding: 40px; color: #111; background: #fff; width: 700px;">
      ${htmlString}
    </div>
  `;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  const canvas = await html2canvas(container, { scale: 1.5, useCORS: true });
  document.body.removeChild(container);

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = (canvas.height * pageWidth) / canvas.width;

  doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);

  const pdfOutput = doc.output('arraybuffer');
  const data = new Uint8Array(pdfOutput);
  const blob = new Blob([data as unknown as BlobPart], { type: 'application/pdf' });

  return {
    data,
    fileName: outputName,
    pageCount: Math.max(1, Math.ceil(pageHeight / 297)),
    previewUrl: URL.createObjectURL(blob),
    size: data.byteLength,
  };
}

/**
 * 4. PDF to Word (.docx) (Extract text with pdfjs-dist and build with docx library)
 */
export async function convertPdfToDocx(
  pdfBytes: Uint8Array,
  outputName: string = 'Converted_Document.docx'
): Promise<{ data: Uint8Array; fileName: string }> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdfDoc = await loadingTask.promise;
  const paragraphs: Paragraph[] = [];

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const textStr = textContent.items.map((item: any) => item.str).join(' ');

    paragraphs.push(
      new Paragraph({
        children: [new TextRun(`--- Page ${i} ---`)],
        heading: HeadingLevel.HEADING_2,
      })
    );

    // Break into sentence paragraphs
    const sentences = textStr.split(/(?<=[.?!])\s+/);
    for (const sentence of sentences) {
      if (sentence.trim()) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun(sentence)],
          })
        );
      }
    }
  }

  const doc = new DocxDocument({
    sections: [{ properties: {}, children: paragraphs }],
  });

  const buffer = await Packer.toBuffer(doc);
  const data = new Uint8Array(buffer);
  return { data, fileName: outputName };
}

/**
 * 5. Excel (.xlsx) to PDF (SheetJS + jspdf-autotable)
 */
export async function convertExcelToPdf(
  excelBuffer: ArrayBuffer,
  outputName: string = 'Spreadsheet.pdf'
): Promise<ProcessResult> {
  const workbook = XLSX.read(excelBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(16);
  doc.text(`Spreadsheet: ${firstSheetName}`, 14, 15);

  const head = jsonData.length > 0 ? jsonData[0] : [];
  const body = jsonData.length > 1 ? jsonData.slice(1) : [];

  (doc as any).autoTable({
    startY: 22,
    head: [head],
    body: body,
    theme: 'grid',
    styles: { fontSize: 9 },
  });

  const pdfOutput = doc.output('arraybuffer');
  const data = new Uint8Array(pdfOutput);
  const blob = new Blob([data as unknown as BlobPart], { type: 'application/pdf' });

  return {
    data,
    fileName: outputName,
    pageCount: doc.getNumberOfPages(),
    previewUrl: URL.createObjectURL(blob),
    size: data.byteLength,
  };
}

/**
 * 6. PDF to Excel (.xlsx) (Extract text items and write with SheetJS)
 */
export async function convertPdfToExcel(
  pdfBytes: Uint8Array,
  outputName: string = 'Extracted_Table.xlsx'
): Promise<{ data: Uint8Array; fileName: string }> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdfDoc = await loadingTask.promise;
  const rows: any[][] = [['Page', 'Text Line Content']];

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    for (const item of textContent.items as any[]) {
      if (item.str && item.str.trim()) {
        rows.push([i, item.str.trim()]);
      }
    }
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracted Data');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Uint8Array(excelBuffer);
  return { data, fileName: outputName };
}

/**
 * 7. PowerPoint (.pptx) to PDF (JSZip XML extraction -> jsPDF)
 */
export async function convertPptxToPdf(
  pptxBuffer: ArrayBuffer,
  outputName: string = 'Presentation.pdf'
): Promise<ProcessResult> {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(pptxBuffer);

  // Extract slide text from ppt/slides/slide*.xml
  const slideFiles = Object.keys(zipContent.files).filter(filename =>
    filename.match(/ppt\/slides\/slide\d+\.xml/)
  );

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 0; i < slideFiles.length; i++) {
    if (i > 0) doc.addPage();
    const slidePath = slideFiles[i];
    const xmlText = await zipContent.files[slidePath].async('text');

    // Simple regex extraction of text nodes <a:t>text</a:t>
    const matches = xmlText.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
    const slideTexts = matches.map(m => m.replace(/<[^>]+>/g, ''));

    // Draw slide background & content
    doc.setFillColor(245, 247, 250);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text(`Slide ${i + 1}`, 20, 25);

    doc.setFontSize(14);
    doc.setTextColor(71, 85, 105);
    let y = 45;
    for (const text of slideTexts.slice(0, 15)) {
      doc.text(`• ${text}`, 25, y);
      y += 12;
      if (y > pageHeight - 20) break;
    }
  }

  if (slideFiles.length === 0) {
    doc.text('PowerPoint Presentation (Converted Offline)', 20, 30);
  }

  const pdfOutput = doc.output('arraybuffer');
  const data = new Uint8Array(pdfOutput);
  const blob = new Blob([data as unknown as BlobPart], { type: 'application/pdf' });

  return {
    data,
    fileName: outputName,
    pageCount: Math.max(1, slideFiles.length),
    previewUrl: URL.createObjectURL(blob),
    size: data.byteLength,
  };
}

/**
 * 8. PDF to PowerPoint (.pptx) (pdfjs-dist render -> pptxgenjs)
 */
export async function convertPdfToPptx(
  pdfBytes: Uint8Array,
  outputName: string = 'Presentation.pptx'
): Promise<{ data: Uint8Array; fileName: string }> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdfDoc = await loadingTask.promise;

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    const slide = pptx.addSlide();
    slide.addImage({ data: dataUrl, x: 0.5, y: 0.5, w: 9.0, h: 5.0 });
  }

  const pptxBlob = (await pptx.write({ outputType: 'arraybuffer' })) as ArrayBuffer;
  const data = new Uint8Array(pptxBlob);
  return { data, fileName: outputName };
}

/**
 * 9. PDF to ePub (Extract text and package into ePub structure via JSZip)
 */
export async function convertPdfToEpub(
  pdfBytes: Uint8Array,
  outputName: string = 'Document.epub'
): Promise<{ data: Uint8Array; fileName: string }> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdfDoc = await loadingTask.promise;
  let allText = '';

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    allText += `<p><b>Page ${i}</b><br/>` + textContent.items.map((it: any) => it.str).join(' ') + '</p>';
  }

  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip');
  zip.folder('META-INF')?.file(
    'container.xml',
    `<?xml version="1.0"?>
    <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
      <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
      </rootfiles>
    </container>`
  );

  const oebps = zip.folder('OEBPS');
  oebps?.file(
    'content.opf',
    `<?xml version="1.0" encoding="utf-8"?>
    <package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid" version="2.0">
      <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:title>Converted ePub Document</dc:title>
        <dc:language>en</dc:language>
        <dc:identifier id="uid">urn:uuid:12345-67890</dc:identifier>
      </metadata>
      <manifest>
        <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
      </manifest>
      <spine toc="ncx">
        <itemref idref="chapter1"/>
      </spine>
    </package>`
  );

  oebps?.file(
    'chapter1.xhtml',
    `<?xml version="1.0" encoding="utf-8"?>
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head><title>Chapter 1</title></head>
    <body>
      <h1>Converted Document</h1>
      ${allText}
    </body>
    </html>`
  );

  oebps?.file(
    'toc.ncx',
    `<?xml version="1.0" encoding="utf-8"?>
    <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1.0">
      <head><meta name="dtb:uid" content="urn:uuid:12345-67890"/></head>
      <docTitle><text>Converted ePub Document</text></docTitle>
      <navMap>
        <navPoint id="np-1" playOrder="1">
          <navLabel><text>Start</text></navLabel>
          <content src="chapter1.xhtml"/>
        </navPoint>
      </navMap>
    </ncx>`
  );

  const epubBlob = await zip.generateAsync({ type: 'arraybuffer', mimeType: 'application/epub+zip' });
  const data = new Uint8Array(epubBlob);
  return { data, fileName: outputName };
}
