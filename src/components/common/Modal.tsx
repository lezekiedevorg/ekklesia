'use client';
import { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onClose, children, maxWidth = 'max-w-lg' }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  // Portal vers <body> : sinon un ancêtre avec transform/backdrop-filter
  // (animate-fade-in-up, glass-panel) devient le bloc conteneur du `fixed`
  // et l'overlay ne couvre plus tout l'écran.
  return createPortal(
    <div
      data-testid="modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        data-testid="modal-container"
        className={`${maxWidth} w-full max-h-[95vh] flex flex-col bg-white rounded-3xl border border-slate-200/80 shadow-2xl relative`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          data-testid="modal-close"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
        >
          ×
        </button>
        <div className="overflow-y-auto overscroll-contain p-5 sm:p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
