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
      {/* FLOATING TOASTS CONTAINER (Top-Right)                     */}
      {/* ======================================================== */}
      <div 
        style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '420px',
          pointerEvents: 'none'
        }}
      >
        {toasts.map(t => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          const borderColor = isSuccess 
            ? 'rgba(16, 185, 129, 0.45)' 
            : isError 
            ? 'rgba(239, 68, 68, 0.45)' 
            : isWarning 
            ? 'rgba(245, 158, 11, 0.45)' 
            : 'rgba(99, 102, 241, 0.45)';

          const bgColor = isSuccess 
            ? 'rgba(6, 78, 59, 0.92)' 
            : isError 
            ? 'rgba(127, 29, 29, 0.92)' 
            : isWarning 
            ? 'rgba(120, 53, 15, 0.92)' 
            : 'rgba(30, 41, 59, 0.94)';

          const iconColor = isSuccess ? '#34d399' : isError ? '#f87171' : isWarning ? '#fbbf24' : '#818cf8';

          return (
            <div
              key={t.id}
              className="animate-fade-in"
              style={{
                pointerEvents: 'auto',
                background: bgColor,
                border: `1.5px solid ${borderColor}`,
                boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.65), 0 0 15px rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                color: '#f8fafc',
                transition: 'all 0.25s ease'
              }}
            >
              <div style={{ marginTop: '2px', color: iconColor, flexShrink: 0 }}>
                {isSuccess && <CheckCircle2 size={20} />}
                {isError && <AlertCircle size={20} />}
                {isWarning && <AlertTriangle size={20} />}
                {!isSuccess && !isError && !isWarning && <Info size={20} />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {t.title && (
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '2px', color: '#ffffff' }}>
                    {t.title}
                  </div>
                )}
                <div style={{ fontSize: '0.82rem', lineHeight: '1.45', color: '#e2e8f0', wordBreak: 'break-word' }}>
                  {t.message}
                </div>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
              >
                <X size={15} />
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
            background: 'rgba(3, 7, 18, 0.82)',
            backdropFilter: 'blur(8px)',
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
              maxWidth: '480px',
              background: '#0f172a',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.85), 0 0 25px rgba(99, 102, 241, 0.15)',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            {/* Top Icon Badge */}
            <div 
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                margin: '0 auto 16px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: dialog.type === 'danger' || dialog.type === 'error'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : dialog.type === 'warning'
                  ? 'rgba(245, 158, 11, 0.15)'
                  : dialog.type === 'success'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(99, 102, 241, 0.15)',
                color: dialog.type === 'danger' || dialog.type === 'error'
                  ? '#f87171'
                  : dialog.type === 'warning'
                  ? '#fbbf24'
                  : dialog.type === 'success'
                  ? '#34d399'
                  : '#818cf8'
              }}
            >
              {dialog.type === 'danger' || dialog.type === 'error' ? (
                <Trash2 size={26} />
              ) : dialog.type === 'warning' ? (
                <AlertTriangle size={26} />
              ) : dialog.type === 'success' ? (
                <CheckCircle2 size={26} />
              ) : (
                <Info size={26} />
              )}
            </div>

            {/* Title */}
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
              {dialog.title}
            </h3>

            {/* Message Body */}
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.55', marginBottom: '24px', wordBreak: 'break-word' }}>
              {dialog.message}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              {dialog.isConfirm && (
                <button
                  type="button"
                  onClick={dialog.onCancel}
                  className="btn btn-secondary"
                  style={{
                    padding: '10px 20px',
                    fontSize: '0.86rem',
                    flex: 1,
                    justifyContent: 'center'
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
                  padding: '10px 22px',
                  fontSize: '0.86rem',
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
                    ? '0 4px 15px rgba(239, 68, 68, 0.4)' 
                    : '0 4px 15px rgba(99, 102, 241, 0.4)'
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
