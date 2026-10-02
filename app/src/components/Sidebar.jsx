import React from 'react';
import { 
  UploadCloud, 
  Layers, 
  CheckCircle2, 
  Download, 
  Sparkles, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight, 
  Database, 
  FileJson, 
  ShieldCheck, 
  User,
  ExternalLink,
  Tag
} from 'lucide-react';
import { exportSettingsToJSON } from '../services/storageService';

export default function Sidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  onLoadSample,
  isSampleLoading,
  pimFiles = [],
  pimProductData,
  transformationResult,
  masterFiles = {},
  onOpenMasterData
}) {
  // Count ready master datasets
  const masterKeys = ['cmsCatalog', 'pimOption', 'mappingRef', 'cmsTemplate', 'catMappingRef', 'cmsValueTemplate'];
  const readyMastersCount = masterKeys.filter(k => masterFiles[k]?.parsedData).length;

  const primarySteps = [
    { 
      id: 'upload', 
      stepNum: '1', 
      label: '1. Nạp File PIM', 
      icon: UploadCloud, 
      count: pimFiles.length > 0 ? `${pimFiles.length} file` : null,
      countColor: '#2563eb'
    },
    { 
      id: 'preview', 
      stepNum: '2', 
      label: '2. Đối Soát & Xem Trước', 
      icon: CheckCircle2, 
      count: transformationResult ? `${(transformationResult.validImportRows?.length || 0).toLocaleString()} SP` : (pimProductData ? 'Chờ chạy' : null),
      countColor: '#0284c7'
    },
    { 
      id: 'export', 
      stepNum: '3', 
      label: '3. Xuất File CMS', 
      icon: Download, 
      count: transformationResult ? 'Sẵn sàng' : null,
      countColor: '#059669'
    }
  ];

  return (
    <aside 
      style={{
        width: isCollapsed ? '76px' : '285px',
        minWidth: isCollapsed ? '76px' : '285px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid var(--border-medium)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50,
        boxShadow: '1px 0 4px rgba(2, 132, 199, 0.05)'
      }}
    >
      {/* Top Header / Branding */}
      <div>
        <div style={{
          padding: isCollapsed ? '18px 12px' : '18px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between'
        }}>
          {!isCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(37, 99, 235, 0.28)'
              }}>
                <FileSpreadsheet size={20} color="#ffffff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    PIM ➔ CMS
                  </span>
                  <span className="badge badge-gold" style={{ fontSize: '0.64rem', padding: '1px 5px' }}>v2.0</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                  Chuyển Đổi Đa Ngành
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(37, 99, 235, 0.28)'
            }}>
              <FileSpreadsheet size={20} color="#ffffff" />
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="btn btn-secondary"
            style={{ 
              padding: '6px', 
              borderRadius: '7px',
              display: isCollapsed ? 'none' : 'flex'
            }}
            title={isCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Collapsed expand button */}
        {isCollapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
            <button
              onClick={() => setIsCollapsed(false)}
              className="btn btn-secondary"
              style={{ padding: '6px', borderRadius: '7px' }}
              title="Mở rộng thanh bên"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Primary Conversion Pipeline Navigation Section */}
        <div style={{ padding: isCollapsed ? '14px 8px' : '16px 14px' }}>
          {!isCollapsed && (
            <div style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              letterSpacing: '0.06em',
              marginBottom: '10px',
              paddingLeft: '6px'
            }}>
              Quy Trình Chuyển Đổi
            </div>
          )}

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {primarySteps.map(step => {
              const Icon = step.icon;
              const isActive = activeTab === step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => setActiveTab(step.id)}
                  className="btn"
                  style={{
                    width: '100%',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    padding: isCollapsed ? '10px 0' : '9px 12px',
                    borderRadius: '10px',
                    backgroundColor: isActive ? 'var(--blue-soft)' : 'transparent',
                    color: isActive ? 'var(--blue-text)' : '#334155',
                    border: isActive ? '1px solid var(--border-blue)' : '1px solid transparent',
                    boxShadow: isActive ? '0 1px 4px rgba(37, 99, 235, 0.08)' : 'none',
                    fontWeight: isActive ? 700 : 500,
                    position: 'relative'
                  }}
                  title={isCollapsed ? step.label : ''}
                >
                  <Icon size={18} color={isActive ? '#2563eb' : '#64748b'} />
                  
                  {!isCollapsed && (
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginLeft: '6px', gap: '4px' }}>
                      <span style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {step.label}
                      </span>
                      {step.count && (
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '6px',
                          backgroundColor: isActive ? '#dbeafe' : '#f1f5f9',
                          color: isActive ? '#1e40af' : '#64748b',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          {step.count}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Active Indicator Bar */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '20%',
                      bottom: '20%',
                      width: '3px',
                      backgroundColor: '#2563eb',
                      borderRadius: '0 4px 4px 0'
                    }} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Thin Divider */}
          <div style={{ height: '1px', background: '#f1f5f9', margin: '10px 4px' }} />

          {/* Mapping Rules Tab Button (Integrated cleanly) */}
          <button
            onClick={() => setActiveTab('mapping')}
            className="btn"
            style={{
              width: '100%',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              padding: isCollapsed ? '10px 0' : '9px 12px',
              borderRadius: '10px',
              backgroundColor: activeTab === 'mapping' ? 'var(--blue-soft)' : 'transparent',
              color: activeTab === 'mapping' ? 'var(--blue-text)' : '#334155',
              border: activeTab === 'mapping' ? '1px solid var(--border-blue)' : '1px solid transparent',
              boxShadow: activeTab === 'mapping' ? '0 1px 4px rgba(37, 99, 235, 0.08)' : 'none',
              fontWeight: activeTab === 'mapping' ? 700 : 500,
              position: 'relative'
            }}
            title={isCollapsed ? 'Quy Tắc Mapping' : ''}
          >
            <Layers size={18} color={activeTab === 'mapping' ? '#2563eb' : '#64748b'} />
            {!isCollapsed && (
              <span style={{ fontSize: '0.82rem', marginLeft: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Quy Tắc Mapping
              </span>
            )}
            {activeTab === 'mapping' && (
              <div style={{
                position: 'absolute',
                left: 0,
                top: '20%',
                bottom: '20%',
                width: '3px',
                backgroundColor: '#2563eb',
                borderRadius: '0 4px 4px 0'
              }} />
            )}
          </button>

          {/* Auxiliary Tab: Dịch Option PIM Ra Chữ (Independent Tool) */}
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
            {!isCollapsed && (
              <div style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#94a3b8',
                letterSpacing: '0.05em',
                marginBottom: '6px',
                paddingLeft: '6px',
                whiteSpace: 'nowrap'
              }}>
                Tiện Ích Phụ
              </div>
            )}

            <button
              onClick={() => setActiveTab('masterData')}
              className="btn"
              style={{
                width: '100%',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '10px 0' : '9px 12px',
                borderRadius: '10px',
                backgroundColor: activeTab === 'masterData' ? 'var(--blue-soft)' : 'transparent',
                color: activeTab === 'masterData' ? 'var(--blue-text)' : '#334155',
                border: activeTab === 'masterData' ? '1px solid var(--border-blue)' : '1px solid transparent',
                boxShadow: activeTab === 'masterData' ? '0 1px 4px rgba(37, 99, 235, 0.08)' : 'none',
                fontWeight: activeTab === 'masterData' ? 700 : 500,
                position: 'relative',
                marginBottom: '4px'
              }}
              title={isCollapsed ? 'Dữ Liệu Nền Tảng' : ''}
            >
              <Database size={18} color={activeTab === 'masterData' ? '#2563eb' : '#64748b'} />
              {!isCollapsed && (
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginLeft: '6px', gap: '4px' }}>
                  <span style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Dữ Liệu Nền Tảng
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: '6px',
                    backgroundColor: readyMastersCount === 6 ? '#dcfce7' : (activeTab === 'masterData' ? '#dbeafe' : '#f1f5f9'),
                    color: readyMastersCount === 6 ? '#15803d' : (activeTab === 'masterData' ? '#1e40af' : '#64748b'),
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    {readyMastersCount}/6
                  </span>
                </div>
              )}
              {activeTab === 'masterData' && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '20%',
                  bottom: '20%',
                  width: '3px',
                  backgroundColor: '#2563eb',
                  borderRadius: '0 4px 4px 0'
                }} />
              )}
            </button>

            <button
              onClick={() => setActiveTab('pimDecoder')}
              className="btn"
              style={{
                width: '100%',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '10px 0' : '9px 12px',
                borderRadius: '10px',
                backgroundColor: activeTab === 'pimDecoder' ? '#ecfdf5' : 'transparent',
                color: activeTab === 'pimDecoder' ? '#047857' : '#334155',
                border: activeTab === 'pimDecoder' ? '1px solid #a7f3d0' : '1px solid transparent',
                boxShadow: activeTab === 'pimDecoder' ? '0 1px 4px rgba(16, 185, 129, 0.1)' : 'none',
                fontWeight: activeTab === 'pimDecoder' ? 700 : 500,
                position: 'relative'
              }}
              title={isCollapsed ? 'Dịch Option PIM Ra Chữ' : ''}
            >
              <FileSpreadsheet size={18} color={activeTab === 'pimDecoder' ? '#10b981' : '#64748b'} />
              {!isCollapsed && (
                <span style={{ fontSize: '0.82rem', marginLeft: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Dịch Option PIM Ra Chữ
                </span>
              )}
              {activeTab === 'pimDecoder' && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '20%',
                  bottom: '20%',
                  width: '3px',
                  backgroundColor: '#10b981',
                  borderRadius: '0 4px 4px 0'
                }} />
              )}
            </button>
          </div>

          {/* Quick Actions (Subtle & Airy) */}
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
            {!isCollapsed && (
              <div style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#94a3b8',
                letterSpacing: '0.05em',
                marginBottom: '8px',
                paddingLeft: '4px'
              }}>
                Tiện ích nhanh
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                onClick={onLoadSample}
                disabled={isSampleLoading}
                style={{
                  width: '100%',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  padding: isCollapsed ? '8px 0' : '7px 10px',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid #bfdbfe',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  cursor: isSampleLoading ? 'wait' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Tự động nạp dữ liệu mẫu Adapter Sạc để kiểm thử"
              >
                <Sparkles size={14} color="#2563eb" />
                {!isCollapsed && <span>{isSampleLoading ? 'Đang nạp...' : 'Nạp mẫu Adapter'}</span>}
              </button>

              <button
                type="button"
                onClick={exportSettingsToJSON}
                style={{
                  width: '100%',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  padding: isCollapsed ? '8px 0' : '7px 10px',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Sao lưu toàn bộ quy tắc mapping ra file JSON"
              >
                <FileJson size={14} color="#64748b" />
                {!isCollapsed && <span>Sao lưu Rules</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Footer / User Info */}
      <div style={{
        padding: isCollapsed ? '12px 6px' : '14px 16px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: '#f8fafc'
      }}>
        {!isCollapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: '#e0e7ff',
              color: '#4338ca',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              AD
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Admin
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', opacity: 0.8 }}>
                <span>DMX by MWG</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: '#e0e7ff',
              color: '#4338ca',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              AD
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
