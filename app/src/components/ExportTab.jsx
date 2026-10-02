import React, { useState, useMemo, useRef } from 'react';
import { 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  FileSpreadsheet,
  Settings,
  Sparkles,
  Package,
  ChevronDown,
  ChevronUp,
  FileCheck,
  ListFilter,
  UploadCloud,
  ClipboardPaste,
  Trash2,
  Filter,
  AlertTriangle,
  FileText,
  Check,
  Layers,
  ArrowRight
} from 'lucide-react';
import { exportCMSImportExcel, exportCMSNewValuesExcel } from '../services/excelExporter';
import { saveUserConfig } from '../services/storageService';
import { readExcelWorkbook, parseTargetIdListFromSheet, parseTargetIdListFromText } from '../services/excelParser';
import { useNotification } from '../context/NotificationContext';

export default function ExportTab({
  transformationResult,
  userConfig,
  setUserConfig
}) {
  const notify = useNotification();
  const fileInputRef = useRef(null);

  // Settings & Modes
  const [valueMode, setValueMode] = useState('id'); // 'id' | 'text'
  const [fileName, setFileName] = useState(`import_cms_${new Date().toISOString().slice(0, 10)}.xlsx`);
  const [newValueFileName, setNewValueFileName] = useState(`import_gia_tri_moi_cms_${new Date().toISOString().slice(0, 10)}.xlsx`);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingNewValues, setIsExportingNewValues] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [newValueSuccess, setNewValueSuccess] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // SMART EXPORT SCOPE STATE: 'all' | 'whitelist'
  const [exportScope, setExportScope] = useState('all'); // 'all' (Toàn bộ) | 'whitelist' (Chỉ xuất theo danh sách ID)
  const [whitelistInputMode, setWhitelistInputMode] = useState('paste'); // 'paste' | 'excel'
  const [pastedIdText, setPastedIdText] = useState('');
  const [uploadedExcelName, setUploadedExcelName] = useState('');
  const [showUnmatchedList, setShowUnmatchedList] = useState(false);
  const [uploadedIds, setUploadedIds] = useState([]);

  const handleConfigChange = (field, value) => {
    const updated = { ...userConfig, [field]: value };
    setUserConfig(updated);
    saveUserConfig(updated);
  };

  const valueImportConfig = userConfig?.valueImportConfig || {
    displayOrder: 3,
    isSearch: 0,
    compareValue: 0,
    isExistPro: 0
  };

  const handleValueConfigChange = (field, val) => {
    const updatedValueConfig = {
      ...(userConfig?.valueImportConfig || { displayOrder: 3, isSearch: 0, compareValue: 0, isExistPro: 0 }),
      [field]: val
    };
    handleConfigChange('valueImportConfig', updatedValueConfig);
  };

  const isUserInfoComplete =
    Boolean(userConfig?.username?.trim()) &&
    Boolean(userConfig?.fullname?.trim()) &&
    Boolean(userConfig?.siteId?.trim()) &&
    Boolean(userConfig?.languageId?.trim());

  // Map of all distinct products currently in the PIM dataset
  const datasetProductInfo = useMemo(() => {
    const map = new Map(); // key (lower) => { id, model, catName, catId }
    const distinctIds = new Set();
    const distinctModels = new Set();

    (transformationResult?.validImportRows || []).forEach(r => {
      const pid = String(r.PRODUCTID || '').trim();
      const model = String(r.trace?.model_code || '').trim();
      const cmsId = String(r.trace?.cms_product_id || '').trim();
      const catName = r.trace?.cmsCategoryName || '';
      const catId = r.trace?.cmsCategoryId || '';

      const info = { id: pid || cmsId, model, catName, catId };
      if (pid) {
        distinctIds.add(pid);
        map.set(pid.toLowerCase(), info);
      }
      if (cmsId) {
        distinctIds.add(cmsId);
        map.set(cmsId.toLowerCase(), info);
      }
      if (model) {
        distinctModels.add(model);
        map.set(model.toLowerCase(), info);
      }
    });

    return {
      map,
      totalDistinctProducts: Math.max(distinctIds.size, distinctModels.size),
      sampleIds: Array.from(distinctIds).slice(0, 5)
    };
  }, [transformationResult]);

  // Active target IDs list derived from input mode (paste vs excel)
  const activeRawIds = useMemo(() => {
    if (whitelistInputMode === 'paste') {
      return parseTargetIdListFromText(pastedIdText);
    } else {
      return uploadedIds;
    }
  }, [whitelistInputMode, pastedIdText, uploadedIds]);

  // SMART MATCHING ANALYSIS: compare user's provided IDs with PIM dataset
  const targetIdAnalysis = useMemo(() => {
    if (exportScope !== 'whitelist' || activeRawIds.length === 0) {
      return {
        totalTargetIds: activeRawIds.length,
        matchedIds: [],
        unmatchedIds: [],
        filteredValidRows: transformationResult?.validImportRows || [],
        filteredHoldRows: transformationResult?.holdRows || [],
        targetIdSet: null,
        matchedProductsCount: 0
      };
    }

    const matched = [];
    const unmatched = [];
    const targetSet = new Set();
    const matchedProductsSet = new Set();

    activeRawIds.forEach(id => {
      const clean = String(id).trim();
      const lower = clean.toLowerCase();
      if (datasetProductInfo.map.has(lower)) {
        matched.push(clean);
        targetSet.add(lower);
        const pInfo = datasetProductInfo.map.get(lower);
        if (pInfo.id) matchedProductsSet.add(pInfo.id);
        if (pInfo.model) matchedProductsSet.add(pInfo.model);
      } else {
        unmatched.push(clean);
      }
    });

    const filteredValidRows = (transformationResult?.validImportRows || []).filter(r => {
      const pid = String(r.PRODUCTID || '').trim().toLowerCase();
      const model = String(r.trace?.model_code || '').trim().toLowerCase();
      const cmsId = String(r.trace?.cms_product_id || '').trim().toLowerCase();
      return targetSet.has(pid) || (model && targetSet.has(model)) || (cmsId && targetSet.has(cmsId));
    });

    const filteredHoldRows = (transformationResult?.holdRows || []).filter(h => {
      const pid = String(h.cms_product_id || '').trim().toLowerCase();
      const model = String(h.model_code || '').trim().toLowerCase();
      return (pid && targetSet.has(pid)) || (model && targetSet.has(model));
    });

    const filteredProposals = (transformationResult?.proposals || []).filter(p => {
      const hasAssociatedProduct = (p.associatedProductIds || []).some(id => targetSet.has(String(id).trim().toLowerCase()));
      const hasAssociatedModel = (p.associatedModelCodes || []).some(model => targetSet.has(String(model).trim().toLowerCase()));
      return hasAssociatedProduct || hasAssociatedModel;
    });

    return {
      totalTargetIds: activeRawIds.length,
      matchedIds: matched,
      unmatchedIds: unmatched,
      filteredValidRows,
      filteredHoldRows,
      filteredProposals,
      targetIdSet: targetSet,
      matchedProductsCount: matchedProductsSet.size || matched.length
    };
  }, [exportScope, activeRawIds, transformationResult, datasetProductInfo]);

  // Effective rows to export based on selected scope
  const effectiveValidRows = exportScope === 'whitelist' ? targetIdAnalysis.filteredValidRows : (transformationResult?.validImportRows || []);
  const effectiveHoldRows = exportScope === 'whitelist' ? targetIdAnalysis.filteredHoldRows : (transformationResult?.holdRows || []);
  const effectiveProposals = exportScope === 'whitelist' ? targetIdAnalysis.filteredProposals : (transformationResult?.proposals || []);
  
  const validRowsCount = effectiveValidRows.length;
  const holdRowsCount = effectiveHoldRows.length;
  const proposalsCount = effectiveProposals.length;
  
  const isReadyToExport = isUserInfoComplete && effectiveValidRows.length > 0;

  // Handle file upload for 1-column Excel of target IDs
  const handleUploadIdExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const wb = await readExcelWorkbook(file);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const ids = parseTargetIdListFromSheet(sheet);

      if (ids.length === 0) {
        notify.warning(`File "${file.name}" không chứa danh sách ID hợp lệ.`);
        return;
      }

      setUploadedExcelName(file.name);
      setUploadedIds(ids);
      notify.success(`Đã nạp ${ids.length} ID từ file "${file.name}"!`);
    } catch (err) {
      notify.error(`Lỗi khi đọc file Excel ID: ${err.message}`);
    }
  };

  // Quick paste from clipboard
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        notify.warning('Clipboard trống!');
        return;
      }
      setPastedIdText(text);
      notify.info('Đã dán dữ liệu từ clipboard!');
    } catch (err) {
      notify.warning('Không thể truy cập clipboard tự động. Bạn vui lòng bấm Ctrl+V (hoặc Cmd+V) vào ô nhập.');
    }
  };

  // Sample ID test filler
  const handleLoadSampleTargetIds = () => {
    const samples = datasetProductInfo.sampleIds;
    if (samples.length === 0) {
      notify.warning('Chưa có ID sản phẩm nào trong dữ liệu PIM để nạp mẫu.');
      return;
    }
    const sampleText = samples.join('\n');
    setPastedIdText(sampleText);
    notify.info(`Đã nạp ${samples.length} ID mẫu từ dữ liệu đang có để thử nghiệm!`);
  };

  // Clear whitelist IDs
  const handleClearTargetIds = () => {
    setPastedIdText('');
    setUploadedIds([]);
    setUploadedExcelName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    notify.info('Đã xóa danh sách ID lọc.');
  };

  // Export File 1: Import thuộc tính sản phẩm CMS
  const handleExport = () => {
    if (!isReadyToExport) {
      if (exportScope === 'whitelist' && effectiveValidRows.length === 0) {
        notify.warning('Không có dòng dữ liệu nào khớp với danh sách ID bạn cung cấp. Vui lòng kiểm tra lại ID!');
      } else {
        notify.warning('Vui lòng kiểm tra dữ liệu sản phẩm và thông tin người dùng trước khi xuất.');
      }
      return;
    }
    setIsExporting(true);

    try {
      exportCMSImportExcel({
        validImportRows: effectiveValidRows,
        holdRows: effectiveHoldRows,
        proposals: effectiveProposals,
        fileName,
        valueMode,
        targetProductIds: exportScope === 'whitelist' ? targetIdAnalysis.targetIdSet : null
      });
      setExportSuccess(true);
      notify.success(
        exportScope === 'whitelist'
          ? `Đã xuất thành công file import CMS cho ${targetIdAnalysis.matchedProductsCount} sản phẩm chỉ định (${effectiveValidRows.length} dòng)!`
          : `Đã xuất thành công toàn bộ ${effectiveValidRows.length} dòng import CMS!`
      );
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      notify.error('Lỗi khi tạo file Excel: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Export File 2: Import giá trị mới CMS theo mẫu file_mau_import_gia_tri_tren_cms.xlsx
  const handleExportNewValues = () => {
    const currentProposalsCount = effectiveProposals.length;
    if (currentProposalsCount === 0) {
      notify.warning('Không có giá trị đề xuất tạo mới nào để xuất file trong phạm vi hiện tại.');
      return;
    }
    setIsExportingNewValues(true);

    try {
      exportCMSNewValuesExcel({
        proposals: effectiveProposals,
        fileName: newValueFileName,
        config: {
          displayOrder: valueImportConfig.displayOrder ?? 3,
          isSearch: valueImportConfig.isSearch ?? 0,
          compareValue: valueImportConfig.compareValue ?? 0,
          isExistPro: valueImportConfig.isExistPro ?? 0,
          createdUser: userConfig?.username || '174873'
        }
      });
      setNewValueSuccess(true);
      notify.success(`Đã xuất file import giá trị mới: "${newValueFileName}" (${currentProposalsCount} giá trị)!`);
      setTimeout(() => setNewValueSuccess(false), 4000);
    } catch (err) {
      notify.error('Lỗi khi tạo file Excel giá trị mới: ' + err.message);
    } finally {
      setIsExportingNewValues(false);
    }
  };

  // Export cả 2 file cùng lúc
  const handleExportBoth = () => {
    handleExport();
    if (effectiveProposals.length > 0) {
      setTimeout(() => {
        handleExportNewValues();
      }, 500);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 28px 36px 28px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Top Header Card */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Xuất File Import CMS
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Tùy chọn xuất toàn bộ file hoặc lọc chính xác theo danh sách ID sản phẩm chỉ định
            </div>
          </div>

          {/* User Info Capsule with Fast Site Switcher & Settings Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '0.78rem',
              color: '#334155'
            }}>
              <User size={14} color="#2563eb" />
              <span>Người tạo: <b>{userConfig?.username || '174873'}</b></span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              
              {/* Quick Site Selector in Top Capsule */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Site ID:</span>
                <select
                  value={userConfig?.siteId || '2'}
                  onChange={e => handleConfigChange('siteId', e.target.value)}
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid #93c5fd',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                  title="Chọn sàn thương mại điện tử xuất file"
                >
                  <option value="2">2 - Điện Máy Xanh (Mặc định)</option>
                  <option value="1">1 - Thế Giới Di Động</option>
                  <option value="1,2">1,2 - Cả TGDĐ & ĐMX</option>
                  <option value="1,2,16">1,2,16 - TGDĐ, ĐMX & TopZone</option>
                  {!['1', '2', '1,2', '1,2,16'].includes(userConfig?.siteId) && (
                    <option value={userConfig?.siteId}>{userConfig?.siteId} (Tùy chỉnh)</option>
                  )}
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="btn btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
              title="Mở cài đặt thông tin người dùng và tham số xuất"
            >
              <Settings size={13} />
              <span>{showSettings ? 'Đóng cài đặt' : 'Cài đặt'}</span>
              {showSettings ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Settings Panel (Clean, Friendly & Unobtrusive) */}
      {showSettings && (
        <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '22px', backgroundColor: '#f8fafc', border: '1px solid var(--border-blue)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Settings size={16} color="#2563eb" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Cài Đặt Người Dùng & Tham Số Xuất CMS
            </h4>
          </div>

          {/* User Fields Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Mã nhân viên tạo (USERNAME) *
              </label>
              <input
                type="text"
                value={userConfig?.username || ''}
                onChange={e => handleConfigChange('username', e.target.value)}
                placeholder="174873"
                style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Họ và tên (FULLNAME) *
              </label>
              <input
                type="text"
                value={userConfig?.fullname || ''}
                onChange={e => handleConfigChange('fullname', e.target.value)}
                placeholder="Nguyễn Văn A"
                style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
              />
            </div>

            {/* Site ID Selection Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Chọn Site ID xuất file *
              </label>
              <select
                value={userConfig?.siteId || '2'}
                onChange={e => handleConfigChange('siteId', e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '0.8rem',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: '1.5px solid #93c5fd',
                  background: '#ffffff',
                  color: '#1e3a8a',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="2">Site 2: Điện Máy Xanh (ĐMX - Mặc định)</option>
                <option value="1">Site 1: Thế Giới Di Động (TGDĐ)</option>
                <option value="1,2">Site 1,2: Cả TGDĐ & ĐMX</option>
                <option value="1,2,16">Site 1,2,16: TGDĐ, ĐMX & TopZone</option>
                {!['1', '2', '1,2', '1,2,16'].includes(userConfig?.siteId) && (
                  <option value={userConfig?.siteId}>Tùy chỉnh: {userConfig?.siteId}</option>
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Ngôn ngữ (LANGUAGEID)
              </label>
              <input
                type="text"
                value={userConfig?.languageId || 'vi-VN'}
                disabled
                style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px', background: '#f1f5f9', color: '#64748b' }}
              />
            </div>
          </div>

          {/* Friendly Presets for New Values Excel */}
          <div style={{ paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                Thông số mặc định (Tạo giá trị mới CMS)
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
              <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Thứ tự hiển thị <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Displayorder)</span>:
                </span>
                <input
                  type="number"
                  value={valueImportConfig.displayOrder ?? 3}
                  onChange={e => handleValueConfigChange('displayOrder', e.target.value)}
                  style={{ width: '100%', fontSize: '0.78rem', padding: '5px 8px' }}
                  placeholder="Mặc định: 3"
                />
              </div>

              <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Bộ lọc tìm kiếm <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Issearch)</span>:
                </span>
                <select
                  value={valueImportConfig.isSearch ?? 0}
                  onChange={e => handleValueConfigChange('isSearch', Number(e.target.value))}
                  style={{ width: '100%', fontSize: '0.78rem', padding: '5px 8px' }}
                >
                  <option value={0}>0 - Không làm bộ lọc (Mặc định)</option>
                  <option value={1}>1 - Cho phép lọc</option>
                </select>
              </div>

              <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Trang so sánh SP <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Comparevalue)</span>:
                </span>
                <select
                  value={valueImportConfig.compareValue ?? 0}
                  onChange={e => handleValueConfigChange('compareValue', Number(e.target.value))}
                  style={{ width: '100%', fontSize: '0.78rem', padding: '5px 8px' }}
                >
                  <option value={0}>0 - Không so sánh (Mặc định)</option>
                  <option value={1}>1 - Có đưa vào so sánh</option>
                </select>
              </div>

              <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Gán vào sản phẩm <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Isexistpro)</span>:
                </span>
                <select
                  value={valueImportConfig.isExistPro ?? 0}
                  onChange={e => handleValueConfigChange('isExistPro', Number(e.target.value))}
                  style={{ width: '100%', fontSize: '0.78rem', padding: '5px 8px' }}
                >
                  <option value={0}>0 - Chưa có SP (Mặc định)</option>
                  <option value={1}>1 - Đã có sản phẩm</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMART EXPORT SCOPE CARD: TOÀN BỘ VS DANH SÁCH ID CHỈ ĐỊNH */}
      <div className="glass-panel" style={{ padding: '22px 24px', marginBottom: '22px', backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: exportScope === 'whitelist' ? '#eff6ff' : '#f1f5f9',
              color: exportScope === 'whitelist' ? '#2563eb' : '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: exportScope === 'whitelist' ? '1px solid #bfdbfe' : '1px solid #cbd5e1'
            }}>
              <ListFilter size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Phương Án Phạm Vi Xuất Dữ Liệu
              </h3>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                Hỗ trợ xuất toàn bộ file PIM hoặc chỉ lọc chính xác các ID sản phẩm bạn cần xử lý
              </div>
            </div>
          </div>

          {/* Quick Scope Switcher Pill */}
          <span style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '6px',
            background: exportScope === 'whitelist' ? '#dbeafe' : '#f1f5f9',
            color: exportScope === 'whitelist' ? '#1d4ed8' : '#475569',
            border: exportScope === 'whitelist' ? '1px solid #bfdbfe' : '1px solid #cbd5e1',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            {exportScope === 'whitelist' ? (
              <>
                <Filter size={13} />
                <span>Chế độ: Lọc theo {targetIdAnalysis.matchedProductsCount} ID chỉ định</span>
              </>
            ) : (
              <>
                <Layers size={13} />
                <span>Chế độ: Toàn bộ file ({datasetProductInfo.totalDistinctProducts} sản phẩm)</span>
              </>
            )}
          </span>
        </div>

        {/* 2 Scope Selection Tabs / Radios */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px', marginBottom: exportScope === 'whitelist' ? '16px' : '0' }}>
          
          {/* Phương án 1: Toàn bộ file */}
          <div
            onClick={() => {
              setExportScope('all');
              setFileName(`import_cms_toan_bo_${new Date().toISOString().slice(0, 10)}.xlsx`);
            }}
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              border: exportScope === 'all' ? '2px solid #2563eb' : '1px solid #e2e8f0',
              background: exportScope === 'all' ? '#eff6ff' : '#ffffff',
              boxShadow: exportScope === 'all' ? '0 2px 6px rgba(37,99,235,0.12)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <input 
              type="radio" 
              name="exportScopeOption" 
              checked={exportScope === 'all'} 
              onChange={() => {}} 
              style={{ marginTop: '3px', accentColor: '#2563eb' }}
            />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: exportScope === 'all' ? '#1d4ed8' : '#1e293b' }}>
                Phương án 1: Xuất toàn bộ file nạp vào
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '3px' }}>
                Xuất tất cả {datasetProductInfo.totalDistinctProducts} sản phẩm ({validRowsCount.toLocaleString()} dòng CMS hợp lệ) đang có trong file PIM.
              </div>
            </div>
          </div>

          {/* Phương án 2: Chỉ xuất theo ID chỉ định */}
          <div
            onClick={() => {
              setExportScope('whitelist');
              setFileName(`import_cms_loc_sp_${new Date().toISOString().slice(0, 10)}.xlsx`);
            }}
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              border: exportScope === 'whitelist' ? '2px solid #059669' : '1px solid #e2e8f0',
              background: exportScope === 'whitelist' ? '#ecfdf5' : '#ffffff',
              boxShadow: exportScope === 'whitelist' ? '0 2px 6px rgba(5,150,105,0.12)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <input 
              type="radio" 
              name="exportScopeOption" 
              checked={exportScope === 'whitelist'} 
              onChange={() => {}} 
              style={{ marginTop: '3px', accentColor: '#059669' }}
            />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: exportScope === 'whitelist' ? '#065f46' : '#1e293b' }}>
                Phương án 2: Chỉ xuất với những ID này (Whitelist lọc ID)
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '3px' }}>
                Dán text hoặc nạp file Excel 1 cột ID. Hệ thống chỉ xuất dữ liệu thuộc các ID được cung cấp, loại bỏ toàn bộ các ID khác.
              </div>
            </div>
          </div>

        </div>

        {/* INTERACTIVE WHITELIST INPUT & MATCHING PANEL (When Phương án 2 is selected) */}
        {exportScope === 'whitelist' && (
          <div style={{
            background: '#f8fafc',
            border: '1.5px solid #86efac',
            borderRadius: '12px',
            padding: '16px 20px',
            marginTop: '12px'
          }}>
            
            {/* Sub-tabs for input: Dán Data vs Nạp Excel 1 Cột */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setWhitelistInputMode('paste')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '7px',
                    fontSize: '0.8rem',
                    fontWeight: whitelistInputMode === 'paste' ? 700 : 500,
                    background: whitelistInputMode === 'paste' ? '#059669' : '#ffffff',
                    color: whitelistInputMode === 'paste' ? '#ffffff' : '#475569',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ClipboardPaste size={14} />
                  <span>Cách 1: Dán trực tiếp danh sách ID</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWhitelistInputMode('excel')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '7px',
                    fontSize: '0.8rem',
                    fontWeight: whitelistInputMode === 'excel' ? 700 : 500,
                    background: whitelistInputMode === 'excel' ? '#059669' : '#ffffff',
                    color: whitelistInputMode === 'excel' ? '#ffffff' : '#475569',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <FileSpreadsheet size={14} />
                  <span>Cách 2: Nạp file Excel 1 cột ID</span>
                </button>
              </div>

              {/* Action Buttons: Dán clipboard, Mẫu, Xóa */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {whitelistInputMode === 'paste' && (
                  <>
                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      className="btn btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <ClipboardPaste size={13} color="#2563eb" />
                      <span>Dán từ Clipboard</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLoadSampleTargetIds}
                      className="btn btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      title="Nạp nhanh các ID từ dữ liệu PIM đang mở để thử nghiệm xuất"
                    >
                      <Sparkles size={13} color="#059669" />
                      <span>Nạp mẫu ID có sẵn</span>
                    </button>
                  </>
                )}

                {activeRawIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearTargetIds}
                    style={{
                      padding: '5px 10px',
                      fontSize: '0.74rem',
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      color: '#be123c',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Xóa danh sách ID</span>
                  </button>
                )}
              </div>
            </div>

            {/* Input Mode 1: Textarea Direct Paste */}
            {whitelistInputMode === 'paste' && (
              <div>
                <textarea
                  value={pastedIdText}
                  onChange={e => setPastedIdText(e.target.value)}
                  placeholder={`Dán danh sách ID sản phẩm tại đây (mỗi dòng 1 ID, hoặc phân cách bằng dấu phẩy, khoảng trắng)...\nVí dụ:\n5205\n34921\nAVA_DS006\nOPPO_A78`}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#0f172a',
                    background: '#ffffff',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {/* Input Mode 2: Excel File Upload (1 column) */}
            {whitelistInputMode === 'excel' && (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  onChange={handleUploadIdExcel}
                  style={{ display: 'none' }}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #94a3b8',
                    borderRadius: '10px',
                    padding: '20px',
                    textAlign: 'center',
                    background: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <UploadCloud size={28} color="#059669" style={{ margin: '0 auto 6px auto' }} />
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>
                    {uploadedExcelName ? `Đã chọn file: ${uploadedExcelName}` : 'Bấm vào đây để chọn file Excel danh sách ID (1 cột)'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                    Chỉ cần 1 cột chứa ID sản phẩm (PRODUCTID hoặc Model code). Tự động bỏ qua dòng tiêu đề.
                  </div>
                  {uploadedIds.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700 }}>
                      <Check size={14} strokeWidth={3} />
                      <span>Đã nạp thành công {uploadedIds.length} ID từ file</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SMART MATCHING METRICS & ANALYTICS BAR */}
            {activeRawIds.length > 0 && (
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  
                  {/* 3 Metric Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {/* Badge 1: Tổng ID cung cấp */}
                    <div style={{ padding: '6px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.78rem' }}>
                      <span style={{ color: '#64748b' }}>Tổng ID nạp vào: </span>
                      <b style={{ color: '#0f172a' }}>{targetIdAnalysis.totalTargetIds} ID</b>
                    </div>

                    {/* Badge 2: Khớp trong dữ liệu PIM */}
                    <div style={{ padding: '6px 12px', background: '#ecfdf5', border: '1.5px solid #86efac', borderRadius: '8px', fontSize: '0.78rem' }}>
                      <span style={{ color: '#065f46' }}>✅ Khớp trong PIM: </span>
                      <b style={{ color: '#047857' }}>{targetIdAnalysis.matchedIds.length} ID</b>
                      <span style={{ color: '#059669', marginLeft: '4px', fontWeight: 600 }}>
                        ➔ {targetIdAnalysis.filteredValidRows.length} dòng CMS
                      </span>
                    </div>

                    {/* Badge 3: Không tìm thấy trong PIM */}
                    {targetIdAnalysis.unmatchedIds.length > 0 && (
                      <div 
                        onClick={() => setShowUnmatchedList(!showUnmatchedList)}
                        style={{ padding: '6px 12px', background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer' }}
                        title="Bấm để xem danh sách các ID không có trong file PIM hiện tại"
                      >
                        <span style={{ color: '#be123c' }}>⚠️ Không có trong PIM: </span>
                        <b style={{ color: '#9f1239' }}>{targetIdAnalysis.unmatchedIds.length} ID</b>
                        <span style={{ fontSize: '0.7rem', color: '#e11d48', marginLeft: '4px', textDecoration: 'underline' }}>
                          ({showUnmatchedList ? 'Ẩn' : 'Xem'})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Matching Status Summary */}
                  <div>
                    {targetIdAnalysis.matchedIds.length > 0 ? (
                      <span style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={14} strokeWidth={3} />
                        <span>Sẵn sàng xuất {targetIdAnalysis.filteredValidRows.length} dòng thuộc {targetIdAnalysis.matchedProductsCount} sản phẩm!</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.76rem', color: '#dc2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={14} />
                        <span>Không có ID nào khớp với file PIM đang nạp!</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Collapsible Unmatched IDs list preview */}
                {showUnmatchedList && targetIdAnalysis.unmatchedIds.length > 0 && (
                  <div style={{ marginTop: '10px', padding: '10px 14px', background: '#fff1f2', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                    <div style={{ fontSize: '0.74rem', color: '#9f1239', fontWeight: 700, marginBottom: '6px' }}>
                      ⚠️ Danh sách {targetIdAnalysis.unmatchedIds.length} ID không tìm thấy trong file PIM hiện tại (Hệ thống sẽ KHÔNG xuất những ID này):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', maxHeight: '100px', overflowY: 'auto' }}>
                      {targetIdAnalysis.unmatchedIds.map((uid, uIdx) => (
                        <code key={uIdx} style={{ fontSize: '0.72rem', background: '#ffe4e6', color: '#9f1239', padding: '1px 6px', borderRadius: '4px', border: '1px solid #fecdd3' }}>
                          {uid}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* 2 Main Action Cards: Clean, Spacious & Focused */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '22px' }}>
        
        {/* Card 1: File Import Thuộc Tính Sản Phẩm */}
        <div 
          className="glass-panel" 
          style={{ 
            padding: '24px', 
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: exportScope === 'whitelist' ? '1.5px solid #86efac' : '1px solid #bfdbfe',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: exportScope === 'whitelist' ? '0 4px 14px rgba(16,185,129,0.06)' : '0 4px 14px rgba(37, 99, 235, 0.05)'
          }}
        >
          <div>
            {/* Header of Card 1 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: exportScope === 'whitelist' ? '#ecfdf5' : '#eff6ff',
                  color: exportScope === 'whitelist' ? '#059669' : '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: exportScope === 'whitelist' ? '1px solid #a7f3d0' : '1px solid #bfdbfe'
                }}>
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    File Import Thuộc Tính Sản Phẩm
                  </h3>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '1px' }}>
                    Gói 3 Sheet chuẩn: Dòng hợp lệ, Tạm giữ và Đề xuất
                  </div>
                </div>
              </div>

              {/* Status Row Count Badge */}
              <span className="badge badge-success" style={{ fontSize: '0.76rem' }}>
                {exportScope === 'whitelist' ? (
                  `Lọc: ${effectiveValidRows.length.toLocaleString()} dòng (${targetIdAnalysis.matchedProductsCount} SP)`
                ) : (
                  `Toàn bộ: ${validRowsCount.toLocaleString()} dòng`
                )}
              </span>
            </div>

            {/* Value Format Selector: Mã ID vs Text */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', margin: '14px 0' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Định dạng cột PROPVALUEID:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label 
                  onClick={() => {
                    setValueMode('id');
                    setFileName(
                      exportScope === 'whitelist'
                        ? `import_cms_ma_so_loc_${targetIdAnalysis.matchedProductsCount || 'sp'}_${new Date().toISOString().slice(0, 10)}.xlsx`
                        : `import_cms_ma_so_${new Date().toISOString().slice(0, 10)}.xlsx`
                    );
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: `1.5px solid ${valueMode === 'id' ? '#2563eb' : '#e2e8f0'}`,
                    background: valueMode === 'id' ? '#eff6ff' : '#ffffff'
                  }}
                >
                  <input 
                    type="radio" 
                    name="exportValueMode" 
                    checked={valueMode === 'id'} 
                    onChange={() => {}} 
                    style={{ accentColor: '#2563eb' }}
                  />
                  <span style={{ fontSize: '0.78rem', fontWeight: valueMode === 'id' ? 700 : 500, color: valueMode === 'id' ? '#1d4ed8' : '#334155' }}>
                    Mã số ID (Chuẩn CMS)
                  </span>
                </label>

                <label 
                  onClick={() => {
                    setValueMode('text');
                    setFileName(
                      exportScope === 'whitelist'
                        ? `import_cms_text_loc_${targetIdAnalysis.matchedProductsCount || 'sp'}_${new Date().toISOString().slice(0, 10)}.xlsx`
                        : `import_cms_text_${new Date().toISOString().slice(0, 10)}.xlsx`
                    );
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: `1.5px solid ${valueMode === 'text' ? '#059669' : '#e2e8f0'}`,
                    background: valueMode === 'text' ? '#ecfdf5' : '#ffffff'
                  }}
                >
                  <input 
                    type="radio" 
                    name="exportValueMode" 
                    checked={valueMode === 'text'} 
                    onChange={() => {}} 
                    style={{ accentColor: '#059669' }}
                  />
                  <span style={{ fontSize: '0.78rem', fontWeight: valueMode === 'text' ? 700 : 500, color: valueMode === 'text' ? '#047857' : '#334155' }}>
                    Dạng Text
                  </span>
                </label>
              </div>
            </div>

            {/* Filename Input */}
            <div style={{ marginBottom: '18px' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                Tên file xuất ra:
              </span>
              <input
                type="text"
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                style={{ width: '100%', fontSize: '0.8rem', padding: '7px 10px' }}
              />
            </div>
          </div>

          {/* Download Button */}
          <div>
            {exportSuccess && (
              <div style={{ padding: '8px 12px', background: '#ecfdf5', borderRadius: '8px', color: '#047857', fontSize: '0.78rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} />
                <span>Đã tải xuống file import sản phẩm thành công!</span>
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={!isReadyToExport || isExporting}
              className={`btn ${exportScope === 'whitelist' ? 'btn-success' : 'btn-primary'}`}
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '0.88rem',
                opacity: isReadyToExport ? 1 : 0.5,
                cursor: isReadyToExport ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Download size={16} />
              <span>
                {isExporting 
                  ? 'Đang tạo file Excel...' 
                  : exportScope === 'whitelist' 
                    ? `Tải File Import (${effectiveValidRows.length} dòng / ${targetIdAnalysis.matchedProductsCount} SP chỉ định)`
                    : `Tải Toàn Bộ File Import (${effectiveValidRows.length} dòng CMS)`}
              </span>
            </button>
          </div>
        </div>

        {/* Card 2: File Import Giá Trị Mới CMS */}
        <div 
          className="glass-panel" 
          style={{ 
            padding: '24px', 
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: `1px solid ${proposalsCount > 0 ? '#fde68a' : '#e2e8f0'}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)'
          }}
        >
          <div>
            {/* Header of Card 2 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: proposalsCount > 0 ? '#fffbeb' : '#f8fafc',
                  color: proposalsCount > 0 ? '#b45309' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${proposalsCount > 0 ? '#fde68a' : '#e2e8f0'}`
                }}>
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    File Tạo Mới Giá Trị Trên CMS
                  </h3>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '1px' }}>
                    Cấu trúc 7 cột chuẩn: file_mau_import_gia_tri_tren_cms.xlsx
                  </div>
                </div>
              </div>

              <span className={`badge ${proposalsCount > 0 ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.76rem' }}>
                {proposalsCount > 0 ? `${proposalsCount} giá trị cần tạo` : 'Đã khớp 100%'}
              </span>
            </div>

            {/* Status Information Box */}
            <div style={{ 
              background: proposalsCount > 0 ? '#fffbeb' : '#f8fafc', 
              border: `1px solid ${proposalsCount > 0 ? '#fde68a' : '#e2e8f0'}`, 
              borderRadius: '10px', 
              padding: '12px 14px', 
              margin: '14px 0' 
            }}>
              {proposalsCount > 0 ? (
                <>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                    Có {proposalsCount} giá trị PIM chưa tồn tại trong danh mục CMS:
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#b45309' }}>
                    Xuất file này để import lên CMS trước, giúp các sản phẩm PIM khớp mã ID đầy đủ.
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#78350f', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✓ Tự động định dạng chuẩn theo mẫu CMS</span>
                    <span style={{ color: '#d97706' }}>•</span>
                    <span>Người tạo: <b>{userConfig?.username || '174873'}</b></span>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '0.78rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Toàn bộ giá trị PIM đã khớp hoàn toàn với danh mục CMS.</span>
                </div>
              )}
            </div>

            {/* Filename Input */}
            {proposalsCount > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Tên file xuất ra:
                </span>
                <input
                  type="text"
                  value={newValueFileName}
                  onChange={e => setNewValueFileName(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8rem', padding: '7px 10px' }}
                />
              </div>
            )}
          </div>

          {/* Download Button */}
          <div>
            {newValueSuccess && (
              <div style={{ padding: '8px 12px', background: '#ecfdf5', borderRadius: '8px', color: '#047857', fontSize: '0.78rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} />
                <span>Đã tải xuống file giá trị mới thành công!</span>
              </div>
            )}

            <button
              onClick={handleExportNewValues}
              disabled={proposalsCount === 0 || isExportingNewValues}
              className="btn btn-gold"
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '0.88rem',
                opacity: proposalsCount > 0 ? 1 : 0.5,
                cursor: proposalsCount > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              <Sparkles size={16} />
              <span>
                {isExportingNewValues 
                  ? 'Đang tạo file...' 
                  : proposalsCount > 0 
                    ? `⚡ Tải File Import Giá Trị Mới (${proposalsCount} mục)` 
                    : 'Không Có Giá Trị Cần Tạo Mới'}
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Combined Action Bar (When both files are available) */}
      {proposalsCount > 0 && isReadyToExport && (
        <div style={{
          padding: '14px 20px',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#334155' }}>
            💡 Bạn có thể tải cùng lúc cả 2 tệp để tiết kiệm thời gian thao tác.
          </div>

          <button
            onClick={handleExportBoth}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Package size={15} color="#2563eb" />
            <span>Tải Đồng Thời Cả 2 File (.xlsx)</span>
          </button>
        </div>
      )}

    </div>
  );
}
