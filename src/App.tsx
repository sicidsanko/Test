import React, { useState, useEffect } from 'react';
import { NavigationRailOrBar, ActiveTab } from './components/NavigationRailOrBar';
import { TopAppBar } from './components/TopAppBar';
import { MobiHomeScreen } from './components/MobiHomeScreen';
import { ToolGrid } from './components/ToolGrid';
import { FilesManagerScreen } from './components/FilesManagerScreen';
import { MobiScannerScreen, ScannerMode } from './components/MobiScannerScreen';
import { MobiPdfReader } from './components/MobiPdfReader';
import { FillAndSignModal } from './components/FillAndSignModal';
import { OrganizePagesModal } from './components/OrganizePagesModal';
import { ToolExecutionModal } from './components/ToolExecutionModal';
import { ToolDefinition } from './utils/pdfEngineLogic';
import { AppDocument, LoadedFile, RecentFileRecord } from './types/pdf';
import { ProcessResult } from './utils/pdfProcessor';
import {
  loadStoredDocuments,
  saveStoredDocument,
  deleteStoredDocument,
  renameStoredDocument,
  toggleFavoriteDocument,
  moveDocumentToFolder,
  loadFolders,
  addFolder,
  savePdfToAppStorage,
  readPdfBytesFromStorage,
  scanWithMlKit,
  isNative,
} from './utils/capacitorBridge';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isSimulatorMode, setIsSimulatorMode] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(false);

  // App Documents state
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [folders, setFolders] = useState<string[]>(['Scans', 'Receipts', 'Contracts', 'Personal']);

  // Modals & Fullscreen Overlays
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [readerDoc, setReaderDoc] = useState<{ data: Uint8Array; fileName: string } | null>(null);
  const [fillSignFile, setFillSignFile] = useState<LoadedFile | null>(null);
  const [organizeFile, setOrganizeFile] = useState<LoadedFile | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);

  // Initialize and load saved documents & folders on mount (No samples / no seed docs)
  useEffect(() => {
    async function initStorage() {
      const storedDocs = await loadStoredDocuments();
      const storedFolders = await loadFolders();
      setFolders(storedFolders);
      setDocuments(storedDocs);
    }
    initStorage();
  }, []);

  // Sync dark class on html root
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Open file picked from local device
  const handlePickLocalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);

    const saved = await savePdfToAppStorage(data, file.name);

    const newDoc: AppDocument = {
      id: `doc-${Date.now()}`,
      name: file.name,
      path: saved.path,
      size: file.size,
      date: Date.now(),
      pageCount: 1,
      folder: 'Scans',
      isFavorite: false,
    };

    await saveStoredDocument(newDoc);
    setDocuments(prev => [newDoc, ...prev]);
    setReaderDoc({ data, fileName: file.name });
  };

  // Document management handlers (Reading real bytes from storage. If missing, show error, never sample)
  const handleOpenDocument = async (doc: AppDocument) => {
    try {
      const data = await readPdfBytesFromStorage(doc.path);
      setReaderDoc({ data, fileName: doc.name });
    } catch (e) {
      alert(`Error: Document file not found in storage for "${doc.name}".`);
      console.error(e);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    await deleteStoredDocument(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const handleRenameDocument = async (id: string, newName: string) => {
    await renameStoredDocument(id, newName);
    setDocuments(prev => prev.map(d => (d.id === id ? { ...d, name: newName } : d)));
  };

  const handleToggleFavorite = async (id: string) => {
    await toggleFavoriteDocument(id);
    setDocuments(prev => prev.map(d => (d.id === id ? { ...d, isFavorite: !d.isFavorite } : d)));
  };

  const handleMoveToFolder = async (id: string, folder: string) => {
    await moveDocumentToFolder(id, folder);
    setDocuments(prev => prev.map(d => (d.id === id ? { ...d, folder } : d)));
  };

  const handleCreateFolder = async (folderName: string) => {
    const updated = await addFolder(folderName);
    setFolders(updated);
  };

  // Scanner completed (ML Kit or fallback)
  const handleScanComplete = async (result: ProcessResult, mode: ScannerMode) => {
    setIsScannerOpen(false);
    const saved = await savePdfToAppStorage(result.data, result.fileName);

    const newDoc: AppDocument = {
      id: `scan-${Date.now()}`,
      name: result.fileName,
      path: saved.path,
      size: result.size,
      date: Date.now(),
      pageCount: result.pageCount,
      folder: mode === 'receipt' ? 'Receipts' : 'Scans',
      isFavorite: false,
    };
    await saveStoredDocument(newDoc);
    setDocuments(prev => [newDoc, ...prev]);
    setReaderDoc({ data: result.data, fileName: result.fileName });
  };

  // Helper to get active file or prompt user to pick one when none is open
  const getActiveOrPromptFile = async (): Promise<LoadedFile> => {
    if (readerDoc) {
      const blob = new Blob([readerDoc.data as unknown as BlobPart], { type: 'application/pdf' });
      return {
        id: `f-${Date.now()}`,
        name: readerDoc.fileName,
        size: readerDoc.data.byteLength,
        type: 'application/pdf',
        data: readerDoc.data,
        previewUrl: URL.createObjectURL(blob),
      };
    }

    if (documents.length > 0) {
      const doc = documents[0];
      const data = await readPdfBytesFromStorage(doc.path);
      const blob = new Blob([data as unknown as BlobPart], { type: 'application/pdf' });
      return {
        id: doc.id,
        name: doc.name,
        size: doc.size,
        type: 'application/pdf',
        data,
        previewUrl: URL.createObjectURL(blob),
      };
    }

    throw new Error('No document is currently open. Please open a PDF or select a file from your Files list first.');
  };

  const handleOpenFillSign = async () => {
    try {
      const file = await getActiveOrPromptFile();
      setFillSignFile(file);
    } catch (err: any) {
      alert(err.message || 'Please open a document first.');
      setActiveTab('files');
    }
  };

  const handleOpenOrganize = async () => {
    try {
      const file = await getActiveOrPromptFile();
      setOrganizeFile(file);
    } catch (err: any) {
      alert(err.message || 'Please open a document first.');
      setActiveTab('files');
    }
  };

  // Tool selection handler from ToolGrid (Version 1 Only tools)
  const handleSelectTool = async (tool: ToolDefinition) => {
    if (tool.id === 'scan_to_pdf') {
      if (isNative) {
        const scanRes = await scanWithMlKit();
        if (scanRes && scanRes.pdfUri) {
          try {
            const pdfBytes = await readPdfBytesFromStorage(scanRes.pdfUri);
            const fileName = `Scan_${Date.now()}.pdf`;
            const saved = await savePdfToAppStorage(pdfBytes, fileName);
            const newDoc: AppDocument = {
              id: `scan-${Date.now()}`,
              name: fileName,
              path: saved.path,
              size: pdfBytes.byteLength,
              date: Date.now(),
              pageCount: scanRes.pageCount,
              folder: 'Scans',
              isFavorite: false,
            };
            await saveStoredDocument(newDoc);
            setDocuments(prev => [newDoc, ...prev]);
            setReaderDoc({ data: pdfBytes, fileName });
            return;
          } catch (e) {
            console.warn('Failed to read scanned PDF uri, opening scanner modal:', e);
          }
        }
      }
      setIsScannerOpen(true);
      return;
    }

    if (tool.id === 'sign') {
      await handleOpenFillSign();
      return;
    }
    if (tool.id === 'organize_pages') {
      await handleOpenOrganize();
      return;
    }

    setSelectedTool(tool);
  };

  const recentFilesRecords: RecentFileRecord[] = documents.map(d => ({
    id: d.id,
    name: d.name,
    size: d.size,
    toolUsed: d.folder || 'PDF Suite',
    timestamp: d.date,
    pageCount: d.pageCount,
    favorite: d.isFavorite,
  }));

  const handleSaveToRecents = async (
    fileName: string,
    size: number,
    pages: number,
    toolName: string,
    pdfData?: Uint8Array
  ) => {
    let path = '';
    if (pdfData) {
      const saved = await savePdfToAppStorage(pdfData, fileName);
      path = saved.path;
    }
    const newDoc: AppDocument = {
      id: `doc-${Date.now()}`,
      name: fileName,
      path,
      size,
      date: Date.now(),
      pageCount: pages,
      folder: 'Scans',
      isFavorite: false,
    };
    await saveStoredDocument(newDoc);
    setDocuments(prev => [newDoc, ...prev]);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <MobiHomeScreen
            documents={documents}
            onOpenDocument={handleOpenDocument}
            onOpenScanner={() => {
              if (isNative) {
                scanWithMlKit().then(async scanRes => {
                  if (scanRes && scanRes.pdfUri) {
                    try {
                      const pdfBytes = await readPdfBytesFromStorage(scanRes.pdfUri);
                      const fileName = `Scan_${Date.now()}.pdf`;
                      const saved = await savePdfToAppStorage(pdfBytes, fileName);
                      const newDoc: AppDocument = {
                        id: `scan-${Date.now()}`,
                        name: fileName,
                        path: saved.path,
                        size: pdfBytes.byteLength,
                        date: Date.now(),
                        pageCount: scanRes.pageCount,
                        folder: 'Scans',
                        isFavorite: false,
                      };
                      await saveStoredDocument(newDoc);
                      setDocuments(prev => [newDoc, ...prev]);
                      setReaderDoc({ data: pdfBytes, fileName });
                      return;
                    } catch (e) {}
                  }
                  setIsScannerOpen(true);
                });
              } else {
                setIsScannerOpen(true);
              }
            }}
            onOpenTools={() => setActiveTab('tools')}
            onToggleFavorite={handleToggleFavorite}
            onDeleteDocument={handleDeleteDocument}
            onRenameDocument={handleRenameDocument}
          />
        );
      case 'tools':
        return (
          <ToolGrid
            onSelectTool={handleSelectTool}
            recentFiles={recentFilesRecords}
            onOpenRecent={file => {
              const doc = documents.find(d => d.name === file.name);
              if (doc) handleOpenDocument(doc);
            }}
            onOpenViewer={() => {
              if (documents.length > 0) {
                handleOpenDocument(documents[0]);
              } else {
                alert('No documents available. Please pick a file or scan one first.');
                setActiveTab('files');
              }
            }}
          />
        );
      case 'scan':
        return (
          <MobiHomeScreen
            documents={documents}
            onOpenDocument={handleOpenDocument}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenTools={() => setActiveTab('tools')}
            onToggleFavorite={handleToggleFavorite}
            onDeleteDocument={handleDeleteDocument}
            onRenameDocument={handleRenameDocument}
          />
        );
      case 'files':
        return (
          <FilesManagerScreen
            documents={documents}
            folders={folders}
            onOpenDocument={handleOpenDocument}
            onDeleteDocument={handleDeleteDocument}
            onRenameDocument={handleRenameDocument}
            onToggleFavorite={handleToggleFavorite}
            onMoveToFolder={handleMoveToFolder}
            onCreateFolder={handleCreateFolder}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden font-sans">
      <div className="flex flex-col md:flex-row flex-1 h-full overflow-hidden w-full">
        <div className="order-1 flex-1 flex flex-col h-full overflow-hidden">
          <TopAppBar
            isSimulatorMode={isSimulatorMode}
            onToggleSimulator={() => setIsSimulatorMode(!isSimulatorMode)}
            isDark={isDark}
            onToggleDark={() => setIsDark(!isDark)}
            onPickLocalFile={handlePickLocalFile}
            onSelectTab={tab => setActiveTab(tab)}
          />

          <main className="flex-1 flex flex-col overflow-hidden relative">
            {renderTabContent()}
          </main>
        </div>

        <div className="order-2 shrink-0">
          <NavigationRailOrBar
            activeTab={activeTab}
            onTabChange={tab => {
              if (tab === 'scan') {
                if (isNative) {
                  scanWithMlKit().then(async scanRes => {
                    if (scanRes && scanRes.pdfUri) {
                      try {
                        const pdfBytes = await readPdfBytesFromStorage(scanRes.pdfUri);
                        const fileName = `Scan_${Date.now()}.pdf`;
                        const saved = await savePdfToAppStorage(pdfBytes, fileName);
                        const newDoc: AppDocument = {
                          id: `scan-${Date.now()}`,
                          name: fileName,
                          path: saved.path,
                          size: pdfBytes.byteLength,
                          date: Date.now(),
                          pageCount: scanRes.pageCount,
                          folder: 'Scans',
                          isFavorite: false,
                        };
                        await saveStoredDocument(newDoc);
                        setDocuments(prev => [newDoc, ...prev]);
                        setReaderDoc({ data: pdfBytes, fileName });
                        return;
                      } catch (e) {}
                    }
                    setIsScannerOpen(true);
                  });
                } else {
                  setIsScannerOpen(true);
                }
              } else {
                setActiveTab(tab);
              }
            }}
            filesCount={documents.length}
          />
        </div>
      </div>

      {/* 1. Fullscreen Scanner Screen */}
      {isScannerOpen && (
        <MobiScannerScreen
          onScanComplete={handleScanComplete}
          onCancel={() => setIsScannerOpen(false)}
        />
      )}

      {/* 2. Fullscreen PDF Reader (Version 1 Only: no editor, OCR, print buttons) */}
      {readerDoc && (
        <MobiPdfReader
          pdfData={readerDoc.data}
          fileName={readerDoc.fileName}
          onClose={() => setReaderDoc(null)}
          onSaveAnnotatedPdf={async (updatedData, fileName) => {
            const saved = await savePdfToAppStorage(updatedData, fileName);
            const updatedDoc: AppDocument = {
              id: `annot-${Date.now()}`,
              name: fileName,
              path: saved.path,
              size: updatedData.byteLength,
              date: Date.now(),
              pageCount: 3,
              folder: 'Contracts',
              isFavorite: true,
            };
            await saveStoredDocument(updatedDoc);
            setDocuments(prev => [updatedDoc, ...prev.filter(d => d.name !== fileName)]);
          }}
          onOpenFillSign={() => handleOpenFillSign()}
          onOpenOrganize={() => handleOpenOrganize()}
        />
      )}

      {/* 3. Fill and Sign Form Modal */}
      {fillSignFile && (
        <FillAndSignModal
          file={fillSignFile}
          onClose={() => setFillSignFile(null)}
          onSaveSignedPdf={async (data, fileName) => {
            setFillSignFile(null);
            const saved = await savePdfToAppStorage(data, fileName);
            const doc: AppDocument = {
              id: `signed-${Date.now()}`,
              name: fileName,
              path: saved.path,
              size: data.byteLength,
              date: Date.now(),
              pageCount: 1,
              folder: 'Contracts',
              isFavorite: true,
            };
            await saveStoredDocument(doc);
            setDocuments(prev => [doc, ...prev]);
            setReaderDoc({ data, fileName });
          }}
        />
      )}

      {/* 4. Organize Pages Modal */}
      {organizeFile && (
        <OrganizePagesModal
          file={organizeFile}
          onClose={() => setOrganizeFile(null)}
          onSaveOrganizedPdf={async (data, fileName) => {
            setOrganizeFile(null);
            const saved = await savePdfToAppStorage(data, fileName);
            const doc: AppDocument = {
              id: `org-${Date.now()}`,
              name: fileName,
              path: saved.path,
              size: data.byteLength,
              date: Date.now(),
              pageCount: 2,
              folder: 'Scans',
              isFavorite: false,
            };
            await saveStoredDocument(doc);
            setDocuments(prev => [doc, ...prev]);
            setReaderDoc({ data, fileName });
          }}
        />
      )}

      {/* 5. Tool Execution Modal */}
      <ToolExecutionModal
        tool={selectedTool}
        onClose={() => setSelectedTool(null)}
        onSaveToRecents={(name, size, pages, toolName, pdfData) => handleSaveToRecents(name, size, pages, toolName, pdfData)}
        onOpenInViewer={async (url, name) => {
          setSelectedTool(null);
          try {
            const res = await fetch(url);
            const buffer = await res.arrayBuffer();
            const data = new Uint8Array(buffer);
            setReaderDoc({ data, fileName: name });
          } catch (e) {
            alert('Could not open document in viewer.');
          }
        }}
      />
    </div>
  );
}
