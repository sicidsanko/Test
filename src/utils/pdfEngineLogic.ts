/**
 * Pure logic and algorithmic helper functions for the MobiPDF engine.
 * Fully decoupled from UI/DOM for unit testing and clean architecture.
 */

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  badge?: string;
  color: string;
  icon: string;
  offlineSupport: 'Full Offline' | 'On-Device ML';
  phase: number;
  featured?: boolean;
}

export type ToolCategory = 'organize' | 'optimize' | 'convert' | 'security';

export type CompressionLevel = 'low' | 'recommended' | 'extreme';

export const TOOLS: ToolDefinition[] = [
  // 1. Scanner & Gallery
  {
    id: 'scan_to_pdf',
    name: 'Scanner',
    description: 'Scan multiple pages with automatic edge detection, crop, and camera filters.',
    category: 'organize',
    color: '#E5322D',
    icon: 'Camera',
    offlineSupport: 'On-Device ML',
    phase: 1,
    featured: true,
    badge: 'Main',
  },
  {
    id: 'jpg_to_pdf',
    name: 'Gallery to PDF',
    description: 'Import photos from your device gallery and turn them into a multi-page PDF.',
    category: 'convert',
    color: '#059669',
    icon: 'Image',
    offlineSupport: 'Full Offline',
    phase: 1,
    featured: true,
  },

  // 2. Organize
  {
    id: 'merge',
    name: 'Merge PDF',
    description: 'Combine multiple PDF documents into a single organized file.',
    category: 'organize',
    color: '#E5322D',
    icon: 'Layers',
    offlineSupport: 'Full Offline',
    phase: 1,
    featured: true,
  },
  {
    id: 'split',
    name: 'Split PDF',
    description: 'Separate a PDF document by page ranges or extract individual pages.',
    category: 'organize',
    color: '#E5322D',
    icon: 'Split',
    offlineSupport: 'Full Offline',
    phase: 1,
  },
  {
    id: 'organize_pages',
    name: 'Organize Pages',
    description: 'Rearrange page order, rotate pages, or delete unnecessary pages visually.',
    category: 'organize',
    color: '#7C3AED',
    icon: 'RotateCw',
    offlineSupport: 'Full Offline',
    phase: 1,
    featured: true,
  },

  // 3. Optimize
  {
    id: 'compress',
    name: 'Compress PDF',
    description: 'Reduce PDF file size instantly with clear before-and-after size comparison.',
    category: 'optimize',
    color: '#2563EB',
    icon: 'Minimize2',
    offlineSupport: 'Full Offline',
    phase: 1,
    featured: true,
  },

  // 4. Convert
  {
    id: 'pdf_to_jpg',
    name: 'PDF to JPG',
    description: 'Extract every page of your PDF into high-resolution image files.',
    category: 'convert',
    color: '#D97706',
    icon: 'FileImage',
    offlineSupport: 'Full Offline',
    phase: 1,
    featured: true,
  },

  // 5. Security & Sign
  {
    id: 'sign',
    name: 'Sign PDF',
    description: 'Draw your signature, place it anywhere on the page, and save.',
    category: 'security',
    color: '#DC2626',
    icon: 'PenTool',
    offlineSupport: 'Full Offline',
    phase: 1,
    featured: true,
  },
  {
    id: 'protect',
    name: 'Protect PDF',
    description: 'Secure your PDF document with strong password encryption.',
    category: 'security',
    color: '#DC2626',
    icon: 'Lock',
    offlineSupport: 'Full Offline',
    phase: 1,
    featured: true,
  },
];

export const TOOL_CATEGORIES = [
  { id: 'all', name: 'All Tools' },
  { id: 'organize', name: 'Organize' },
  { id: 'optimize', name: 'Optimize' },
  { id: 'convert', name: 'Convert' },
  { id: 'security', name: 'Security & Sign' },
];

export function filterTools(query: string, category: string): ToolDefinition[] {
  return TOOLS.filter(tool => {
    const matchesQuery =
      tool.name.toLowerCase().includes(query.toLowerCase()) ||
      tool.description.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === 'all' || tool.category === category;
    return matchesQuery && matchesCategory;
  });
}

export function parsePageRanges(rangeStr: string, totalPages: number): number[] {
  const pages: Set<number> = new Set();
  const parts = rangeStr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(n => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
          pages.add(i - 1);
        }
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        pages.add(num - 1);
      }
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatPageNumber(formatStr: string, pageNum: number, totalPages: number): string {
  return formatStr
    .replace('{n}', pageNum.toString())
    .replace('{total}', totalPages.toString());
}

export function calculateCompressionEstimate(fileSize: number, level: CompressionLevel): number {
  if (level === 'low') return Math.round(fileSize * 0.85);
  if (level === 'recommended') return Math.round(fileSize * 0.55);
  return Math.round(fileSize * 0.25);
}

export function validateFileForTool(file: { size: number; type: string }, toolId: string): boolean {
  if (!file) return false;
  return true;
}
