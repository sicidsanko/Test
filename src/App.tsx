import React, { useState, useEffect } from 'react';
import { NavigationRailOrBar, ActiveTab } from './components/NavigationRailOrBar';
import { AndroidPhoneFrame } from './components/AndroidPhoneFrame';
import { TopAppBar } from './components/TopAppBar';
import { MobiHomeScreen } from './components/MobiHomeScreen';
import { ToolGrid } from './components/ToolGrid';
import { FilesManagerScreen } from './components/FilesManagerScreen';
import { MobiScannerScreen, ScannerMode } from './components/MobiScannerScreen';
import { MobiPdfReader } from './components/MobiPdfReader';
import { FillAndSignModal } from './components/FillAndSignModal';
import { OrganizePagesModal } from './components/OrganizePagesModal';
import { PdfEditorModal } from './components/PdfEditorModal';
import { OcrTextModal } from './components/OcrTextModal';
import { ToolExecutionModal } from './components/ToolExecutionModal';
import { AndroidCodeHub } from './components/AndroidCodeHub';
import { ArchitectureGuide } from './components/ArchitectureGuide';
import { ToolDefinition, TOOLS } from './utils/pdfEngineLogic';
import { AppDocument, LoadedFile, RecentFileRecord } from './types/pdf';
import { createSamplePdf } from './utils/samplePdfs';
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
  savePdfToDevice,
} from './utils/capacitorBridge';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isSimulatorMode, setIsSimulatorMode] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(false);

  // App Documents state (persisted via Preferences / localStorage)
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [folders, setFolders] = useState<string[]>(['Scans', 'Receipts', 'Contracts', 'Personal']);

  // Modals & Fullscreen Overlays
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [readerDoc, setReaderDoc] = useState<{ data: Uint8Array; fileName: string } | null>(null);
  const [fillSignFile, setFillSignFile] = useState<LoadedFile | null>(null);
  const [organizeFile, setOrganizeFile] = useState<LoadedFile | null>(null);
  const [editorFile, setEditorFile] = useState<LoadedFile | null>(null);
  const [ocrDoc, setOcrDoc] = useState<{ data: Uint8Array; fileName: string } | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);

  // Initialize and load saved documents & folders on mount
  useEffect(() => {
    async function initStorage() {
      const storedDocs = await loadStoredDocuments();
      const storedFolders = await loadFolders();
      setFolders(storedFolders);

      if (storedDocs.length > 0) {
        setDocuments(storedDocs);
      } else {
        // Seed initial high-quality documents so the user has immediate data
        const sample1 = await createSamplePdf('Contract_Agreement_2026', 4);
        const sample2 = await createSamplePdf('Vendor_Invoice_Q1', 2);

        const seed1: AppDocument = {
          id: 'doc-seed-1',
          name: sample1.name,
          path: sample1.previewUrl || '',
          size: sample1.size,
          date: Date.now() - 3600000 * 3,
          pageCount: 4,
          folder: 'Contracts',
          isFavorite: true,
        };

        const seed2: AppDocument = {
          id: 'doc-seed-2',
          name: sample2.name,
          path: sample2.previewUrl || '',
          size: sample2.size,
          date: Date.now() - 3600000 * 24,
          pageCount: 2,
          folder: 'Receipts',
          isFavorite: false,
        };

        const initialDocs = [seed1, seed2];
        setDocuments(initialDocs);
        await saveStoredDocument(seed1);
        await saveStoredDocument(seed2);
      }
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

  // Load a fresh sample PDF
  const handleLoadSampleTop = async () => {
    const sample = await createSamplePdf(`Sample_Document_${Date.now().toString().slice(-4)}`, 3);
    const newDoc: AppDocument = {
      id: `doc-${Date.now()}`,
      name: sample.name,
      path: sample.previewUrl || '',
      size: sample.size,
      date: Date.now(),
      pageCount: 3,
      folder: 'Contracts',
      isFavorite: false,
    };
    await saveStoredDocument(newDoc);
    setDocuments(prev => [newDoc, ...prev]);
    setReaderDoc({ data: sample.data, fileName: sample.name });
  };

  // Open file picked from local device
  const handlePickLocalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);
    const blob = new Blob([data as unknown as BlobPart], { type: file.type || 'application/pdf' });
    const previewUrl = URL.createObjectURL(blob);

    const newDoc: AppDocument = {
      id: `doc-${Date.now()}`,
      name: file.name,
      path: previewUrl,
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

  // Document management handlers
  const handleOpenDocument = async (doc: AppDocument) => {
    try {
      if (doc.path.startsWith('blob:') || doc.path.startsWith('data:')) {
        const res = await fetch(doc.path);
        const buffer = await res.arrayBuffer();
        setReaderDoc({ data: new Uint8Array(buffer), fileName: doc.name });
      } else {
        // Fallback create sample with that name if memory object url expired
        const sample = await createSamplePdf(doc.name.replace(/\.pdf$/, ''), doc.pageCount || 2);
        setReaderDoc({ data: sample.data, fileName: doc.name });
      }
    } catch (e) {
      const sample = await createSamplePdf(doc.name.replace(/\.pdf$/, ''), 2);
      setReaderDoc({ data: sample.data, fileName: doc.name });
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

  // Scanner completed
  const handleScanComplete = async (result: ProcessResult, mode: ScannerMode) => {
    setIsScannerOpen(false);
    const newDoc: AppDocument = {
      id: `scan-${Date.now()}`,
      name: result.fileName,
      path: result.previewUrl,
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

  // Helper to open active document in tools
  const getActiveOrSampleFile = async (): Promise<LoadedFile> => {
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
    const sample = await createSamplePdf('Contract_Agreement_2026', 3);
    return sample;
  };

  const handleOpenFillSign = async () => {
    const file = await getActiveOrSampleFile();
    setFillSignFile(file);
  };

  const handleOpenOrganize = async () => {
    const file = await getActiveOrSampleFile();
    setOrganizeFile(file);
  };

  const handleOpenEditor = async () => {
    const file = readerDoc ? await getActiveOrSampleFile() : null;
    setEditorFile(file);
  };

  const handleOpenOcr = async () => {
    if (readerDoc) {
      setOcrDoc(readerDoc);
    } else {
      const sample = await createSamplePdf('Scanned_Tax_Form_2026', 2);
      setOcrDoc({ data: sample.data, fileName: sample.name });
    }
  };

  // Tool selection handler from ToolGrid
  const handleSelectTool = async (tool: ToolDefinition) => {
    if (tool.id === 'scan') {
      setIsScannerOpen(true);
      return;
    }
    if (tool.id === 'sign') {
      await handleOpenFillSign();
      return;
    }
    if (tool.id === 'organize') {
      await handleOpenOrganize();
      return;
    }
    if (tool.id === 'edit') {
      await handleOpenEditor();
      return;
    }
    if (tool.id === 'ocr') {
      await handleOpenOcr();
      return;
    }
    setSelectedTool(tool);
  };

  // Convert documents to RecentFileRecord for tools modal
  const recentFilesRecords: RecentFileRecord[] = documents.map(d => ({
    id: d.id,
    name: d.name,
    size: d.size,
    toolUsed: d.folder || 'PDF Suite',
    timestamp: d.date,
    pageCount: d.pageCount,
    favorite: d.isFavorite,
  }));

  const handleSaveToRecents = (
    fileName: string,
    size: number,
    pages: number,
    toolName: string
  ) => {
    const newDoc: AppDocument = {
      id: `doc-${Date.now()}`,
      name: fileName,
      path: '',
      size,
      date: Date.now(),
      pageCount: pages,
      folder: 'Scans',
      isFavorite: false,
    };
    saveStoredDocument(newDoc).then(() => {
      setDocuments(prev => [newDoc, ...prev]);
    });
  };

  // Content switcher inside the Android Frame
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <MobiHomeScreen
            documents={documents}
            onOpenDocument={handleOpenDocument}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenEditor={handleOpenEditor}
            onOpenFillSign={handleOpenFillSign}
            onOpenOcr={handleOpenOcr}
            onOpenOrganize={handleOpenOrganize}
            onOpenTools={() => setActiveTab('tools')}
            onLoadSample={handleLoadSampleTop}
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
            onOpenViewer={() => handleLoadSampleTop()}
          />
        );
      case 'scan':
        // Trigger scanner modal immediately, tab points to home behind it
        return (
          <MobiHomeScreen
            documents={documents}
            onOpenDocument={handleOpenDocument}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenEditor={handleOpenEditor}
            onOpenFillSign={handleOpenFillSign}
            onOpenOcr={handleOpenOcr}
            onOpenOrganize={handleOpenOrganize}
            onOpenTools={() => setActiveTab('tools')}
            onLoadSample={handleLoadSampleTop}
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
      case 'code':
        return <AndroidCodeHub />;
      case 'arch':
        return <ArchitectureGuide />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden font-sans">
      {/* Phone Simulator or Desktop Responsive container */}
      <AndroidPhoneFrame
        isSimulatorMode={isSimulatorMode}
        onToggleSimulator={() => setIsSimulatorMode(!isSimulatorMode)}
        isDark={isDark}
      >
        <div className="flex flex-col md:flex-row flex-1 h-full overflow-hidden">
          {/* Main App Content View */}
          <div className="order-1 flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Bar */}
            <TopAppBar
              isSimulatorMode={isSimulatorMode}
              onToggleSimulator={() => setIsSimulatorMode(!isSimulatorMode)}
              isDark={isDark}
              onToggleDark={() => setIsDark(!isDark)}
              onLoadSample={handleLoadSampleTop}
              onPickLocalFile={handlePickLocalFile}
              onSelectTab={tab => setActiveTab(tab)}
            />

            {/* Main Interactive Screen */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
              {renderTabContent()}
            </main>
          </div>

          {/* Navigation Bar / Rail */}
          <div className="order-2 shrink-0">
            <NavigationRailOrBar
              activeTab={activeTab}
              onTabChange={tab => {
                if (tab === 'scan') {
                  setIsScannerOpen(true);
                } else {
                  setActiveTab(tab);
                }
              }}
              filesCount={documents.length}
            />
          </div>
        </div>
      </AndroidPhoneFrame>

      {/* 1. Fullscreen Mobi Scanner Screen */}
      {isScannerOpen && (
        <MobiScannerScreen
          onScanComplete={handleScanComplete}
          onCancel={() => setIsScannerOpen(false)}
        />
      )}

      {/* 2. Fullscreen Mobi PDF Reader & Annotator */}
      {readerDoc && (
        <MobiPdfReader
          pdfData={readerDoc.data}
          fileName={readerDoc.fileName}
          onClose={() => setReaderDoc(null)}
          onSaveAnnotatedPdf={async (updatedData, fileName) => {
            const saved = await savePdfToDevice(updatedData, fileName);
            const updatedDoc: AppDocument = {
              id: `annot-${Date.now()}`,
              name: fileName,
              path: saved.uri,
              size: updatedData.byteLength,
              date: Date.now(),
              pageCount: 3,
              folder: 'Contracts',
              isFavorite: true,
            };
            await saveStoredDocument(updatedDoc);
            setDocuments(prev => [updatedDoc, ...prev.filter(d => d.name !== fileName)]);
          }}
          onOpenEditor={() => handleOpenEditor()}
          onOpenFillSign={() => handleOpenFillSign()}
          onOpenOrganize={() => handleOpenOrganize()}
          onOpenOcr={() => handleOpenOcr()}
        />
      )}

      {/* 3. Fill and Sign Form Modal */}
      {fillSignFile && (
        <FillAndSignModal
          file={fillSignFile}
          onClose={() => setFillSignFile(null)}
          onSaveSignedPdf={async (data, fileName) => {
            setFillSignFile(null);
            const saved = await savePdfToDevice(data, fileName);
            const doc: AppDocument = {
              id: `signed-${Date.now()}`,
              name: fileName,
              path: saved.uri,
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
            const saved = await savePdfToDevice(data, fileName);
            const doc: AppDocument = {
              id: `org-${Date.now()}`,
              name: fileName,
              path: saved.uri,
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

      {/* 5. PDF Editor Modal */}
      {editorFile !== undefined && editorFile !== null && (
        <PdfEditorModal
          file={editorFile}
          onClose={() => setEditorFile(null)}
          onSaveEditedPdf={async (data, fileName) => {
            setEditorFile(null);
            const saved = await savePdfToDevice(data, fileName);
            const doc: AppDocument = {
              id: `edit-${Date.now()}`,
              name: fileName,
              path: saved.uri,
              size: data.byteLength,
              date: Date.now(),
              pageCount: 1,
              folder: 'Scans',
              isFavorite: false,
            };
            await saveStoredDocument(doc);
            setDocuments(prev => [doc, ...prev]);
            setReaderDoc({ data, fileName });
          }}
        />
      )}

      {/* 6. OCR Text Modal */}
      {ocrDoc && (
        <OcrTextModal
          pdfBytes={ocrDoc.data}
          fileName={ocrDoc.fileName}
          onClose={() => setOcrDoc(null)}
        />
      )}

      {/* 7. General Tool Execution Modal (for 25+ PDF Tools) */}
      <ToolExecutionModal
        tool={selectedTool}
        onClose={() => setSelectedTool(null)}
        onSaveToRecents={handleSaveToRecents}
        onOpenInViewer={async (url, name) => {
          setSelectedTool(null);
          try {
            const res = await fetch(url);
            const buffer = await res.arrayBuffer();
            setReaderDoc({ data: new Uint8Array(buffer), fileName: name });
          } catch (e) {
            const sample = await createSamplePdf(name.replace(/\.pdf$/, ''), 2);
            setReaderDoc({ data: sample.data, fileName: name });
          }
        }}
      />
    </div>
  );
}
