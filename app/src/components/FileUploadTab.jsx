import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  Eye, 
  Trash2, 
  ArrowRight,
  Plus,
  FolderPlus,
  Sparkles,
  Database,
  Layers,
  Info
} from 'lucide-react';
import DataPreviewModal from './DataPreviewModal';
import { useNotification } from '../context/NotificationContext';

export default function FileUploadTab({
  masterFiles = {},
  pimFiles = [],
  pimProductData,
  onPimFilesLoaded,
  onRemovePimFile,
  onClearAllPimFiles,
  onAssignCategoryToFile,
  onLoadSamplePimProduct,
  cmsCategories = [],
  isLoading = false,
  onOpenMasterData,
  onProceedToMapping,
  onProceedToPreview,
  onSaveMasterDataset
}) {
  const notify = useNotification();
  const pimProductInputRef = useRef(null);

  // Modal State for Previewing PIM files
  const [previewModalConfig, setPreviewModalConfig] = useState({
    isOpen: false,
    title: '',
    fileName: '',
    fileType: '',
    data: null,
    onDownloadFile: null
  });

  // Check master data ready status
  const masterKeys = ['cmsCatalog', 'pimOption', 'mappingRef', 'cmsTemplate', 'catMappingRef', 'cmsValueTemplate'];
  const readyMastersCount = masterKeys.filter(k => masterFiles[k]?.parsedData).length;
  const isCmsCatalogReady = Boolean(masterFiles.cmsCatalog?.parsedData);
  const isPimOptionReady = Boolean(masterFiles.pimOption?.parsedData);
  const canProceed = isCmsCatalogReady && isPimOptionReady && pimProductData && pimFiles.length > 0;

  // Handle PIM product uploads (multiple files supported)
  const handleProductUpload = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onPimFilesLoaded(files, true);
      e.target.value = '';
    }
  };

  const handleDropPim = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onPimFilesLoaded(e.dataTransfer.files, true);
    }
  };

  // Open Preview Modal for PIM products
  const openPreview = (fileObj = null) => {
    let targetData = fileObj ? fileObj : pimProductData;
    if (!targetData) return;

    if (fileObj && !fileObj.labelsMap && fileObj.headers && fileObj.labels) {
      const labelsMap = {};
      fileObj.headers.forEach((h, idx) => {
        if (fileObj.labels[idx]) labelsMap[h] = fileObj.labels[idx];
      });
      targetData = { ...fileObj, labelsMap };
    }

    setPreviewModalConfig({
      isOpen: true,
      title: `Xem Trước: ${fileObj ? fileObj.fileName : 'Toàn Bộ Sản Phẩm PIM Đã Nạp'}`,
      fileName: targetData.fileName || 'export_product.xlsx',
      fileType: 'pimProduct',
      data: targetData,
      onDownloadFile: null
    });
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 28px 36px 28px' }}>

      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            File Nguồn PIM Cần Chuyển Đổi
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {pimFiles.length > 0 && (
            <button
              onClick={() => pimProductInputRef.current?.click()}
              disabled={isLoading}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '7px 15px' }}
            >
              <Plus size={14} />
              <span>Thêm file PIM</span>
            </button>
          )}
        </div>
      </div>

      {/* Hidden Multi-file input */}
      <input
        type="file"
        ref={pimProductInputRef}
        accept=".xlsx, .xls"
        multiple
        onChange={handleProductUpload}
        style={{ display: 'none' }}
      />

      {pimFiles.length === 0 ? (
        /* Empty State: Airy, Tall Square Drag & Drop Zone */
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropPim}
          className="glass-panel" 
          style={{ 
            width: '100%',
            minHeight: '460px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 32px', 
            textAlign: 'center', 
            border: '2px dashed #93c5fd', 
            background: 'linear-gradient(180deg, #ffffff 0%, #f0f7ff 100%)', 
            boxShadow: '0 4px 20px rgba(37, 99, 235, 0.05)', 
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            position: 'relative'
          }}
        >
          <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
            <div style={{ 
              width: '76px', 
              height: '76px', 
              borderRadius: '20px', 
              background: '#eff6ff', 
              color: '#2563eb', 
              border: '1px solid #bfdbfe', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 20px auto',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.15)'
            }}>
              <UploadCloud size={38} />
            </div>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Kéo thả file PIM sản phẩm vào đây
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 24px 0' }}>
              Hỗ trợ định dạng bảng tính Excel (.xlsx, .xls)
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={() => pimProductInputRef.current?.click()}
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '0.9rem', borderRadius: '10px' }}
              >
                <FolderPlus size={18} />
                <span>Chọn file PIM từ máy tính (.xlsx)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Multi-File Loaded State */
        <div>
          {/* Action CTA Bar */}
          <div 
            className="glass-panel"
            style={{
              padding: '16px 20px',
              marginBottom: '18px',
              background: '#ffffff',
              border: '1px solid var(--border-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #bfdbfe'
              }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a' }}>
                  Đã nạp {pimFiles.length} file PIM • Tổng cộng {pimProductData ? pimProductData.totalRows.toLocaleString() : 0} sản phẩm
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                  Dữ liệu đã sẵn sàng để đối soát sang định dạng chuẩn của hệ thống CMS.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={onProceedToMapping}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '8px 14px' }}
              >
                <Layers size={14} />
                <span>Xem Quy Tắc Mapping</span>
              </button>

              <button
                onClick={onProceedToPreview}
                className="btn btn-primary"
                style={{ fontSize: '0.84rem', padding: '9px 20px', fontWeight: 700 }}
              >
                <span>Xem Trước & Đối Chiếu ➔</span>
              </button>
            </div>
          </div>

          {/* List of Loaded PIM Files */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
            {pimFiles.map((fileObj, idx) => {
              const assignedId = fileObj.assignedCmsCategoryId || fileObj.assignedCategoryId || '';
              const matchedCat = cmsCategories.find(c => String(c.id) === String(assignedId));
              const count = fileObj.productsCount ?? fileObj.totalRows ?? fileObj.products?.length ?? 0;
              let catCodesDisplay = fileObj.categoryCode || '';
              if (!catCodesDisplay && fileObj.detectedCategoryCodes && fileObj.detectedCategoryCodes.length > 0) {
                catCodesDisplay = fileObj.detectedCategoryCodes.join(', ');
              }

              return (
                <div 
                  key={fileObj.id || idx}
                  className="glass-panel"
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {/* Left: File Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <FileSpreadsheet size={18} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                          {fileObj.fileName}
                        </span>
                        {catCodesDisplay && (
                          <span className="badge badge-secondary" style={{ fontSize: '0.68rem' }} title={`Gồm các mã ngành PIM: ${catCodesDisplay}`}>
                            Mã PIM: {catCodesDisplay.length > 30 ? catCodesDisplay.substring(0, 30) + '...' : catCodesDisplay}
                          </span>
                        )}
                      </div>

                      {/* Category Assignment Dropdown */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Đích CMS:</span>
                        {fileObj.mappedCategories && fileObj.mappedCategories.length > 1 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {fileObj.mappedCategories.map((mcat, mIdx) => (
                              <span key={mIdx} style={{
                                padding: '3px 8px',
                                fontSize: '0.72rem',
                                borderRadius: '6px',
                                border: mcat.cmsId ? '1px solid #10b981' : '1px solid #f87171',
                                backgroundColor: mcat.cmsId ? '#f0fdf4' : '#fef2f2',
                                color: mcat.cmsId ? '#047857' : '#b91c1c',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }} title={`Mã PIM: ${mcat.pimCode}`}>
                                {mcat.cmsId ? `${mcat.cmsId} - ${mcat.cmsName}` : `PIM ${mcat.pimCode}: Chưa map`}
                              </span>
                            ))}
                          </div>
                        ) : fileObj.detectedCategoryCodes && fileObj.detectedCategoryCodes.length > 1 ? (
                          <span style={{
                            padding: '3px 8px',
                            fontSize: '0.74rem',
                            borderRadius: '6px',
                            border: '1px solid #10b981',
                            backgroundColor: '#f0fdf4',
                            color: '#047857',
                            fontWeight: 600,
                          }}>
                            Tự động ánh xạ (Đa ngành hàng)
                          </span>
                        ) : (
                          <select
                            value={assignedId}
                            onChange={(e) => {
                              const selectedCat = cmsCategories.find(c => String(c.id) === e.target.value);
                              onAssignCategoryToFile(fileObj.id, e.target.value, selectedCat?.name || '');
                            }}
                            style={{
                              padding: '3px 8px',
                              fontSize: '0.74rem',
                              borderRadius: '6px',
                              border: assignedId ? '1px solid #10b981' : '1px solid var(--border-medium)',
                              backgroundColor: assignedId ? '#f0fdf4' : '#ffffff',
                              color: assignedId ? '#047857' : 'var(--text-main)',
                              fontWeight: assignedId ? 600 : 400,
                              maxWidth: '240px'
                            }}
                            title="Gán ngành hàng CMS đích cho file PIM này nếu mã PIM chưa được map"
                          >
                            <option value="">-- Theo mã PIM tự động --</option>
                            {cmsCategories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.id} - {cat.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => openPreview(fileObj)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                      title="Xem trước dữ liệu chi tiết của file PIM này"
                    >
                      <Eye size={13} />
                      <span>Xem dữ liệu</span>
                    </button>

                    <button
                      onClick={() => onRemovePimFile(fileObj.id)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '6px 10px', color: '#dc2626' }}
                      title="Loại bỏ file PIM này"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Actions for Multi-file */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => openPreview(null)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '7px 14px' }}
              >
                <Eye size={14} />
                <span>Xem bảng gộp dữ liệu</span>
              </button>
            </div>

            <button
              onClick={onClearAllPimFiles}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '7px 12px', color: '#dc2626' }}
            >
              <Trash2 size={13} />
              <span>Xóa tất cả file PIM</span>
            </button>
          </div>
        </div>
      )}

      {/* Advanced Data Preview Modal */}
      {previewModalConfig.isOpen && (
        <DataPreviewModal
          isOpen={previewModalConfig.isOpen}
          onClose={() => setPreviewModalConfig(prev => ({ ...prev, isOpen: false }))}
          title={previewModalConfig.title}
          fileName={previewModalConfig.fileName}
          fileType={previewModalConfig.fileType}
          data={previewModalConfig.data}
          onDownloadFile={previewModalConfig.onDownloadFile}
          onSaveDataset={onSaveMasterDataset}
        />
      )}

    </div>
  );
}
