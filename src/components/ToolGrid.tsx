import React, { useState } from 'react';
import {
  Layers,
  Split,
  Trash2,
  ExternalLink,
  LayoutGrid,
  Camera,
  Minimize2,
  Wrench,
  ScanText,
  Image,
  FileText,
  Presentation,
  Sheet,
  Code,
  FileImage,
  FileSpreadsheet,
  FileCode,
  Table,
  Archive,
  RotateCw,
  Hash,
  Stamp,
  Crop,
  Edit3,
  Unlock,
  Lock,
  PenTool,
  EyeOff,
  GitCompare,
  Sparkles,
  Languages,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { TOOLS, TOOL_CATEGORIES, filterTools, ToolDefinition } from '../utils/pdfEngineLogic';
import { RecentFileRecord } from '../types/pdf';

const ICON_MAP: Record<string, React.ElementType> = {
  Layers,
  Split,
  Trash2,
  ExternalLink,
  LayoutGrid,
  Camera,
  Minimize2,
  Wrench,
  ScanText,
  Image,
  FileText,
  Presentation,
  Sheet,
  Code,
  FileImage,
  FileSpreadsheet,
  FileCode,
  Table,
  Archive,
  RotateCw,
  Hash,
  Stamp,
  Crop,
  Edit3,
  Unlock,
  Lock,
  PenTool,
  EyeOff,
  GitCompare,
  Sparkles,
  Languages,
};

interface ToolGridProps {
  onSelectTool: (tool: ToolDefinition) => void;
  recentFiles: RecentFileRecord[];
  onOpenRecent: (file: RecentFileRecord) => void;
  onOpenViewer: () => void;
}

export const ToolGrid: React.FC<ToolGridProps> = ({
  onSelectTool,
  recentFiles,
  onOpenRecent,
  onOpenViewer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredTools = filterTools(searchQuery, activeCategory);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {/* Search Bar - Material 3 Search style */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search 23 PDF tools (Merge, Split, OCR, Sign...)"
          className="w-full pl-10 pr-4 py-2.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm placeholder-stone-400 dark:placeholder-stone-500 border border-stone-200 dark:border-stone-700/60 focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {TOOL_CATEGORIES.map(cat => {
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Recent Files Carousel (if available) */}
      {recentFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-medium">
            <span className="flex items-center space-x-1.5">
              <Clock size={13} />
              <span>Recent Files (Room DB)</span>
            </span>
            <span className="text-[11px]">{recentFiles.length} files stored</span>
          </div>
          <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none">
            {recentFiles.slice(0, 5).map(item => (
              <div
                key={item.id}
                onClick={() => onOpenRecent(item)}
                className="shrink-0 w-44 p-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 hover:border-red-400 dark:hover:border-red-500/50 shadow-xs cursor-pointer transition-all hover:scale-[1.01]"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <FileText size={14} />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500">
                      {item.pageCount} pages • {item.toolUsed}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid of Tools */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            {activeCategory === 'all' ? 'All PDF Tools' : activeCategory.replace('_', ' ')} ({filteredTools.length})
          </p>
          <span className="text-[11px] text-stone-400 dark:text-stone-500">Tap card to run</span>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTools.map(tool => {
            const Icon = ICON_MAP[tool.icon] || Layers;
            return (
              <div
                key={tool.id}
                onClick={() => onSelectTool(tool)}
                className="group relative flex flex-col justify-between p-3.5 rounded-2xl bg-white dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/50 hover:border-red-500 dark:hover:border-red-500 shadow-xs hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 active:scale-[0.99]"
              >
                {/* Header row: Icon + Badges */}
                <div className="flex items-start justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${tool.color}18`,
                      color: tool.color,
                    }}
                  >
                    <Icon size={20} />
                  </div>

                  <div className="flex items-center space-x-1">
                    {tool.badge && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-200">
                        {tool.badge}
                      </span>
                    )}
                    <span
                      className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md ${
                        tool.offlineSupport === 'Full Offline'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : tool.offlineSupport === 'On-Device ML'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {tool.offlineSupport}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="mt-3">
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-0.5 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                {/* Footer hint */}
                <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-700/40 flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500">
                  <span>Phase {tool.phase}</span>
                  <div className="flex items-center space-x-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    <span className="text-[10px] font-medium">Open tool</span>
                    <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
