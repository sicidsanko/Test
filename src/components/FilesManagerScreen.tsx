import React, { useState } from 'react';
import {
  Folder,
  FileText,
  Search,
  Star,
  MoreVertical,
  Plus,
  Trash2,
  Edit2,
  Share2,
  Printer,
  ExternalLink,
  ArrowUpDown,
  Grid,
  List,
  FolderPlus,
  Check,
  X,
  BookOpen,
} from 'lucide-react';
import { AppDocument } from '../types/pdf';
import { formatBytes } from '../utils/pdfEngineLogic';
import { sharePdf, printPdfDocument } from '../utils/capacitorBridge';

interface FilesManagerScreenProps {
  documents: AppDocument[];
  folders: string[];
  onOpenDocument: (doc: AppDocument) => void;
  onDeleteDocument: (id: string) => void;
  onRenameDocument: (id: string, newName: string) => void;
  onToggleFavorite: (id: string) => void;
  onMoveToFolder: (id: string, folder: string) => void;
  onCreateFolder: (folderName: string) => void;
}

export const FilesManagerScreen: React.FC<FilesManagerScreenProps> = ({
  documents,
  folders,
  onOpenDocument,
  onDeleteDocument,
  onRenameDocument,
  onToggleFavorite,
  onMoveToFolder,
  onCreateFolder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'size_desc'>('date_desc');
  const [viewLayout, setViewLayout] = useState<'list' | 'grid'>('list');

  // Modals
  const [renamingDoc, setRenamingDoc] = useState<AppDocument | null>(null);
  const [newNameInput, setNewNameInput] = useState('');
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);

  // Filter & sort
  const filteredDocs = documents
    .filter(doc => {
      const matchesSearch = !searchQuery || doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (selectedFolder === 'favorites') return matchesSearch && doc.isFavorite;
      if (selectedFolder === 'all') return matchesSearch;
      return matchesSearch && doc.folder === selectedFolder;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') return b.date - a.date;
      if (sortBy === 'date_asc') return a.date - b.date;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'size_desc') return b.size - a.size;
      return 0;
    });

  const handleStartRename = (doc: AppDocument) => {
    setRenamingDoc(doc);
    setNewNameInput(doc.name);
    setActiveMenuDocId(null);
  };

  const handleSaveRename = () => {
    if (renamingDoc && newNameInput.trim()) {
      onRenameDocument(renamingDoc.id, newNameInput.trim());
      setRenamingDoc(null);
    }
  };

  const handleCreateNewFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsNewFolderOpen(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-stone-950 overflow-hidden font-sans">
      {/* Top Header & Search */}
      <div className="p-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
              <Folder size={20} className="text-red-600" />
              <span>Files & Documents</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {documents.length} saved document{documents.length === 1 ? '' : 's'} in Documents storage
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsNewFolderOpen(true)}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 cursor-pointer"
              title="Create New Folder"
            >
              <FolderPlus size={17} />
            </button>
            <button
              onClick={() => setViewLayout(v => (v === 'list' ? 'grid' : 'list'))}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 cursor-pointer"
              title={viewLayout === 'list' ? 'Switch to Grid View' : 'Switch to List View'}
            >
              {viewLayout === 'list' ? <Grid size={17} /> : <List size={17} />}
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search saved files..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-stone-100 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-red-500/30"
          />
        </div>

        {/* Folders Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedFolder('all')}
            className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer ${
              selectedFolder === 'all'
                ? 'bg-red-600 text-white font-bold'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
            }`}
          >
            All Files
          </button>
          <button
            onClick={() => setSelectedFolder('favorites')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-full whitespace-nowrap cursor-pointer ${
              selectedFolder === 'favorites'
                ? 'bg-amber-500 text-white font-bold'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
            }`}
          >
            <Star size={12} className="fill-current" />
            <span>Favorites</span>
          </button>
          {folders.map(f => (
            <button
              key={f}
              onClick={() => setSelectedFolder(f)}
              className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer ${
                selectedFolder === f
                  ? 'bg-red-600 text-white font-bold'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Document List / Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredDocs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 text-stone-500">
            <FileText size={42} className="mx-auto text-stone-400 opacity-60" />
            <h4 className="font-bold text-sm text-stone-700 dark:text-stone-300">No Documents Found</h4>
            <p className="text-xs max-w-xs leading-relaxed">
              Scan documents with the camera or use any PDF tool to create and organize your files here.
            </p>
          </div>
        ) : viewLayout === 'list' ? (
          /* List View */
          <div className="space-y-2">
            {filteredDocs.map(doc => (
              <div
                key={doc.id}
                className="relative p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between hover:border-red-400 dark:hover:border-red-500/50 shadow-xs transition-all"
              >
                <div
                  onClick={() => onOpenDocument(doc)}
                  className="flex items-center space-x-3 flex-1 truncate cursor-pointer"
                >
                  {doc.thumbnailUrl ? (
                    <img
                      src={doc.thumbnailUrl}
                      alt={doc.name}
                      className="w-11 h-14 object-cover rounded-lg border border-stone-200 dark:border-stone-700 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-14 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center shrink-0">
                      <FileText size={22} />
                    </div>
                  )}

                  <div className="truncate flex-1">
                    <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate">
                      {doc.name}
                    </h4>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      {formatBytes(doc.size)} • {doc.pageCount} page{doc.pageCount > 1 ? 's' : ''} •{' '}
                      {new Date(doc.date).toLocaleDateString()}
                    </p>
                    {doc.folder && (
                      <span className="inline-block mt-1 text-[9px] px-2 py-0.2 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                        {doc.folder}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right quick buttons */}
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => onToggleFavorite(doc.id)}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      doc.isFavorite
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-stone-400 hover:text-stone-600'
                    }`}
                    title="Toggle Favorite"
                  >
                    <Star size={16} className={doc.isFavorite ? 'fill-current' : ''} />
                  </button>

                  <button
                    onClick={() => setActiveMenuDocId(activeMenuDocId === doc.id ? null : doc.id)}
                    className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>

                {/* Popover Menu */}
                {activeMenuDocId === doc.id && (
                  <div className="absolute right-3 top-12 z-30 w-44 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-700 p-1.5 text-xs space-y-0.5">
                    <button
                      onClick={() => {
                        onOpenDocument(doc);
                        setActiveMenuDocId(null);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center space-x-2 text-stone-700 dark:text-stone-200"
                    >
                      <BookOpen size={14} />
                      <span>Open Reader</span>
                    </button>
                    <button
                      onClick={() => handleStartRename(doc)}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center space-x-2 text-stone-700 dark:text-stone-200"
                    >
                      <Edit2 size={14} />
                      <span>Rename</span>
                    </button>
                    <button
                      onClick={() => {
                        sharePdf(doc.path, doc.name);
                        setActiveMenuDocId(null);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center space-x-2 text-stone-700 dark:text-stone-200"
                    >
                      <Share2 size={14} />
                      <span>Share Sheet</span>
                    </button>
                    <button
                      onClick={() => {
                        printPdfDocument(doc.path, doc.name);
                        setActiveMenuDocId(null);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center space-x-2 text-stone-700 dark:text-stone-200"
                    >
                      <Printer size={14} />
                      <span>Print Document</span>
                    </button>
                    <div className="border-t border-stone-100 dark:border-stone-700 my-1"></div>
                    <button
                      onClick={() => {
                        onDeleteDocument(doc.id);
                        setActiveMenuDocId(null);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 flex items-center space-x-2"
                    >
                      <Trash2 size={14} />
                      <span>Delete File</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredDocs.map(doc => (
              <div
                key={doc.id}
                onClick={() => onOpenDocument(doc)}
                className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col justify-between shadow-xs hover:border-red-400 cursor-pointer space-y-2 group"
              >
                <div className="w-full aspect-3/4 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 flex items-center justify-center border border-stone-200/60 dark:border-stone-700/60">
                  {doc.thumbnailUrl ? (
                    <img src={doc.thumbnailUrl} alt={doc.name} className="w-full h-full object-cover" />
                  ) : (
                    <FileText size={32} className="text-red-500" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate group-hover:text-red-600">
                    {doc.name}
                  </h4>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    {formatBytes(doc.size)} • {doc.pageCount} p
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {renamingDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-5 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-3">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">Rename File</h3>
            <input
              type="text"
              value={newNameInput}
              onChange={e => setNewNameInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100"
              autoFocus
            />
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setRenamingDoc(null)}
                className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRename}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-5 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-3">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">Create New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="e.g. Tax Documents, Receipts..."
              className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100"
              autoFocus
            />
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setIsNewFolderOpen(false)}
                className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewFolder}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-md"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
