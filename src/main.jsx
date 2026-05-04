import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';
import { devLogger } from './utils/devLogger';

const isExternalExtensionPermissionError = (value) => {
  const message = String(
    value?.reason?.message
    || value?.message
    || value?.error?.message
    || value?.data?.msg
    || ''
  ).toLowerCase();
  const source = String(value?.filename || value?.reason?.stack || value?.stack || '').toLowerCase();
  const requestPath = String(
    value?.reason?.reqInfo?.path
    || value?.reqInfo?.path
    || value?.reason?.path
    || value?.path
    || ''
  ).toLowerCase();
  const statusCode = Number(
    value?.reason?.code
    || value?.code
    || value?.reason?.data?.code
    || value?.data?.code
    || 0
  );

  return (
    statusCode === 403
    && message.includes('permission error')
    && (
      source.includes('content.js')
      || source.includes('chrome-extension')
      || ['/generate', '/get_template_list', '/template_list', '/site_integration'].includes(requestPath)
    )
  );
};

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (isExternalExtensionPermissionError(event)) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    if (isExternalExtensionPermissionError(event)) {
      event.preventDefault();
    }
  });
}

// ============================================
// تنظيف البيانات القديمة من localStorage
// ============================================
function cleanupOldData() {
  try {
    const stored = localStorage.getItem('products-storage');
    if (!stored) return false;

    const data = JSON.parse(stored);
    const firstProduct = data?.state?.products?.[0];

    if (firstProduct && !firstProduct.minimumOrderQty) {
      localStorage.removeItem('products-storage');
      return true;
    }
  } catch (error) {
    devLogger.error('Cleanup error:', error);
  }

  return false;
}

cleanupOldData();

const hideBootLoader = () => {
  if (typeof window === 'undefined') return;
  const bootLoader = document.getElementById('app-boot-loader');
  if (!bootLoader) return;

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      bootLoader.classList.add('is-hidden');
      window.setTimeout(() => {
        bootLoader.remove();
      }, 260);
    });
  });
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

hideBootLoader();
