import React, { createContext, useContext, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check, AlertTriangle, Info } from 'lucide-react';
import { cn } from './Button';
import { useLanguage } from '../../context/LanguageContext';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const { dir } = useLanguage();

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div 
        className={cn(
          "fixed bottom-4 z-[260] flex max-w-[calc(100vw-2rem)] flex-col gap-2.5 pointer-events-none",
          dir === 'rtl' ? "left-4 items-start" : "right-4 items-end"
        )}
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: dir === 'rtl' ? '-130%' : '100%', scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: dir === 'rtl' ? '-130%' : '100%', scale: 0.9 }}
              className={cn(
                'pointer-events-auto flex w-full min-w-0 max-w-sm items-center gap-3 rounded-[1.35rem] border px-4 py-3.5 shadow-[var(--shadow-medium)] backdrop-blur-xl sm:min-w-[300px]',
                toast.type === 'success' &&
                  'border-[color:rgb(var(--color-success-rgb)/0.2)] bg-[color:rgb(var(--color-success-rgb)/0.12)] text-[var(--color-success)]',
                toast.type === 'error' &&
                  'border-[color:rgb(var(--color-error-rgb)/0.2)] bg-[color:rgb(var(--color-error-rgb)/0.12)] text-[var(--color-error)]',
                toast.type === 'warning' &&
                  'border-[color:rgb(var(--color-warning-rgb)/0.2)] bg-[color:rgb(var(--color-warning-rgb)/0.12)] text-[var(--color-warning)]',
                toast.type === 'info' &&
                  'border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[linear-gradient(180deg,rgb(var(--color-primary-rgb)/0.12),rgb(var(--color-primary-rgb)/0.08))] text-[var(--color-primary)]'
              )}
            >
              {toast.type === 'success' && <Check className="w-5 h-5 shrink-0" />}
              {toast.type === 'error' && <X className="w-5 h-5 shrink-0" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 shrink-0" />}
              {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
