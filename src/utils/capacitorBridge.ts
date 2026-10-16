import { Capacitor, registerPlugin } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Preferences } from '@capacitor/preferences';
import { FileOpener } from '@capacitor-community/file-opener';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import JSZip from 'jszip';
import { AppDocument } from '../types/pdf';

export const isNative = Capacitor.isNativePlatform();

export async function pickPhotoFromGallery(): Promise<string | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
    });
    return image.dataUrl || null;
  } catch (e) {
    return null;
  }
}

interface DocumentScannerPluginInterface {
  scanDocument(options?: { pageLimit?: number; galleryImport?: boolean }): Promise<{
    pages?: string[];
    pageCount?: number;
    pdfUri?: string;
  }>;
}

interface PrintPluginInterface {
  printPdf(options: { filePath: string; jobName?: string }): Promise<{ status: string }>;
}

const DocumentScanner = registerPlugin<DocumentScannerPluginInterface>('DocumentScanner');
const NativePrint = registerPlugin<PrintPluginInterface>('NativePrint');

/**
 * Scan documents using Google ML Kit Document Scanner on Android or Web fallback.
 */
export async function scanWithMlKit(pageLimit: number = 20): Promise<{
  pages: string[];
  pdfUri?: string;
  pageCount: number;
} | null> {
  if (isNative) {
    try {
      const result = await DocumentScanner.scanDocument({
        pageLimit,
        galleryImport: true,
      });
      return {
        pages: (result.pages || []).map(p => Capacitor.convertFileSrc(p)),
        pdfUri: result.pdfUri,
        pageCount: result.pageCount || (result.pages ? result.pages.length : 0),
      };
    } catch (err: any) {
      console.warn('Native ML Kit document scan cancelled or unavailable:', err);
      return null;
    }
  }
  return null;
}

/**
 * Print PDF using Android PrintManager or web window.print().
 */
export async function printPdfDocument(fileUriOrBlobUrl: string, jobName: string = 'PDF Document'): Promise<boolean> {
  if (isNative) {
    try {
      await NativePrint.printPdf({
        filePath: fileUriOrBlobUrl,
        jobName,
      });
      return true;
    } catch (err) {
      console.error('Native print error:', err);
    }
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = fileUriOrBlobUrl;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 3000);
  };
  return true;
}

/**
 * Write binary PDF data to private app storage (Directory.Data, folder "docs/").
 */
export async function savePdfToAppStorage(
  data: Uint8Array,
  fileName: string
): Promise<{ path: string; uri: string }> {
  let binary = '';
  const len = data.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(data[i]);
  }
  const base64Data = btoa(binary);
  const filePath = `docs/${fileName}`;

  try {
    const result = await Filesystem.writeFile({
      path: filePath,
      data: base64Data,
      directory: Directory.Data,
      recursive: true,
    });

    return {
      path: filePath,
      uri: result.uri,
    };
  } catch (e) {
    const cacheResult = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    });
    return {
      path: fileName,
      uri: cacheResult.uri,
    };
  }
}

// Backward compatibility alias
export const savePdfToDevice = savePdfToAppStorage;

/**
 * Read PDF bytes back with Filesystem.readFile. If missing, throws error.
 */
export async function readPdfBytesFromStorage(docPath: string): Promise<Uint8Array> {
  try {
    let readResult;
    if (docPath.startsWith('file://') || docPath.startsWith('content://') || docPath.startsWith('/')) {
      readResult = await Filesystem.readFile({
        path: docPath,
      });
    } else {
      readResult = await Filesystem.readFile({
        path: docPath,
        directory: Directory.Data,
      });
    }

    const base64 = readResult.data;
    if (typeof base64 !== 'string') {
      throw new Error('Invalid file data');
    }

    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    throw new Error(`PDF file not found in storage: ${docPath}`);
  }
}

/**
 * Share PDF file via Android native share sheet or Web Share API.
 */
export async function sharePdf(
  fileUriOrBlobUrl: string,
  fileName: string,
  data?: Uint8Array
): Promise<boolean> {
  if (isNative) {
    try {
      let targetUri = fileUriOrBlobUrl;
      if (!targetUri.startsWith('file://') && !targetUri.startsWith('content://') && data) {
        const saved = await savePdfToAppStorage(data, fileName);
        targetUri = saved.uri;
      }

      await Share.share({
        title: fileName,
        text: `Shared from PDF Tools Pro: ${fileName}`,
        url: targetUri,
        dialogTitle: 'Share PDF document',
      });
      return true;
    } catch (err) {
      console.warn('Native share failed or dismissed:', err);
      return false;
    }
  }

  if (navigator.share) {
    try {
      if (data) {
        const blob = new Blob([data as unknown as BlobPart], { type: 'application/pdf' });
        const file = new File([blob], fileName, { type: 'application/pdf' });
        await navigator.share({
          title: fileName,
          text: `Shared from PDF Tools Pro: ${fileName}`,
          files: [file],
        });
        return true;
      } else {
        await navigator.share({
          title: fileName,
          url: fileUriOrBlobUrl,
        });
        return true;
      }
    } catch (e) {
      return false;
    }
  }

  return false;
}

/**
 * Open PDF in native external reader.
 */
export async function openWithExternalReader(fileUri: string): Promise<boolean> {
  if (isNative) {
    try {
      await FileOpener.open({
        filePath: fileUri,
        contentType: 'application/pdf',
      });
      return true;
    } catch (err) {
      console.error('FileOpener error:', err);
      return false;
    }
  }
  return false;
}

// -------------------------------------------------------------
// DOCUMENT LIST & FOLDER STORAGE (Preferences)
// -------------------------------------------------------------

const STORAGE_KEY_DOCS = 'mobipdf_saved_documents';
const STORAGE_KEY_FOLDERS = 'mobipdf_saved_folders';

export async function loadStoredDocuments(): Promise<AppDocument[]> {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY_DOCS });
    if (value) {
      return JSON.parse(value);
    }
  } catch (e) {
    const local = localStorage.getItem(STORAGE_KEY_DOCS);
    if (local) return JSON.parse(local);
  }
  return [];
}

export async function saveStoredDocument(doc: AppDocument): Promise<void> {
  const current = await loadStoredDocuments();
  const updated = [doc, ...current.filter(d => d.id !== doc.id)];
  await Preferences.set({ key: STORAGE_KEY_DOCS, value: JSON.stringify(updated) });
  localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(updated));
}

export async function deleteStoredDocument(id: string): Promise<void> {
  const current = await loadStoredDocuments();
  const updated = current.filter(d => d.id !== id);
  await Preferences.set({ key: STORAGE_KEY_DOCS, value: JSON.stringify(updated) });
  localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(updated));
}

export async function renameStoredDocument(id: string, newName: string): Promise<void> {
  const current = await loadStoredDocuments();
  const updated = current.map(d => (d.id === id ? { ...d, name: newName } : d));
  await Preferences.set({ key: STORAGE_KEY_DOCS, value: JSON.stringify(updated) });
  localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(updated));
}

export async function toggleFavoriteDocument(id: string): Promise<void> {
  const current = await loadStoredDocuments();
  const updated = current.map(d => (d.id === id ? { ...d, isFavorite: !d.isFavorite } : d));
  await Preferences.set({ key: STORAGE_KEY_DOCS, value: JSON.stringify(updated) });
  localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(updated));
}

export async function moveDocumentToFolder(id: string, folder: string): Promise<void> {
  const current = await loadStoredDocuments();
  const updated = current.map(d => (d.id === id ? { ...d, folder } : d));
  await Preferences.set({ key: STORAGE_KEY_DOCS, value: JSON.stringify(updated) });
  localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(updated));
}

export async function loadFolders(): Promise<string[]> {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY_FOLDERS });
    if (value) return JSON.parse(value);
  } catch (e) {
    const local = localStorage.getItem(STORAGE_KEY_FOLDERS);
    if (local) return JSON.parse(local);
  }
  return ['Scans', 'Receipts', 'Contracts', 'Personal'];
}

export async function addFolder(folderName: string): Promise<string[]> {
  const folders = await loadFolders();
  if (!folders.includes(folderName)) {
    const updated = [...folders, folderName];
    await Preferences.set({ key: STORAGE_KEY_FOLDERS, value: JSON.stringify(updated) });
    localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(updated));
    return updated;
  }
  return folders;
}

/**
 * Export all documents to Zip backup.
 */
export async function exportAllDocumentsToZip(): Promise<Blob> {
  const docs = await loadStoredDocuments();
  const zip = new JSZip();

  zip.file(
    'manifest.json',
    JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        version: '1.0',
        totalDocuments: docs.length,
        documents: docs.map(d => ({ id: d.id, name: d.name, size: d.size, date: d.date, folder: d.folder })),
      },
      null,
      2
    )
  );

  for (const doc of docs) {
    try {
      const bytes = await readPdfBytesFromStorage(doc.path);
      zip.file(doc.name, bytes);
    } catch (err) {
      console.warn(`Could not add ${doc.name} to zip:`, err);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}
