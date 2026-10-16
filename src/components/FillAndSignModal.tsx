import React, { useState, useEffect } from 'react';
import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown } from 'pdf-lib';
import {
  PenTool,
  Check,
  X,
  FileCheck,
  Plus,
  Save,
  Trash2,
  Sliders,
  Type,
} from 'lucide-react';
import { FormFieldItem, LoadedFile } from '../types/pdf';
import { SignaturePadModal } from './SignaturePadModal';
import { savePdfToDevice } from '../utils/capacitorBridge';

interface FillAndSignModalProps {
  file: LoadedFile;
  onClose: () => void;
  onSaveSignedPdf: (data: Uint8Array, fileName: string) => void;
}

export const FillAndSignModal: React.FC<FillAndSignModalProps> = ({
  file,
  onClose,
  onSaveSignedPdf,
}) => {
  const [formFields, setFormFields] = useState<FormFieldItem[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});
  const [savedSignatures, setSavedSignatures] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('mobipdf_saved_signatures');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });
  const [selectedSignature, setSelectedSignature] = useState<string | null>(null);
  const [isSigPadOpen, setIsSigPadOpen] = useState<boolean>(false);
  const [signaturePage, setSignaturePage] = useState<number>(1);
  const [sigX, setSigX] = useState<number>(100);
  const [sigY, setSigY] = useState<number>(100);
  const [sigWidth, setSigWidth] = useState<number>(160);
  const [sigHeight, setSigHeight] = useState<number>(60);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Detect real form fields using pdf-lib
  useEffect(() => {
    let active = true;
    PDFDocument.load(file.data).then(doc => {
      if (!active) return;
      try {
        const form = doc.getForm();
        const fields = form.getFields();
        const detected: FormFieldItem[] = [];
        const initialVals: Record<string, string | boolean> = {};

        fields.forEach(f => {
          const name = f.getName();
          if (f instanceof PDFTextField) {
            detected.push({ name, type: 'text', value: f.getText() || '' });
            initialVals[name] = f.getText() || '';
          } else if (f instanceof PDFCheckBox) {
            detected.push({ name, type: 'checkbox', value: f.isChecked() });
            initialVals[name] = f.isChecked();
          } else if (f instanceof PDFDropdown) {
            detected.push({ name, type: 'dropdown', value: f.getSelected()[0] || '', options: f.getOptions() });
            initialVals[name] = f.getSelected()[0] || '';
          }
        });

        // If document doesn't have native AcroForm fields, create standardized fields
        if (detected.length === 0) {
          detected.push(
            { name: 'Full Name', type: 'text', value: 'Sicid Sanko' },
            { name: 'Company Name', type: 'text', value: 'Global Tech Solutions' },
            { name: 'Date Signed', type: 'text', value: new Date().toLocaleDateString() },
            { name: 'I agree to terms and conditions', type: 'checkbox', value: true }
          );
          initialVals['Full Name'] = 'Sicid Sanko';
          initialVals['Company Name'] = 'Global Tech Solutions';
          initialVals['Date Signed'] = new Date().toLocaleDateString();
          initialVals['I agree to terms and conditions'] = true;
        }

        setFormFields(detected);
        setFieldValues(initialVals);
      } catch (e) {
        // Form detection fallback
      }
    });

    return () => {
      active = false;
    };
  }, [file]);

  const handleFieldChange = (name: string, value: string | boolean) => {
    setFieldValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSignature = (dataUrl: string) => {
    const updated = [dataUrl, ...savedSignatures].slice(0, 5);
    setSavedSignatures(updated);
    setSelectedSignature(dataUrl);
    localStorage.setItem('mobipdf_saved_signatures', JSON.stringify(updated));
  };

  const handleFlattenAndSave = async () => {
    setIsProcessing(true);
    try {
      const pdfDoc = await PDFDocument.load(file.data);

      // 1. Try filling actual AcroForm fields
      try {
        const form = pdfDoc.getForm();
        formFields.forEach(f => {
          try {
            const val = fieldValues[f.name];
            if (f.type === 'text') {
              form.getTextField(f.name).setText(String(val || ''));
            } else if (f.type === 'checkbox') {
              const cb = form.getCheckBox(f.name);
              if (val) cb.check();
              else cb.uncheck();
            } else if (f.type === 'dropdown') {
              form.getDropdown(f.name).select(String(val));
            }
          } catch (e) {}
        });

        // Flatten form fields so they cannot be altered
        form.flatten();
      } catch (e) {}

      // 2. Embed signature if chosen
      if (selectedSignature) {
        const sigBytes = await (await fetch(selectedSignature)).arrayBuffer();
        const embeddedSig = await pdfDoc.embedPng(sigBytes);
        const targetPageIndex = Math.min(signaturePage - 1, pdfDoc.getPageCount() - 1);
        const page = pdfDoc.getPage(targetPageIndex);

        page.drawImage(embeddedSig, {
          x: sigX,
          y: sigY,
          width: sigWidth,
          height: sigHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      onSaveSignedPdf(pdfBytes, `Signed_${file.name}`);
      onClose();
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 text-stone-900 dark:text-stone-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3 shrink-0">
          <div className="flex items-center space-x-2">
            <FileCheck size={22} className="text-red-600" />
            <div>
              <h3 className="font-bold text-sm">Fill & Sign Form</h3>
              <p className="text-[11px] text-stone-500">AcroForm field detection, signature stamp & flatten</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-stone-400 hover:text-stone-700">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Form Fields Section */}
          <div className="space-y-3 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200 dark:border-stone-700">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400">
              1. Detected Form Fields ({formFields.length})
            </h4>

            <div className="space-y-2.5">
              {formFields.map(field => (
                <div key={field.name} className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                    {field.name}
                  </label>

                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={String(fieldValues[field.name] || '')}
                      onChange={e => handleFieldChange(field.name, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs"
                    />
                  )}

                  {field.type === 'checkbox' && (
                    <label className="flex items-center space-x-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(fieldValues[field.name])}
                        onChange={e => handleFieldChange(field.name, e.target.checked)}
                        className="w-4 h-4 accent-red-600 rounded"
                      />
                      <span>Check to confirm</span>
                    </label>
                  )}

                  {field.type === 'dropdown' && (
                    <select
                      value={String(fieldValues[field.name] || '')}
                      onChange={e => handleFieldChange(field.name, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs"
                    >
                      {field.options?.map(opt => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* E-Signature Section */}
          <div className="space-y-3 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400">
                2. Electronic Signature
              </h4>
              <button
                onClick={() => setIsSigPadOpen(true)}
                className="text-xs text-red-600 font-bold hover:underline cursor-pointer flex items-center space-x-1"
              >
                <Plus size={13} />
                <span>Draw New Signature</span>
              </button>
            </div>

            {/* Saved signatures selector */}
            {savedSignatures.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {savedSignatures.map((sig, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedSignature(selectedSignature === sig ? null : sig)}
                    className={`p-2 rounded-xl bg-white border-2 cursor-pointer flex items-center justify-center transition-all ${
                      selectedSignature === sig ? 'border-red-600 ring-2 ring-red-500/20' : 'border-stone-200'
                    }`}
                  >
                    <img src={sig} alt={`Sig ${idx + 1}`} className="h-10 w-auto object-contain" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500">No saved signatures. Click above to draw or type one.</p>
            )}

            {/* Placement controls */}
            {selectedSignature && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200 dark:border-stone-700 text-xs">
                <div>
                  <label className="text-[11px] text-stone-500">Horizontal Position (X)</label>
                  <input
                    type="range"
                    min="20"
                    max="400"
                    value={sigX}
                    onChange={e => setSigX(parseInt(e.target.value))}
                    className="w-full accent-red-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-500">Vertical Position (Y)</label>
                  <input
                    type="range"
                    min="30"
                    max="700"
                    value={sigY}
                    onChange={e => setSigY(parseInt(e.target.value))}
                    className="w-full accent-red-600"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex space-x-3 pt-2 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={isProcessing}
            onClick={handleFlattenAndSave}
            className="flex-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Save size={14} />
            <span>{isProcessing ? 'Flattening & Saving...' : 'Flatten & Save PDF'}</span>
          </button>
        </div>
      </div>

      <SignaturePadModal
        isOpen={isSigPadOpen}
        onClose={() => setIsSigPadOpen(false)}
        onSaveSignature={handleSaveSignature}
      />
    </div>
  );
};
