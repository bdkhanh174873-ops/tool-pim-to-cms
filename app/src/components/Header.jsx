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

  const tabInfoMap = {
    upload: { title: 'Nạp File PIM', icon: HardDrive, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
    masterData: { title: 'Dữ Liệu', icon: Database, color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
    preview: { title: 'Đối Soát & Xem Trước', icon: CheckCircle2, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
    export: { title: 'Xuất File CMS', icon: Sparkles, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    mapping: { title: 'Quy Tắc Đối Chiếu PIM ➔ CMS', icon: Layers, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
    pimDecoder: { title: 'Dịch Option PIM', icon: FileSpreadsheet, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' }
  };

  const currentTabInfo = tabInfoMap[activeTab] || tabInfoMap.preview;
  const TabIcon = currentTabInfo.icon;

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
      {/* Left: Clean Active Screen Title (Spacious & Minimal) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: currentTabInfo.bg,
          border: `1px solid ${currentTabInfo.border}`,
          color: currentTabInfo.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <TabIcon size={16} />
        </div>
        <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a' }}>
          {currentTabInfo.title}
        </span>
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
