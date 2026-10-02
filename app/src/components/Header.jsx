import React from 'react';
import { 
  Sparkles, 
  FileJson, 
  Database, 
  CheckCircle2, 
  Layers, 
  FileSpreadsheet, 
  ArrowRight,
  HardDrive
} from 'lucide-react';
import { exportSettingsToJSON } from '../services/storageService';

export default function Header({
  activeTab,
  setActiveTab,
  onLoadSample,
  isSampleLoading,
  pimFiles = [],
  pimProductData,
  transformationResult,
  masterFiles = {},
  onOpenMasterData
}) {
  const masterKeys = ['cmsCatalog', 'pimOption', 'mappingRef', 'cmsTemplate', 'catMappingRef', 'cmsValueTemplate'];
  const readyMastersCount = masterKeys.filter(k => masterFiles[k]?.parsedData).length;

  const pipelineSteps = [
    { id: 'upload', step: 1, label: 'Nạp File PIM', isDone: pimFiles.length > 0 },
    { id: 'masterData', step: 2, label: 'Dữ Liệu Nền Tảng', isDone: readyMastersCount === 6 },
    { id: 'preview', step: 3, label: 'Đối Soát & Xem Trước', isDone: Boolean(transformationResult) },
    { id: 'export', step: 4, label: 'Xuất File CMS', isDone: Boolean(transformationResult?.validImportRows?.length) }
  ];

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '14px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
    }}>
      {/* Left: Interactive Workflow Progress Stepper (Replaces Duplicate Title) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {activeTab === 'mapping' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Layers size={16} />
            </div>
            <div>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                Quy Tắc Đối Chiếu PIM ➔ CMS
              </span>
            </div>
          </div>
        ) : activeTab === 'pimDecoder' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileSpreadsheet size={16} />
            </div>
            <div>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                Dịch Option PIM Ra Chữ
              </span>
            </div>
          </div>
        ) : (
          <nav aria-label="Workflow Steps" style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'nowrap', overflowX: 'auto', whiteSpace: 'nowrap' }}>
            {pipelineSteps.map((st, idx, arr) => {
              const isActive = activeTab === st.id;

              return (
                <React.Fragment key={st.id}>
                  <button
                    type="button"
                    onClick={() => setActiveTab && setActiveTab(st.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      border: isActive ? '1.5px solid #2563eb' : '1px solid transparent',
                      background: isActive ? '#eff6ff' : st.isDone ? '#f0fdf4' : '#f8fafc',
                      color: isActive ? '#1d4ed8' : st.isDone ? '#166534' : '#64748b',
                      transition: 'all 0.15s ease',
                      outline: 'none',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                    title={`Chuyển tới Bước ${st.step}: ${st.label}`}
                  >
                    <span style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      background: isActive ? '#2563eb' : st.isDone ? '#10b981' : '#cbd5e1',
                      color: isActive || st.isDone ? '#ffffff' : '#475569',
                      flexShrink: 0
                    }}>
                      {st.isDone ? '✓' : st.step}
                    </span>
                    <span style={{ whiteSpace: 'nowrap' }}>{st.label}</span>
                  </button>

                  {idx < arr.length - 1 && (
                    <span style={{ color: '#cbd5e1', fontSize: '0.72rem', margin: '0 2px', userSelect: 'none', flexShrink: 0 }}>
                      ➔
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}
      </div>

      {/* Right Side Status & Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        
        {/* Master Data Status Pill */}
        <button
          onClick={onOpenMasterData}
          className="btn btn-secondary"
          style={{
            padding: '5px 12px',
            fontSize: '0.78rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px'
          }}
          title="Bấm để xem nhanh trạng thái 6 nguồn dữ liệu nền tảng"
        >
          <Database size={14} color="#2563eb" />
          <span style={{ color: '#334155' }}>Master Data:</span>
          <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
            {readyMastersCount}/6 sẵn sàng
          </span>
        </button>

        {/* Quick Sample Button */}
        <button
          onClick={onLoadSample}
          disabled={isSampleLoading}
          className="btn btn-primary"
          style={{
            padding: '5px 14px',
            fontSize: '0.78rem',
            borderRadius: '8px'
          }}
          title="Nạp mẫu Adapter Sạc trọn bộ để kiểm thử quy trình"
        >
          <Sparkles size={14} />
          <span>{isSampleLoading ? 'Đang nạp...' : '⚡ Nạp mẫu'}</span>
        </button>
      </div>
    </header>
  );
}
