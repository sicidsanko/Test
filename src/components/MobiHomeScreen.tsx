import React, { useState } from 'react';
import {
  Camera,
  PenTool,
  Edit3,
  ScanText,
  Layers,
  ArrowRightLeft,
  Search,
  Star,
  FileText,
  Clock,
  MoreVertical,
  Share2,
  Trash2,
  Edit2,
  BookOpen,
  Sparkles,
  Printer,
  Folder,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { AppDocument } from '../types/pdf';
import { formatBytes } from '../utils/pdfEngineLogic';
import { sharePdf, printPdfDocument } from '../utils/capacitorBridge';

interface MobiHomeScreenProps {
  documents: AppDocument[];
  onOpenDocument: (doc: AppDocument) => void;
  onOpenScanner: () => void;
  onOpenEditor?: () => void;
  onOpenFillSign?: () => void;
  onOpenOcr?: () => void;
  onOpenOrganize?: () => void;
  onOpenTools: () => void;
  onLoadSample?: () => void;
  onToggleFavorite: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onRenameDocument: (id: string, newName: string) => void;
}

export const MobiHomeScreen: React.FC<MobiHomeScreenProps> = ({
  documents,
  onOpenDocument,
  onOpenScanner,
  onOpenEditor,
  onOpenFillSign,
  onOpenOcr,
  onOpenOrganize,
  onOpenTools,
  onLoadSample,
  onToggleFavorite,
  onDeleteDocument,
  onRenameDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'favorites' | 'scans' | 'recent'>('all');
  const [menuDocId, setMenuDocId] = useState<string | null>(null);
  const [renamingDoc, setRenamingDoc] = useState<AppDocument | null>(null);
  const [newName, setNewName] = useState('');

  // Quick action items inspired by MobiPDF
  const quickActions = [
    {
      id: 'scan',
      title: 'Scan Document',
      desc: 'ML Kit camera edge scanner',
      icon: Camera,
      color: 'bg-red-600 text-white',
      badge: 'Main',
      onClick: onOpenScanner,
    },
    {
      id: 'fill_sign',
      title: 'Fill & Sign',
      desc: 'Forms & digital signature',
      icon: PenTool,
      color: 'bg-blue-600 text-white',
      badge: 'Forms',
      onClick: onOpenFillSign,
    },
    {
      id: 'edit',
      title: 'Edit PDF',
      desc: 'Add text, shapes & blank PDF',
      icon: Edit3,
      color: 'bg-emerald-600 text-white',
      badge: 'Editor',
      onClick: onOpenEditor,
    },
    {
      id: 'ocr',
      title: 'OCR Text',
      desc: 'Extract text on-device',
      icon: ScanText,
      color: 'bg-purple-600 text-white',
      badge: 'ML Kit',
      onClick: onOpenOcr,
    },
    {
      id: 'organize',
      title: 'Organize Pages',
      desc: 'Reorder, rotate & extract',
      icon: Layers,
      color: 'bg-amber-600 text-white',
      badge: 'Pages',
      onClick: onOpenOrganize,
    },
    {
      id: 'tools',
      title: 'All 25+ Tools',
      desc: 'Merge, split, convert, secure',
      icon: ArrowRightLeft,
      color: 'bg-stone-800 text-white dark:bg-stone-700',
      badge: 'Suite',
      onClick: onOpenTools,
    },
  ];

  // Filtering documents
  const filteredDocs = documents
    .filter(doc => {
      if (filterType === 'favorites') return doc.isFavorite;
      if (filterType === 'scans') return doc.folder === 'Scans' || doc.name.toLowerCase().includes('scan');
      return true;
    })
    .filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalSize = documents.reduce((sum, d) => sum + d.size, 0);

  const handleShare = async (doc: AppDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    await sharePdf(doc.path, doc.name);
  };

  const handlePrint = async (doc: AppDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuDocId(null);
    await printPdfDocument(doc.path, doc.name);
  };

  const handleStartRename = (doc: AppDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingDoc(doc);
    setNewName(doc.name);
    setMenuDocId(null);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (renamingDoc && newName.trim()) {
      onRenameDocument(renamingDoc.id, newName.trim().endsWith('.pdf') ? newName.trim() : `${newName.trim()}.pdf`);
      setRenamingDoc(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-stone-950 overflow-y-auto pb-20 select-none">
      {/* Search Header */}
      <div className="px-4 pt-4 pb-3 sticky top-0 z-10 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="flex items-center space-x-2 bg-white dark:bg-stone-900 px-3.5 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <Search size={18} className="text-stone-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search recent PDFs, scans & forms..."
            className="w-full bg-transparent text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-stone-400 hover:text-stone-600 text-xs font-bold px-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-6 max-w-4xl mx-auto w-full">
        {/* Quick Actions Grid (MobiPDF Style) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Quick Actions
            </h2>
            <button
              onClick={onOpenTools}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
            >
              View All Tools →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className="flex items-center space-x-3 p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-red-500 dark:hover:border-red-500 transition-all text-left shadow-xs group cursor-pointer active:scale-98"
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${action.color} group-hover:scale-105 transition-transform`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                        {action.title}
                      </h3>
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                      {action.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Storage Overview & Sample Loader */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                On-Device Storage
              </span>
              <span className="inline-flex items-center space-x-1 text-[10px] bg-emerald-400 text-emerald-950 font-bold px-1.5 py-0.2 rounded-full">
                <ShieldCheck size={10} />
                <span>100% Offline</span>
              </span>
            </div>
            <h3 className="font-black text-lg mt-1">
              {documents.length} {documents.length === 1 ? 'Document' : 'Documents'} • {formatBytes(totalSize)}
            </h3>
            <p className="text-xs text-white/80 mt-0.5">
              Encrypted locally in Android Storage Access Framework
            </p>
          </div>
          <button
            onClick={onLoadSample}
            className="px-3.5 py-2 rounded-xl bg-white text-red-600 font-bold text-xs hover:bg-stone-100 transition-colors shadow-xs flex items-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Load Demo</span>
          </button>
        </div>

        {/* Recent Files Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Clock size={16} className="text-red-600" />
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Recent Files ({filteredDocs.length})
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1 bg-stone-200/60 dark:bg-stone-900 p-0.5 rounded-xl text-xs">
              {(['all', 'favorites', 'scans'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterType(tab)}
                  className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                    filterType === tab
                      ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 mx-auto flex items-center justify-center">
                <FileText size={28} />
              </div>
              <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">
                {searchQuery ? 'No matching files found' : 'No recent files yet'}
              </h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Scan receipts and contracts using the camera, fill & sign PDF forms, or load our instant interactive demo file.
              </p>
              <div className="flex items-center justify-center space-x-2 pt-2">
                <button
                  onClick={onOpenScanner}
                  className="px-3.5 py-2 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm hover:bg-red-700 cursor-pointer"
                >
                  <Camera size={14} />
                  <span>Scan First Document</span>
                </button>
                <button
                  onClick={onLoadSample}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-semibold text-xs hover:bg-stone-200 dark:hover:bg-stone-700 cursor-pointer"
                >
                  Load Demo PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => onOpenDocument(doc)}
                  className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between shadow-xs hover:border-red-400 dark:hover:border-red-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/30">
                      {doc.thumbnailUrl ? (
                        <img
                          src={doc.thumbnailUrl}
                          alt={doc.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <FileText size={22} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate group-hover:text-red-600 transition-colors">
                        {doc.name}
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                        {formatBytes(doc.size)} • {doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'} •{' '}
                        {new Date(doc.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                        {new Date(doc.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleFavorite(doc.id)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        doc.isFavorite
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                          : 'text-stone-400 hover:text-amber-500 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                      title={doc.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
                    >
                      <Star size={16} fill={doc.isFavorite ? 'currentColor' : 'none'} />
                    </button>

                    <button
                      onClick={e => handleShare(doc, e)}
                      className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                      title="Share via Android Share Sheet"
                    >
                      <Share2 size={16} />
                    </button>

                    <div className="relative">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setMenuDocId(menuDocId === doc.id ? null : doc.id);
                        }}
                        className="p-2 rounded-xl text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                        title="More options"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {menuDocId === doc.id && (
                        <div
                          className="absolute right-0 top-10 w-44 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setMenuDocId(null);
                              onOpenDocument(doc);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl cursor-pointer"
                          >
                            <BookOpen size={14} className="text-red-500" />
                            <span>Open in PDF Reader</span>
                          </button>
                          <button
                            onClick={e => handleStartRename(doc, e)}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl cursor-pointer"
                          >
                            <Edit2 size={14} className="text-blue-500" />
                            <span>Rename</span>
                          </button>
                          <button
                            onClick={e => handlePrint(doc, e)}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl cursor-pointer"
                          >
                            <Printer size={14} className="text-emerald-500" />
                            <span>Print Document</span>
                          </button>
                          <div className="h-px bg-stone-200 dark:bg-stone-800 my-1" />
                          <button
                            onClick={() => {
                              setMenuDocId(null);
                              onDeleteDocument(doc.id);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl cursor-pointer"
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rename Modal */}
      {renamingDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 w-full max-w-sm border border-stone-200 dark:border-stone-800 shadow-2xl">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-1">
              Rename Document
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
              Enter a new name for this file
            </p>
            <form onSubmit={handleSaveRename} className="space-y-4">
              <input
                type="text"
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRenamingDoc(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-sm cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
