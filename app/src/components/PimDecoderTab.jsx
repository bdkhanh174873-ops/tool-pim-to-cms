import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Search, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  UploadCloud, 
  Languages, 
  Layers, 
  Filter, 
  Check, 
  FileText,
  RefreshCw,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useNotification } from '../context/NotificationContext';
import { 
  decodePimSheetRows, 
  decodePimProductsList, 
  exportDecodedPimToExcel 
} from '../services/pimDecoderService';

export default function PimDecoderTab({
  pimFiles = [],
  pimProductData,
  masterFiles = {},
  onLoadSampleMasterData
}) {
  const notify = useNotification();
  const [selectedFileSource, setSelectedFileSource] = useState('loaded'); // 'loaded' or 'custom'
  const [customFileState, setCustomFileState] = useState(null); // { fileName, rawRows }
  const [displayMode, setDisplayMode] = useState('decoded'); // 'decoded' or 'raw'
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedPimFileIndex, setSelectedPimFileIndex] = useState(0);

  // Options Map from Master Files
  const pimOptionData = masterFiles.pimOption?.parsedData;
  const optionsMap = pimOptionData?.optionsMap || null;
  const totalPimOptions = pimOptionData?.totalOptions || (optionsMap ? optionsMap.size : 0);

  // Handle custom file upload directly into this tab
  const handleCustomFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target.result;
        const wb = XLSX.read(buffer, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        if (rawRows.length < 2) {
          notify.error('File Excel không đủ dữ liệu (tối thiểu 2 dòng header kỹ thuật và nhãn tiếng Việt).');
          return;
        }

        setCustomFileState({
          fileName: file.name,
          rawRows
        });
        setSelectedFileSource('custom');
        setCurrentPage(1);
        notify.success(`Đã nạp file "${file.name}" (${(rawRows.length - 2).toLocaleString()} dòng) thành công!`);
      } catch (err) {
        notify.error('Lỗi khi đọc file Excel: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Perform decoding reactively
  const decodeResult = useMemo(() => {
    if (!optionsMap || optionsMap.size === 0) {
      return null;
    }

    // Source 1: Custom uploaded file in this tab
    if (selectedFileSource === 'custom' && customFileState?.rawRows) {
      try {
        return decodePimSheetRows(customFileState.rawRows, optionsMap, customFileState.fileName);
      } catch (err) {
        console.error('Lỗi giải mã file custom:', err);
        return null;
      }
    }

    // Source 2: Current PIM files in tool
    if (pimFiles && pimFiles.length > 0) {
      const activeFile = pimFiles[selectedPimFileIndex] || pimFiles[0];
      if (activeFile && activeFile.products) {
        return decodePimProductsList(
          activeFile.products, 
          activeFile.headers || [], 
          activeFile.labels || [], 
          optionsMap, 
          activeFile.fileName
        );
      }
    }

    // Source 3: Combined pimProductData
    if (pimProductData && pimProductData.products) {
      return decodePimProductsList(
        pimProductData.products,
        pimProductData.headers || [],
        [],
        optionsMap,
        pimProductData.fileName || 'sp_pim_tong_hop.xlsx'
      );
    }

    return null;
  }, [selectedFileSource, customFileState, pimFiles, selectedPimFileIndex, pimProductData, optionsMap]);

  // Reset pagination on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFileSource, selectedPimFileIndex]);

  // Filtered rows for preview
  const filteredData = useMemo(() => {
    if (!decodeResult) return [];

    const rowsToUse = displayMode === 'decoded' ? decodeResult.decodedRows : decodeResult.rawRows;
    if (!searchTerm.trim()) {
      return rowsToUse.map((row, idx) => ({ row, idx, rawRow: decodeResult.rawRows[idx] }));
    }

    const term = searchTerm.toLowerCase();
    const result = [];
    for (let i = 0; i < rowsToUse.length; i++) {
      const row = rowsToUse[i];
      const match = row.some(cell => String(cell || '').toLowerCase().includes(term));
      if (match) {
        result.push({ row, idx: i, rawRow: decodeResult.rawRows[i] });
      }
    }
    return result;
  }, [decodeResult, displayMode, searchTerm]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Export to Excel handler
  const handleExportExcel = () => {
    if (!decodeResult || !decodeResult.decodedRows.length) {
      notify.warning('Chưa có dữ liệu để xuất file!');
      return;
    }

    setIsExporting(true);
    try {
      const exportName = exportDecodedPimToExcel(
        decodeResult.headers,
        decodeResult.labels,
        decodeResult.decodedRows,
        decodeResult.fileName
      );
      notify.success(`Đã xuất file Excel thành công: "${exportName}"!`, 'Xuất file hoàn tất');
    } catch (err) {
      notify.error('Lỗi khi xuất file Excel: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 24px' }}>
      
      {/* Sleek Minimal Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
          Dịch Option PIM Ra Chữ
        </h2>

        <button
          onClick={handleExportExcel}
          disabled={isExporting || !decodeResult || decodeResult.decodedRows.length === 0}
          className="btn"
          style={{
            background: '#10b981',
            color: '#ffffff',
            border: 'none',
            padding: '7px 16px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
            cursor: (!decodeResult || decodeResult.decodedRows.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (!decodeResult || decodeResult.decodedRows.length === 0) ? 0.6 : 1,
            whiteSpace: 'nowrap'
          }}
          title="Xuất file Excel đã dịch option ra chữ"
        >
          <Download size={15} />
          <span>{isExporting ? 'Đang xuất...' : 'Xuất Excel Đã Dịch (.xlsx)'}</span>
        </button>
      </div>

      {/* Control Bar: Source Selection & Status */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          
          {/* Left: Source Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
              Nguồn dữ liệu PIM:
            </span>

            {/* If files are loaded in tool */}
            {pimFiles.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={selectedFileSource === 'loaded' ? selectedPimFileIndex : 'custom'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setSelectedFileSource('custom');
                    } else {
                      setSelectedFileSource('loaded');
                      setSelectedPimFileIndex(Number(val));
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium)',
                    background: '#ffffff'
                  }}
                >
                  {pimFiles.map((f, i) => (
                    <option key={i} value={i}>
                      📁 File sẵn có: {f.fileName} ({(f.products?.length || 0).toLocaleString()} SP)
                    </option>
                  ))}
                  {customFileState && (
                    <option value="custom">
                      📎 File tải riêng: {customFileState.fileName}
                    </option>
                  )}
                </select>
              </div>
            )}

            {/* Custom File Upload Button */}
            <label
              className="btn btn-secondary"
              style={{
                fontSize: '0.78rem',
                padding: '6px 14px',
                cursor: 'pointer',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
              title="Tải lên bất kỳ file sản phẩm PIM nào khác để giải mã"
            >
              <UploadCloud size={14} color="#2563eb" />
              <span>Nạp file PIM khác...</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleCustomFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Right: Dictionary Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Từ điển PIM Option:</span>
              {optionsMap && optionsMap.size > 0 ? (
                <span className="badge badge-success" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> {totalPimOptions.toLocaleString()} Option sẵn sàng
                </span>
              ) : (
                <span className="badge badge-warning" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={13} /> Chưa có từ điển PIM Option
                </span>
              )}
            </div>

            {(!optionsMap || optionsMap.size === 0) && (
              <button
                type="button"
                onClick={onLoadSampleMasterData}
                className="btn btn-primary"
                style={{ fontSize: '0.76rem', padding: '5px 12px', whiteSpace: 'nowrap' }}
              >
                <Sparkles size={13} />
                <span>Nạp từ điển Option mẫu</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metric Strip (Clean Single Row) */}
      {decodeResult && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div className="glass-panel" style={{ padding: '12px 16px', borderLeft: '4px solid #2563eb' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>TẬP TIN ĐANG XỬ LÝ</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={decodeResult.fileName}>
              {decodeResult.fileName}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#2563eb', marginTop: '2px' }}>
              {decodeResult.stats.totalRows.toLocaleString()} dòng sản phẩm
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '12px 16px', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>CỘT ĐÃ DỊCH CHỮ</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
              {decodeResult.stats.decodedColsCount} / {decodeResult.stats.totalCols} cột
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '12px 16px', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>TỔNG Ô ĐÃ DỊCH</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7c3aed', marginTop: '2px' }}>
              {decodeResult.stats.totalDecodedCells.toLocaleString()} ô
            </div>
          </div>
        </div>
      )}

      {/* Main Preview Table Panel */}
      <div className="glass-panel" style={{ padding: '18px' }}>
        
        {/* Table Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
          
          {/* Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex',
              background: '#e2e8f0',
              borderRadius: '8px',
              padding: '3px',
              border: '1px solid var(--border-subtle)'
            }}>
              <button
                type="button"
                onClick={() => setDisplayMode('decoded')}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: displayMode === 'decoded' ? 700 : 500,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: displayMode === 'decoded' ? '#10b981' : 'transparent',
                  color: displayMode === 'decoded' ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: displayMode === 'decoded' ? '0 2px 6px rgba(16, 185, 129, 0.4)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>🔤 Đã dịch chữ</span>
              </button>

              <button
                type="button"
                onClick={() => setDisplayMode('raw')}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: displayMode === 'raw' ? 700 : 500,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: displayMode === 'raw' ? 'var(--accent-primary)' : 'transparent',
                  color: displayMode === 'raw' ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: displayMode === 'raw' ? '0 2px 6px rgba(37, 99, 235, 0.35)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>🔢 Mã gốc</span>
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Tìm mã model, SKU, hoặc chữ..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '32px', fontSize: '0.8rem', padding: '6px 10px 6px 32px' }}
              />
            </div>
          </div>
        </div>

        {/* Highlighted Decoded Columns Tags */}
        {decodeResult && decodeResult.decodedColNames.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '14px',
            padding: '8px 12px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.75rem'
          }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
              ✨ Các cột đã dịch ra chữ:
            </span>
            {decodeResult.decodedColNames.map((col, idx) => (
              <span
                key={idx}
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#047857',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
                title={`Cột ${col.header}`}
              >
                {col.label} <code style={{ fontSize: '0.66rem', color: '#059669' }}>({col.header})</code>
              </span>
            ))}
          </div>
        )}

        {/* Data Table */}
        {!decodeResult || decodeResult.decodedRows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <FileSpreadsheet size={40} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>
              Chưa có dữ liệu sản phẩm PIM để giải mã
            </div>
          </div>
        ) : (
          <div>
            <div className="table-scroll-container" style={{ maxHeight: '520px', overflowX: 'auto' }}>
              <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th style={{ width: '45px', textAlign: 'center', whiteSpace: 'nowrap' }}>#</th>
                    {decodeResult.headers.map((h, i) => {
                      const isDecodedCol = decodeResult.decodedColIndices.has(i);
                      const label = decodeResult.labels[i] || h;
                      return (
                        <th 
                          key={i} 
                          style={{ 
                            whiteSpace: 'nowrap',
                            background: isDecodedCol ? '#f0fdf4 !important' : '#f8fafc !important',
                            borderBottom: isDecodedCol ? '2px solid #10b981' : '2px solid #e2e8f0'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ color: isDecodedCol ? '#047857' : '#1e293b', fontWeight: 700 }}>
                              {label}
                            </span>
                            <code style={{ fontSize: '0.68rem', color: isDecodedCol ? '#059669' : '#64748b' }}>
                              {h}
                            </code>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map(({ row, idx, rawRow }, rowOrder) => {
                    const rowNum = (currentPage - 1) * pageSize + rowOrder + 1;
                    return (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                          {rowNum}
                        </td>
                        {decodeResult.headers.map((h, cIdx) => {
                          const val = row[cIdx];
                          const rawVal = rawRow ? rawRow[cIdx] : '';
                          const isDecodedCol = decodeResult.decodedColIndices.has(cIdx);
                          const isTranslatedCell = isDecodedCol && val && val !== rawVal;

                          return (
                            <td 
                              key={cIdx} 
                              style={{ 
                                whiteSpace: 'nowrap',
                                background: isTranslatedCell && displayMode === 'decoded' ? 'rgba(16, 185, 129, 0.04)' : 'transparent'
                              }}
                              title={isTranslatedCell ? `Gốc: ${rawVal}` : ''}
                            >
                              {isTranslatedCell && displayMode === 'decoded' ? (
                                <span style={{
                                  background: '#ecfdf5',
                                  border: '1px solid #a7f3d0',
                                  color: '#047857',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  display: 'inline-block'
                                }}>
                                  {val}
                                </span>
                              ) : (
                                <span style={{
                                  fontFamily: h.toLowerCase().includes('id') || h.toLowerCase().includes('code') ? 'var(--font-mono)' : 'inherit',
                                  color: h === 'model_id_cms' ? '#059669' : h === 'model_code' ? '#2563eb' : 'inherit',
                                  fontWeight: h === 'model_id_cms' || h === 'model_code' ? 700 : 400
                                }}>
                                  {val !== undefined && val !== null ? String(val) : ''}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination & Status Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              paddingTop: '16px',
              marginTop: '12px',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Hiển thị <b>{Math.min(filteredData.length, (currentPage - 1) * pageSize + 1)}</b> - <b>{Math.min(filteredData.length, currentPage * pageSize)}</b> / <b>{filteredData.length.toLocaleString()}</b> dòng
                {searchTerm && ` (đã lọc theo từ khóa)`}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>Số dòng/trang:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.76rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: '#ffffff'
                  }}
                >
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>

                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                >
                  ◀ Trước
                </button>

                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', padding: '0 4px' }}>
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                >
                  Sau ▶
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
