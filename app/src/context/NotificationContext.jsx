import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X,
  Trash2
} from 'lucide-react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  // Toasts list: [{ id, type, title, message, duration }]
  const [toasts, setToasts] = useState([]);
  
  // Dialog state: { isOpen, title, message, type, confirmText, cancelText, isConfirm, onConfirm, onCancel }
  const [dialog, setDialog] = useState(null);
  const dialogResolverRef = useRef(null);

  // 1. Toast Notification Trigger
  const showToast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    const type = typeof options === 'string' ? options : (options.type || 'success');
    const title = typeof options === 'object' && options.title ? options.title : '';
    const duration = typeof options === 'object' && options.duration ? options.duration : 3800;

    const newToast = { id, type, title, message, duration };
    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // 2. Alert Modal Trigger (replaces window.alert)
  const showAlert = useCallback(({ title = 'Thông báo', message, type = 'info', confirmText = 'Đã hiểu' }) => {
    return new Promise((resolve) => {
      dialogResolverRef.current = () => {
        setDialog(null);
        resolve(true);
      };

      setDialog({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        isConfirm: false,
        onConfirm: () => {
          if (dialogResolverRef.current) dialogResolverRef.current();
        }
      });
    });
  }, []);

  // 3. Confirm Modal Trigger (replaces window.confirm)
  const showConfirm = useCallback(({ 
    title = 'Xác nhận thao tác', 
    message, 
    type = 'warning', 
    confirmText = 'Đồng ý', 
    cancelText = 'Hủy bỏ' 
  }) => {
    return new Promise((resolve) => {
      dialogResolverRef.current = (result) => {
        setDialog(null);
        resolve(result);
      };

      setDialog({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        isConfirm: true,
        onConfirm: () => {
          if (dialogResolverRef.current) dialogResolverRef.current(true);
        },
        onCancel: () => {
          if (dialogResolverRef.current) dialogResolverRef.current(false);
        }
      });
    });
  }, []);

  // Handle ESC key to quickly dismiss active dialog
  useEffect(() => {
    if (!dialog || !dialog.isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        if (dialog.isConfirm) {
          dialog.onCancel();
        } else {
          dialog.onConfirm();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog]);

  // Convenience helper object
  const notify = {
    toast: showToast,
    success: (msg, title = 'Thành công') => showToast(msg, { type: 'success', title }),
    error: (msg, title = 'Lỗi') => showToast(msg, { type: 'error', title, duration: 5000 }),
    warning: (msg, title = 'Cảnh báo') => showToast(msg, { type: 'warning', title }),
    info: (msg, title = 'Thông tin') => showToast(msg, { type: 'info', title }),
    alert: showAlert,
    confirm: showConfirm
  };

  return (
    <NotificationContext.Provider value={notify}>
      {children}

      {/* ======================================================== */}
      {/* FLOATING TOASTS CONTAINER (Bottom-Right, Compact & Modern) */}
      {/* ======================================================== */}
      <div 
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: '8px',
          maxWidth: '350px',
          pointerEvents: 'none'
        }}
      >
        {toasts.map(t => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          const accentColor = isSuccess 
            ? '#10b981' 
            : isError 
            ? '#ef4444' 
            : isWarning 
            ? '#f59e0b' 
            : '#2563eb';

          const iconBg = isSuccess 
            ? '#ecfdf5' 
            : isError 
            ? '#fef2f2' 
            : isWarning 
            ? '#fffbeb' 
            : '#eff6ff';

          const iconColor = isSuccess 
            ? '#059669' 
            : isError 
            ? '#dc2626' 
            : isWarning 
            ? '#d97706' 
            : '#2563eb';

          return (
            <div
              key={t.id}
              className="animate-toast"
              style={{
                pointerEvents: 'auto',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderLeft: `4px solid ${accentColor}`,
                boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.12), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                transition: 'all 0.2s ease'
              }}
            >
              <div 
                style={{ 
                  width: '26px', 
                  height: '26px', 
                  borderRadius: '6px', 
                  background: iconBg, 
                  color: iconColor, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flexShrink: 0,
                  marginTop: '1px'
                }}
              >
                {isSuccess && <CheckCircle2 size={16} strokeWidth={2.3} />}
                {isError && <AlertCircle size={16} strokeWidth={2.3} />}
                {isWarning && <AlertTriangle size={16} strokeWidth={2.3} />}
                {!isSuccess && !isError && !isWarning && <Info size={16} strokeWidth={2.3} />}
              </div>

              <div style={{ flex: 1, minWidth: 0, paddingRight: '4px' }}>
                {t.title && (
                  <div style={{ fontWeight: 650, fontSize: '0.82rem', lineHeight: '1.25', color: '#0f172a' }}>
                    {t.title}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', lineHeight: '1.4', color: '#475569', marginTop: t.title ? '2px' : 0, wordBreak: 'break-word' }}>
                  {t.message}
                </div>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                title="Đóng thông báo"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                  marginTop: '-2px',
                  marginRight: '-2px'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#1e293b';
                  e.currentTarget.style.background = '#f1f5f9';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* CUSTOM BEAUTIFUL MODAL DIALOG (Alert & Confirm)          */}
      {/* ======================================================== */}
      {dialog && dialog.isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && dialog.isConfirm) {
              dialog.onCancel();
            }
          }}
        >
          <div 
            className="animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.2), 0 0 1px rgba(15, 23, 42, 0.1)',
              borderRadius: '14px',
              padding: '24px',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            {/* Top Icon Badge */}
            <div 
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                margin: '0 auto 14px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: dialog.type === 'danger' || dialog.type === 'error'
                  ? '#fef2f2'
                  : dialog.type === 'warning'
                  ? '#fffbeb'
                  : dialog.type === 'success'
                  ? '#ecfdf5'
                  : '#eff6ff',
                color: dialog.type === 'danger' || dialog.type === 'error'
                  ? '#dc2626'
                  : dialog.type === 'warning'
                  ? '#d97706'
                  : dialog.type === 'success'
                  ? '#059669'
                  : '#2563eb'
              }}
            >
              {dialog.type === 'danger' || dialog.type === 'error' ? (
                <Trash2 size={24} />
              ) : dialog.type === 'warning' ? (
                <AlertTriangle size={24} />
              ) : dialog.type === 'success' ? (
                <CheckCircle2 size={24} />
              ) : (
                <Info size={24} />
              )}
            </div>

            {/* Title */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              {dialog.title}
            </h3>

            {/* Message Body */}
            <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5', marginBottom: '22px', wordBreak: 'break-word' }}>
              {dialog.message}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              {dialog.isConfirm && (
                <button
                  type="button"
                  onClick={dialog.onCancel}
                  className="btn btn-secondary"
                  style={{
                    padding: '9px 18px',
                    fontSize: '0.84rem',
                    flex: 1,
                    justifyContent: 'center',
                    borderRadius: '8px'
                  }}
                >
                  {dialog.cancelText || 'Hủy bỏ'}
                </button>
              )}

              <button
                type="button"
                onClick={dialog.onConfirm}
                className="btn"
                style={{
                  padding: '9px 20px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  flex: 1,
                  justifyContent: 'center',
                  background: dialog.type === 'danger' || dialog.type === 'error'
                    ? '#ef4444'
                    : dialog.type === 'warning'
                    ? '#f59e0b'
                    : 'var(--accent-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: dialog.type === 'danger' 
                    ? '0 4px 12px rgba(239, 68, 68, 0.3)' 
                    : '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}
              >
                {dialog.confirmText || 'Đồng ý'}
              </button>
            </div>
          </div>
        </div>
      )}

    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
