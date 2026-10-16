import React from 'react';
import { Clock, FileText, Trash2, BookOpen, ExternalLink, Download } from 'lucide-react';
import { RecentFileRecord } from '../types/pdf';
import { formatBytes } from '../utils/pdfEngineLogic';

interface RecentsScreenProps {
  recentFiles: RecentFileRecord[];
  onOpenViewer: (fileName: string) => void;
  onClearHistory: () => void;
  onDeleteRecent: (id: string) => void;
}

export const RecentsScreen: React.FC<RecentsScreenProps> = ({
  recentFiles,
  onOpenViewer,
  onClearHistory,
  onDeleteRecent,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-stone-950 p-4 md:p-6 overflow-y-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
            <Clock size={20} className="text-red-600" />
            <span>Recent Files</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Managed locally via Android Room Database (`recent_files` table)
          </p>
        </div>

        {recentFiles.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-medium px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      {recentFiles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-stone-100 dark:bg-stone-900 text-stone-400 flex items-center justify-center">
            <Clock size={32} />
          </div>
          <h3 className="font-bold text-sm text-stone-700 dark:text-stone-300">No Recent Files Yet</h3>
          <p className="text-xs text-stone-500 max-w-xs">
            Documents processed using Merge, Split, Compress, Rotate or other tools will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentFiles.map(file => (
            <div
              key={file.id}
              className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between shadow-xs hover:border-red-400 dark:hover:border-red-500/50 transition-all"
            >
              <div className="flex items-center space-x-3 truncate">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div className="truncate">
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                    {file.name}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    {formatBytes(file.size)} • {file.pageCount} pages • Tool: {file.toolUsed} •{' '}
                    {new Date(file.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                <button
                  onClick={() => onOpenViewer(file.name)}
                  className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  title="Open in Built-in PDF Viewer"
                >
                  <BookOpen size={16} />
                </button>
                <button
                  onClick={() => onDeleteRecent(file.id)}
                  className="p-2 rounded-xl text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  title="Delete from history"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
