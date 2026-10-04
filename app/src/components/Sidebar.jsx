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
  Check
} from 'lucide-react';
import { exportSettingsToJSON } from '../services/storageService';

export default function Sidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  pimFiles = [],
  pimProductData,
  transformationResult,
  masterFiles = {}
}) {
  // Count ready master datasets
  const masterKeys = ['cmsCatalog', 'pimOption', 'mappingRef', 'cmsTemplate', 'catMappingRef', 'cmsValueTemplate'];
  const readyMastersCount = masterKeys.filter(k => masterFiles[k]?.parsedData).length;

  const isStep1Done = Boolean(pimFiles && pimFiles.length > 0);
  const isStep2Done = Boolean(transformationResult && transformationResult.validImportRows?.length > 0);
  const isStep3Done = false;

  const primarySteps = [
    { 
      id: 'upload', 
      stepNum: 1, 
      title: 'Nạp File PIM', 
      icon: UploadCloud, 
      count: pimFiles.length > 0 ? `${pimFiles.length} file` : null,
      isCompleted: isStep1Done,
      isLocked: false
    },
    { 
      id: 'preview', 
      stepNum: 2, 
      title: 'Đối Soát & Xem Trước', 
      icon: CheckCircle2, 
      count: transformationResult ? `${(transformationResult.validImportRows?.length || 0).toLocaleString()} SP` : (pimProductData ? 'Chờ chạy' : null),
      isCompleted: isStep2Done,
      isLocked: !isStep1Done
    },
    { 
      id: 'export', 
      stepNum: 3, 
      title: 'Xuất File CMS', 
      icon: Download, 
      count: transformationResult ? 'Sẵn sàng' : null,
      isCompleted: isStep3Done,
      isLocked: !isStep1Done
    }
  ];

  return (
    <aside 
      style={{
        width: isCollapsed ? '72px' : '272px',
        minWidth: isCollapsed ? '72px' : '272px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50,
        boxShadow: '1px 0 6px rgba(15, 23, 42, 0.03)'
      }}
    >
      {/* Top Container: Header & Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Top Header / Branding */}
        <div style={{
          padding: isCollapsed ? '12px 8px' : '16px 18px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          minHeight: '68px'
        }}>
          {!isCollapsed ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img 
                  src="/dmx-logo.png" 
                  alt="DMX Logo" 
                  style={{ 
                    height: '24px', 
                    maxWidth: '75px', 
                    objectFit: 'contain' 
                  }} 
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                      PIM ➔ CMS
                    </span>
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe'
                    }}>
                      v2.0
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
                    Chuyển Đổi Đa Ngành
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                style={{ 
                  width: '28px',
                  height: '28px',
                  padding: 0,
                  borderRadius: '7px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#1e293b';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.color = '#64748b';
                }}
                title="Thu gọn thanh bên"
              >
                <ChevronLeft size={15} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '6px 4px',
                borderRadius: '8px',
                border: '1px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#eff6ff';
                e.currentTarget.style.border = '1px solid #bfdbfe';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.border = '1px solid transparent';
              }}
              title="Nhấp để mở rộng thanh bên"
            >
              <img 
                src="/dmx-icon.png" 
                alt="DMX Icon" 
                style={{ 
                  width: '28px', 
                  height: '28px', 
                  objectFit: 'contain' 
                }} 
              />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                fontSize: '0.62rem',
                fontWeight: 700,
                color: '#2563eb',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '4px',
                padding: '1px 6px',
                lineHeight: 1.2
              }}>
                <ChevronRight size={11} strokeWidth={2.8} /> Mở
              </div>
            </button>
          )}
        </div>

        {/* Scrollable Navigation Body */}
        <div style={{ padding: isCollapsed ? '14px 8px' : '16px 14px' }}>
          
          {/* Section 1: Quy Trình Chuyển Đổi (Connected Stepper Track) */}
          <div>
            {!isCollapsed && (
              <div style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#94a3b8',
                letterSpacing: '0.06em',
                marginBottom: '10px',
                paddingLeft: '6px'
              }}>
                Quy Trình Chuyển Đổi
              </div>
            )}

            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {primarySteps.map((step, idx) => {
                const isActive = activeTab === step.id;
                const isLocked = step.isLocked;
                const isCompleted = step.isCompleted;

                return (
                  <div 
                    key={step.id} 
                    style={{ 
                      position: 'relative', 
                      display: 'flex', 
                      alignItems: 'stretch',
                      marginBottom: idx < primarySteps.length - 1 ? '5px' : '0' 
                    }}
                  >
                    {/* Continuous Stepper Connector Track */}
                    {idx < primarySteps.length - 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: isCollapsed ? '50%' : '19px',
                          top: '26px',
                          bottom: '-7px',
                          width: '2px',
                          transform: isCollapsed ? 'translateX(-50%)' : 'none',
                          background: (idx === 0 && isStep1Done) || (idx === 1 && isStep2Done) ? '#3b82f6' : '#e2e8f0',
                          zIndex: 1,
                          transition: 'background 0.25s ease'
                        }}
                      />
                    )}

                    {/* Step Button */}
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => !isLocked && setActiveTab(step.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: isCollapsed ? '0' : '10px',
                        padding: isCollapsed ? '8px 0' : '8px 10px',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        borderRadius: '9px',
                        border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                        background: isActive ? '#eff6ff' : 'transparent',
                        boxShadow: isActive ? '0 1px 3px rgba(37, 99, 235, 0.08)' : 'none',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        opacity: isLocked ? 0.45 : 1,
                        transition: 'all 0.15s ease',
                        textAlign: 'left',
                        zIndex: 2
                      }}
                      title={isLocked ? `${step.title} (Cần nạp file PIM trước)` : (isCollapsed ? `${step.stepNum}. ${step.title}` : '')}
                    >
                      {/* Node on the track */}
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          flexShrink: 0,
                          background: isActive 
                            ? '#2563eb' 
                            : (isCompleted 
                                ? '#10b981' 
                                : (isLocked ? '#f1f5f9' : '#ffffff')),
                          color: isActive || isCompleted ? '#ffffff' : (isLocked ? '#94a3b8' : '#475569'),
                          border: isActive 
                            ? '2px solid #2563eb' 
                            : (isCompleted 
                                ? '2px solid #10b981' 
                                : '1.5px solid #cbd5e1'),
                          boxShadow: isActive ? '0 0 0 3px rgba(37,99,235,0.18)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isCompleted && !isActive ? (
                          <Check size={11} strokeWidth={3} />
                        ) : (
                          step.stepNum
                        )}
                      </div>

                      {/* Title & Badge */}
                      {!isCollapsed && (
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                          <span style={{
                            fontSize: '0.82rem',
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? '#1d4ed8' : (isLocked ? '#94a3b8' : '#1e293b'),
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {step.stepNum}. {step.title}
                          </span>

                          {step.count && !isLocked && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: '5px',
                              backgroundColor: isActive ? '#dbeafe' : (step.count === 'Sẵn sàng' ? '#dcfce7' : '#f1f5f9'),
                              color: isActive ? '#1e40af' : (step.count === 'Sẵn sàng' ? '#15803d' : '#64748b'),
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}>
                              {step.count}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Cấu Hình & Dữ Liệu */}
          <div style={{ marginTop: '22px' }}>
            {!isCollapsed && (
              <div style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#94a3b8',
                letterSpacing: '0.06em',
                marginBottom: '8px',
                paddingLeft: '6px'
              }}>
                Cấu Hình & Dữ Liệu
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {/* Quy Tắc Mapping */}
              <button
                onClick={() => setActiveTab('mapping')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isCollapsed ? '0' : '10px',
                  padding: isCollapsed ? '9px 0' : '8px 10px',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  borderRadius: '9px',
                  border: activeTab === 'mapping' ? '1px solid #bfdbfe' : '1px solid transparent',
                  background: activeTab === 'mapping' ? '#eff6ff' : 'transparent',
                  boxShadow: activeTab === 'mapping' ? '0 1px 3px rgba(37, 99, 235, 0.08)' : 'none',
                  color: activeTab === 'mapping' ? '#1d4ed8' : '#334155',
                  fontWeight: activeTab === 'mapping' ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left'
                }}
                title={isCollapsed ? 'Quy Tắc Mapping' : ''}
              >
                <Layers size={17} color={activeTab === 'mapping' ? '#2563eb' : '#64748b'} />
                {!isCollapsed && (
                  <span style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Quy Tắc Mapping
                  </span>
                )}
              </button>

              {/* Dữ Liệu Nền Tảng */}
              <button
                onClick={() => setActiveTab('masterData')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isCollapsed ? '0' : '10px',
                  padding: isCollapsed ? '9px 0' : '8px 10px',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  borderRadius: '9px',
                  border: activeTab === 'masterData' ? '1px solid #bfdbfe' : '1px solid transparent',
                  background: activeTab === 'masterData' ? '#eff6ff' : 'transparent',
                  boxShadow: activeTab === 'masterData' ? '0 1px 3px rgba(37, 99, 235, 0.08)' : 'none',
                  color: activeTab === 'masterData' ? '#1d4ed8' : '#334155',
                  fontWeight: activeTab === 'masterData' ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left'
                }}
                title={isCollapsed ? 'Dữ Liệu' : ''}
              >
                <Database size={17} color={activeTab === 'masterData' ? '#2563eb' : '#64748b'} />
                {!isCollapsed && (
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <span style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Dữ Liệu
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: '5px',
                      backgroundColor: readyMastersCount === 6 ? '#dcfce7' : (activeTab === 'masterData' ? '#dbeafe' : '#f1f5f9'),
                      color: readyMastersCount === 6 ? '#15803d' : (activeTab === 'masterData' ? '#1e40af' : '#64748b'),
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      {readyMastersCount}/6
                    </span>
                  </div>
                )}
              </button>

              {/* Dịch Option PIM */}
              <button
                onClick={() => setActiveTab('pimDecoder')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isCollapsed ? '0' : '10px',
                  padding: isCollapsed ? '9px 0' : '8px 10px',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  borderRadius: '9px',
                  border: activeTab === 'pimDecoder' ? '1px solid #bfdbfe' : '1px solid transparent',
                  background: activeTab === 'pimDecoder' ? '#eff6ff' : 'transparent',
                  boxShadow: activeTab === 'pimDecoder' ? '0 1px 3px rgba(37, 99, 235, 0.08)' : 'none',
                  color: activeTab === 'pimDecoder' ? '#1d4ed8' : '#334155',
                  fontWeight: activeTab === 'pimDecoder' ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left'
                }}
                title={isCollapsed ? 'Dịch Option PIM' : ''}
              >
                <FileSpreadsheet size={17} color={activeTab === 'pimDecoder' ? '#2563eb' : '#64748b'} />
                {!isCollapsed && (
                  <span style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Dịch Option PIM
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Section 3: Tiện Ích */}
          <div style={{ marginTop: '22px' }}>
            {!isCollapsed && (
              <div style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#94a3b8',
                letterSpacing: '0.06em',
                marginBottom: '8px',
                paddingLeft: '6px'
              }}>
                Tiện Ích Nhanh
              </div>
            )}

            <button
              type="button"
              onClick={exportSettingsToJSON}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: isCollapsed ? '0' : '10px',
                padding: isCollapsed ? '9px 0' : '8px 10px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                borderRadius: '9px',
                border: '1px solid transparent',
                background: 'transparent',
                color: '#475569',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
              title="Sao lưu toàn bộ quy tắc mapping ra file JSON"
            >
              <FileJson size={17} color="#64748b" />
              {!isCollapsed && (
                <span style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Sao lưu Rules
                </span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Sidebar Footer / User Info */}
      <div style={{
        padding: isCollapsed ? '14px 6px' : '14px 18px',
        borderTop: '1px solid #f1f5f9',
        backgroundColor: '#ffffff'
      }}>
        {!isCollapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              fontWeight: 700,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              AD
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Admin
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '1px' }}>
                DMX by MWG
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              fontWeight: 700,
              fontSize: '0.78rem',
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
