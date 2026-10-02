import React from 'react';
import { 
  FileSpreadsheet, 
  Layers, 
  CheckCircle2, 
  Download, 
  Sparkles, 
  FileJson, 
  UploadCloud, 
  HelpCircle,
  Database
} from 'lucide-react';
import { exportSettingsToJSON } from '../services/storageService';

export default function Navbar({ activeTab, setActiveTab, onLoadSample, isSampleLoading, hasData }) {
  const tabs = [
    { id: 'upload', label: '1. Nguồn Dữ Liệu', icon: UploadCloud, badge: hasData ? 'Sẵn sàng' : 'Cần tải' },
    { id: 'mapping', label: '2. Quản Lý Mapping', icon: Layers, badge: 'Đã lưu' },
    { id: 'preview', label: '3. Xem Trước & Truy Xuất', icon: CheckCircle2, badge: hasData ? 'Có dữ liệu' : null },
    { id: 'export', label: '4. Xuất File Import CMS', icon: Download, badge: 'Đích' }
  ];

  return (
    <header className="glass-panel" style={{ margin: '16px 24px', padding: '12px 24px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '12px', 
            background: 'var(--accent-gradient)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
          }}>
            <FileSpreadsheet size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.18rem', fontWeight: 700, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #ffffff, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                PIM ➔ CMS Transformer
              </h1>
              <span className="badge badge-info">v2.0 Pro</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Chuyển đổi thuộc tính & giá trị PIM sang chuẩn Import CMS đa ngành hàng
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.6)', padding: '5px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="btn"
                style={{
                  background: isActive ? 'var(--accent-primary)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  padding: '7px 14px',
                  borderRadius: '9px',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 600 : 500,
                  boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.35)' : 'none'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span style={{ 
                    fontSize: '0.68rem', 
                    padding: '1px 6px', 
                    borderRadius: '6px', 
                    background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                    color: isActive ? '#ffffff' : 'var(--text-dim)'
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={onLoadSample}
            disabled={isSampleLoading}
            className="btn btn-secondary"
            title="Tự động nạp bộ 5 file mẫu Adapter Sạc sẵn có để kiểm thử ngay tức thì"
            style={{ 
              borderColor: 'rgba(99, 102, 241, 0.4)', 
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#c7d2fe',
              fontSize: '0.8rem'
            }}
          >
            <Sparkles size={15} color="#818cf8" />
            <span>{isSampleLoading ? 'Đang nạp mẫu...' : '⚡ Nạp mẫu Adapter Sạc'}</span>
          </button>

          <button 
            onClick={exportSettingsToJSON}
            className="btn btn-secondary"
            title="Xuất các quy tắc mapping đã duyệt thành file JSON dự phòng"
            style={{ fontSize: '0.8rem', padding: '8px 12px' }}
          >
            <FileJson size={15} />
            <span>Sao lưu Rules</span>
          </button>
        </div>

      </div>
    </header>
  );
}
