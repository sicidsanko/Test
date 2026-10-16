import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { LoadedFile } from '../types/pdf';

/**
 * Creates a clean, realistic multi-page PDF document in memory.
 */
export async function createSamplePdf(
  title: string,
  pageCount: number = 3,
  themeColor: { r: number; g: number; b: number } = { r: 0.89, g: 0.19, b: 0.18 }
): Promise<LoadedFile> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (let i = 1; i <= pageCount; i++) {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
    const { width, height } = page.getSize();

    // Top Header Banner
    page.drawRectangle({
      x: 0,
      y: height - 80,
      width: width,
      height: 80,
      color: rgb(themeColor.r, themeColor.g, themeColor.b),
    });

    // Header Title
    page.drawText(title, {
      x: 40,
      y: height - 50,
      size: 22,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Subtitle
    page.drawText(`Page ${i} of ${pageCount} | iLovePDF Android Test Document`, {
      x: 40,
      y: height - 70,
      size: 11,
      font: font,
      color: rgb(0.95, 0.95, 0.95),
    });

    // Section 1: Overview
    page.drawText(`1. Section ${i}: Operational Overview`, {
      x: 40,
      y: height - 130,
      size: 16,
      font: fontBold,
      color: rgb(0.15, 0.15, 0.15),
    });

    const bodyParagraph1 =
      `This is a synthetic document created for testing offline Android PDF tools including merge, ` +
      `split, page compression, dynamic watermarking, and Jetpack Compose PDF viewer rendering.\n` +
      `All algorithms run on-device without external data exfiltration.`;

    page.drawText(bodyParagraph1, {
      x: 40,
      y: height - 165,
      size: 11,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
      lineHeight: 16,
    });

    // Visual Box / Mock Table
    page.drawRectangle({
      x: 40,
      y: height - 320,
      width: width - 80,
      height: 120,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
      color: rgb(0.97, 0.97, 0.97),
    });

    page.drawText('Sample Data Table / Spec Sheet', {
      x: 55,
      y: height - 230,
      size: 13,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`- Target Architecture: Android Jetpack Compose + MVVM + Hilt DI`, {
      x: 55,
      y: height - 255,
      size: 10,
      font: font,
      color: rgb(0.35, 0.35, 0.35),
    });

    page.drawText(`- Core Engine: PdfBox-Android (Apache 2.0) + Native PdfRenderer (AOSP)`, {
      x: 55,
      y: height - 275,
      size: 10,
      font: font,
      color: rgb(0.35, 0.35, 0.35),
    });

    page.drawText(`- Machine Learning: Google ML Kit On-Device Text Recognition & Document Scanner`, {
      x: 55,
      y: height - 295,
      size: 10,
      font: font,
      color: rgb(0.35, 0.35, 0.35),
    });

    // Footer
    page.drawLine({
      start: { x: 40, y: 50 },
      end: { x: width - 40, y: 50 },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85),
    });

    page.drawText(`Confidential - For Testing Purposes - Generated: ${new Date().toLocaleDateString()}`, {
      x: 40,
      y: 35,
      size: 9,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    page.drawText(`Page ${i}`, {
      x: width - 80,
      y: 35,
      size: 9,
      font: fontBold,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const previewUrl = URL.createObjectURL(blob);

  return {
    id: `sample-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: `${title}.pdf`,
    size: pdfBytes.byteLength,
    type: 'application/pdf',
    data: pdfBytes,
    pageCount,
    previewUrl,
  };
}

/**
 * Creates default sample library files for instant testing.
 */
export async function getPresetSampleFiles(): Promise<LoadedFile[]> {
  const file1 = await createSamplePdf('Contract_Agreement_2026', 4, { r: 0.9, g: 0.2, b: 0.18 });
  const file2 = await createSamplePdf('Financial_Q3_Report', 3, { r: 0.15, g: 0.38, b: 0.92 });
  const file3 = await createSamplePdf('Employee_Handbook', 2, { r: 0.02, g: 0.58, b: 0.41 });
  return [file1, file2, file3];
}
