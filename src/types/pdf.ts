export type ToolCategory =
  | 'organize'
  | 'optimize'
  | 'convert_to'
  | 'convert_from'
  | 'edit'
  | 'security'
  | 'ai';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  badge?: string;
  color: string;
  icon: string;
  offlineSupport: 'Full Offline' | 'On-Device ML' | 'Cloud / Hybrid';
  phase: number;
  featured?: boolean;
}

export interface LoadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: Uint8Array;
  pageCount?: number;
  previewUrl?: string;
}

export interface RecentFileRecord {
  id: string;
  name: string;
  size: number;
  toolUsed: string;
  timestamp: number;
  pageCount: number;
  favorite?: boolean;
}

export type ProcessingStep = 'idle' | 'picking' | 'configuring' | 'processing' | 'completed' | 'error';

export interface MergeOptions {
  files: LoadedFile[];
}

export interface SplitOptions {
  mode: 'ranges' | 'extract_all' | 'every_n';
  rangeString: string;
  everyN: number;
}

export interface CompressOptions {
  level: 'low' | 'recommended' | 'extreme';
}

export interface RotateOptions {
  angle: 90 | 180 | 270;
  applyTo: 'all' | 'specific';
  pages: number[];
}

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  opacity: number;
  rotation: number;
  color: string;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center';
}

export interface PageNumberOptions {
  format: string; // e.g. "Page {n} of {total}"
  position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right';
  startNumber: number;
}

export interface ImageToPdfOptions {
  orientation: 'portrait' | 'landscape';
  pageSize: 'A4' | 'Letter';
  margin: number;
}

export interface SignOptions {
  signatureDataUrl: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AppDocument {
  id: string;
  name: string;
  path: string;
  size: number;
  date: number;
  pageCount: number;
  thumbnailUrl?: string;
  folder?: string;
  isFavorite?: boolean;
}

export interface AnnotationItem {
  id: string;
  type: 'highlight' | 'underline' | 'strike' | 'text' | 'drawing' | 'stamp' | 'comment';
  pageIndex: number;
  color: string;
  text?: string;
  points?: { x: number; y: number }[];
  rect?: { x: number; y: number; width: number; height: number };
  opacity?: number;
}

export interface FormFieldItem {
  name: string;
  type: 'text' | 'checkbox' | 'dropdown' | 'radio';
  value: string | boolean;
  options?: string[];
  readOnly?: boolean;
}
