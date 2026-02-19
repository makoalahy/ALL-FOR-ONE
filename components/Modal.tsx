
import React from 'react';

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}

const Modal: React.FC<ModalProps> = ({ children, onClose, title }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-card w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 transition-colors duration-300 border-t border-border-main sm:border">
        <div className="px-6 py-5 border-b border-border-main flex justify-between items-center">
          <h2 className="text-lg font-black text-text-main tracking-tight uppercase">{title}</h2>
          <button onClick={onClose} className="size-8 rounded-full bg-background flex items-center justify-center text-text-muted">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto hide-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
