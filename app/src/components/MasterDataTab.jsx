import React, { useState, useRef } from 'react';
import { 
  Database, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Download, 
  Trash2, 
  FolderPlus, 
  Sparkles, 
  RefreshCw,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import DataPreviewModal from './DataPreviewModal';
import { useNotification } from '../context/NotificationContext';

export default function MasterDataTab({
  masterFiles = {},
  onUpdateMasterFile,
  onResetMasterFiles,
  onSaveMasterDataset,
  onLoadSampleMasterData,
  isLoading = false,
  onProceedToMapping,
  onProceedToUpload
}) {
  const notify = useNotification();

  // Preview Modal State
  const [previewModalConfig, setPreviewModalConfig] = useState({
    isOpen: false,
    title: '',
    fileName: '',
    fileType: '',
    data: null,
    onDownloadFile: null
  });

  // Hidden File Input Refs
  const cmsCatalogInputRef = useRef(null);
  const pimOptionInputRef = useRef(null);
  const mappingRefInputRef = useRef(null);
  const catMappingRefInputRef = useRef(null);
  const cmsTemplateInputRef = useRef(null);
  const cmsValueTemplateInputRef = useRef(null);

  // Status checks
  const isCmsCatalogReady = Boolean(masterFiles?.cmsCatalog?.parsedData);
  const isPimOptionReady = Boolean(masterFiles?.pimOption?.parsedData);
  const isMappingRefReady = Boolean(masterFiles?.mappingRef?.parsedData);
  const isCatMappingRefReady = Boolean(masterFiles?.catMappingRef?.parsedData);
  const isCmsTemplateReady = Boolean(masterFiles?.cmsTemplate?.parsedData);
  const isCmsValueTemplateReady = Boolean(masterFiles?.cmsValueTemplate?.parsedData);

  const readyMastersCount = [
    isCmsCatalogReady, 
    isPimOptionReady, 
    isMappingRefReady, 
    isCatMappingRefReady, 
    isCmsTemplateReady, 
    isCmsValueTemplateReady
  ].filter(Boolean).length;

  // Handle master file upload
  const handleFileUpload = (type, e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdateMasterFile(type, file);
      e.target.value = '';
    }
  };

  // Helper download raw buffer
  const downloadRawFile = (fileName, buffer) => {
    if (!buffer) return;
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'dataset.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Open Data Preview Modal
  const openPreview = (fileType) => {
    const item = masterFiles[fileType];
    if (!item?.parsedData) {
      notify.warning('Chưa có dữ liệu cho nguồn này để xem.');
      return;
    }

    const titles = {
      cmsCatalog: 'Danh Mục Thuộc Tính & Giá Trị CMS',
      pimOption: 'Từ Điển Tra Cứu Option PIM',
      mappingRef: 'Bảng Mapping Thuộc Tính PIM ➔ CMS',
      cmsTemplate: 'File Mẫu Import Thuộc Tính CMS',
      catMappingRef: 'Bảng Mapping Ngành Hàng PIM ➔ CMS',
      cmsValueTemplate: 'File Mẫu Import Tạo Mới Giá Trị CMS'
    };

    setPreviewModalConfig({
      isOpen: true,
      title: titles[fileType] || 'Xem Dữ Liệu Nền Tảng',
      fileName: item.fileName || `${fileType}.xlsx`,
      fileType: fileType,
      data: item.parsedData,
      onDownloadFile: item.rawBuffer ? () => downloadRawFile(item.fileName, item.rawBuffer) : null
    });
  };

  const masterCards = [
    {
      id: 'cmsCatalog',
      title: '1. Danh Mục CMS',
      sub: 'Mã ngành, thuộc tính & danh sách giá trị chuẩn',
      isReady: isCmsCatalogReady,
      countText: isCmsCatalogReady 
        ? `${(masterFiles.cmsCatalog?.summary?.totalRows || masterFiles.cmsCatalog?.parsedData?.rawTableRows?.length || 53006).toLocaleString()} dòng` 
        : 'Chưa nạp',
      fileName: masterFiles.cmsCatalog?.fileName,
      inputRef: cmsCatalogInputRef
    },
    {
      id: 'pimOption',
      title: '2. Từ Điển Option PIM',
      sub: 'Giải mã OptionCode sang OptionValue thực tế',
      isReady: isPimOptionReady,
      countText: isPimOptionReady 
        ? `${(masterFiles.pimOption?.summary?.totalOptions || masterFiles.pimOption?.parsedData?.rawTableRows?.length || 2321).toLocaleString()} options` 
        : 'Chưa nạp',
      fileName: masterFiles.pimOption?.fileName,
      inputRef: pimOptionInputRef
    },
    {
      id: 'mappingRef',
      title: '3. Mapping Thuộc Tính',
      sub: 'Quy tắc đối chiếu PIM Attribute ➔ CMS Property',
      isReady: isMappingRefReady,
      countText: isMappingRefReady 
        ? `${(masterFiles.mappingRef?.summary?.count || masterFiles.mappingRef?.parsedData?.length || 18).toLocaleString()} quy tắc` 
        : 'Chưa nạp',
      fileName: masterFiles.mappingRef?.fileName,
      inputRef: mappingRefInputRef
    },
    {
      id: 'cmsTemplate',
      title: '4. File Mẫu Import CMS',
      sub: 'Cấu trúc 7 cột chuẩn nạp dữ liệu CMS',
      isReady: isCmsTemplateReady,
      countText: isCmsTemplateReady 
        ? `${(masterFiles.cmsTemplate?.summary?.headersCount || masterFiles.cmsTemplate?.parsedData?.headers?.length || 7)} cột chuẩn` 
        : 'Chưa nạp',
      fileName: masterFiles.cmsTemplate?.fileName,
      inputRef: cmsTemplateInputRef
    },
    {
      id: 'catMappingRef',
      title: '5. Mapping Ngành Hàng',
      sub: 'Đối chiếu mã ngành PIM sang mã ngành CMS',
      isReady: isCatMappingRefReady,
      countText: isCatMappingRefReady 
        ? `${(masterFiles.catMappingRef?.summary?.count || masterFiles.catMappingRef?.parsedData?.mappings?.length || 3).toLocaleString()} ngành` 
        : 'Chưa nạp',
      fileName: masterFiles.catMappingRef?.fileName,
      inputRef: catMappingRefInputRef
    },
    {
      id: 'cmsValueTemplate',
      title: '6. Mẫu Import Giá Trị Mới',
      sub: 'Mẫu 7 cột tạo mới giá trị chưa có trên CMS',
      isReady: isCmsValueTemplateReady,
      countText: isCmsValueTemplateReady 
        ? `${(masterFiles.cmsValueTemplate?.summary?.headersCount || masterFiles.cmsValueTemplate?.parsedData?.headers?.length || 7)} cột mẫu` 
        : 'Chưa nạp',
      fileName: masterFiles.cmsValueTemplate?.fileName,
      inputRef: cmsValueTemplateInputRef
    }
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '0 24px 32px 24px' }}>
      
      {/* Top Header Card */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Dữ Liệu Nền Tảng (Master Data)
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-success" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
              <CheckCircle2 size={14} />
              <span>{readyMastersCount}/6 nguồn sẵn sàng</span>
            </span>

            <button
              onClick={onResetMasterFiles}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '7px 12px', color: '#dc2626' }}
              title="Xóa trắng dữ liệu nền đã lưu"
            >
              <Trash2 size={14} />
              <span>Đặt lại</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Cards in a spacious 3x2 Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {masterCards.map((card) => (
          <div 
            key={card.id}
            className="glass-panel glass-panel-hover"
            style={{
              padding: '18px 20px',
              backgroundColor: '#ffffff',
              border: '1px solid',
              borderColor: card.isReady ? '#bfdbfe' : 'var(--border-subtle)',
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
            }}
          >
            {/* Hidden Input */}
            <input
              type="file"
              ref={card.inputRef}
              accept=".xlsx, .xls"
              onChange={(e) => handleFileUpload(card.id, e)}
              style={{ display: 'none' }}
            />

            <div>
              {/* Header of Card */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: card.isReady ? '#eff6ff' : '#f1f5f9',
                    color: card.isReady ? '#2563eb' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      {card.title}
                    </h3>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '1px' }}>
                      {card.sub}
                    </div>
                  </div>
                </div>

                <span style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  backgroundColor: card.isReady ? '#10b981' : '#f59e0b',
                  flexShrink: 0
                }} title={card.isReady ? 'Đã có dữ liệu' : 'Chưa nạp'} />
              </div>

              {/* Status and Filename */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #f1f5f9',
                borderRadius: '8px',
                padding: '8px 12px',
                margin: '12px 0 14px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.76rem'
              }}>
                <span style={{ fontWeight: 600, color: card.isReady ? '#059669' : '#94a3b8' }}>
                  {card.countText}
                </span>
                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }} title={card.fileName}>
                  {card.fileName || '(Chưa có file)'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {card.isReady ? (
                <>
                  <button
                    onClick={() => openPreview(card.id)}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '7px 10px', fontSize: '0.78rem', color: '#2563eb', background: '#eff6ff', borderColor: '#bfdbfe' }}
                  >
                    <Eye size={13} />
                    <span>Xem & Sửa</span>
                  </button>
                  <button
                    onClick={() => card.inputRef.current?.click()}
                    disabled={isLoading}
                    className="btn btn-secondary"
                    style={{ padding: '7px 10px', fontSize: '0.78rem', color: '#64748b' }}
                    title="Nạp đè file mới"
                  >
                    <RefreshCw size={13} />
                    <span>Đổi file</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => card.inputRef.current?.click()}
                  disabled={isLoading}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '7px 12px', fontSize: '0.78rem' }}
                >
                  <UploadCloud size={14} />
                  <span>Chọn file nạp vào</span>
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Bottom Nav Helper */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '16px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
          💡 Khi dữ liệu nền đã sẵn sàng, bạn có thể chuyển sang bước tiếp theo.
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onProceedToUpload}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '7px 14px' }}
          >
            <span>Quay lại Tải File PIM</span>
          </button>
          <button
            onClick={onProceedToMapping}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '7px 16px' }}
          >
            <span>Sang Quy Tắc Mapping</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Data Preview & Edit Modal */}
      {previewModalConfig.isOpen && (
        <DataPreviewModal
          isOpen={previewModalConfig.isOpen}
          onClose={() => setPreviewModalConfig(prev => ({ ...prev, isOpen: false }))}
          title={previewModalConfig.title}
          fileName={previewModalConfig.fileName}
          fileType={previewModalConfig.fileType}
          datasetKey={previewModalConfig.fileType}
          data={previewModalConfig.data}
          onDownloadFile={previewModalConfig.onDownloadFile}
          onSaveDataset={onSaveMasterDataset}
        />
      )}

    </div>
  );
}
