import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Search, 
  Eye, 
  Layers, 
  Database, 
  Tag, 
  FileText,
  X,
  Sparkles,
  ArrowRight,
  Filter,
  Download,
  Check,
  CheckCheck,
  ShieldAlert,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { exportCMSImportExcel, exportCMSNewValuesExcel } from '../services/excelExporter';
import { useNotification } from '../context/NotificationContext';

export default function PreviewTraceTab({
  transformationResult,
  setTransformationResult,
  onSupplementCmsId,
  userConfig,
  onProceedToExport,
  onLoadSampleAll,
  onGoToUpload,
  onGoToMapping,
  onResolveDiscrepancy,
  isLoading
}) {
  const notify = useNotification();
  const [activeSubTab, setActiveSubTab] = useState('valid'); // 'valid' | 'hold' | 'proposals'
  const [selectedTrace, setSelectedTrace] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('ALL');
  const [fileFilter, setFileFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL'); // 'ALL' | 'PRIORITY2_ACCEPTED' | 'PRIORITY2_AUTO' | 'PRIORITY1_ACCEPTED' | 'PRIORITY1' | 'DISCREPANCY'
  const [isDiscrepancyBannerExpanded, setIsDiscrepancyBannerExpanded] = useState(false);
  // 2 Chế độ hiển thị & xuất PROPVALUEID: 'id' (Mặc định: mã số ID) | 'text' (Dạng text tương ứng)
  const [valueDisplayMode, setValueDisplayMode] = useState('id');
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState('');
  const [inputCmsIdMap, setInputCmsIdMap] = useState({});

  // Handle ESC key to close Traceability modal
  useEffect(() => {
    if (!selectedTrace) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        setSelectedTrace(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTrace]);

  if (!transformationResult) {
    return (
      <div className="animate-fade-in" style={{ padding: '0 24px 32px 24px' }}>
        <div 
          className="glass-panel" 
          style={{ 
            padding: '60px 40px', 
            textAlign: 'center', 
            maxWidth: '720px', 
            margin: '40px auto',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-md)',
            background: '#ffffff'
          }}
        >
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            boxShadow: '0 8px 25px rgba(79, 70, 229, 0.25)'
          }}>
            <Database size={32} color="#ffffff" />
          </div>

          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '22px' }}>
            Chưa có dữ liệu chuyển đổi để xem trước
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={onLoadSampleAll}
              disabled={isLoading}
              className="btn btn-primary"
              style={{ padding: '12px 26px', fontSize: '0.94rem' }}
            >
              <Sparkles size={18} />
              <span>{isLoading ? 'Đang nạp dữ liệu...' : '⚡ Nạp trọn bộ dữ liệu Adapter Sạc & Xem ngay'}</span>
            </button>

            <button
              onClick={onGoToUpload}
              className="btn btn-secondary"
              style={{ padding: '12px 22px', fontSize: '0.94rem' }}
            >
              <span>Quay lại Bước 1: Tải file sản phẩm</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { validImportRows = [], holdRows = [], proposals = [], stats = {} } = transformationResult || {};

  // Quick Export directly from Preview Tab with selected mode
  const handleQuickExport = (mode = valueDisplayMode) => {
    setIsExporting(true);
    try {
      const modeSuffix = mode === 'text' ? 'dang_text' : 'dang_ma_so';
      const fileName = `import_cms_${modeSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      exportCMSImportExcel({
        validImportRows,
        holdRows,
        proposals,
        fileName,
        valueMode: mode
      });
      notify.success(`Đã xuất thành công: "${fileName}" (${mode === 'text' ? 'Chế độ Text' : 'Chế độ Mã số ID'})`);
    } catch (err) {
      notify.error('Lỗi khi xuất file: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Quick Export New Values directly from Preview proposals subtab
  const handleQuickExportNewValues = () => {
    if (!proposals || proposals.length === 0) {
      notify.warning('Không có giá trị đề xuất mới nào để xuất.');
      return;
    }
    const cfg = userConfig?.valueImportConfig || {};
    const fileName = `import_gia_tri_moi_cms_${new Date().toISOString().slice(0, 10)}.xlsx`;
    try {
      exportCMSNewValuesExcel({
        proposals,
        fileName,
        config: {
          displayOrder: cfg.displayOrder ?? 3,
          isSearch: cfg.isSearch ?? 0,
          compareValue: cfg.compareValue ?? 0,
          isExistPro: cfg.isExistPro ?? 0,
          createdUser: userConfig?.username || '174873'
        }
      });
      notify.success(`Đã xuất file import giá trị mới: "${fileName}" (${proposals.length} giá trị)!`);
    } catch (err) {
      notify.error('Lỗi khi xuất file giá trị mới: ' + err.message);
    }
  };

  // Find discrepancy corresponding to selected trace item if any
  const matchingDiscrepancy = selectedTrace && transformationResult?.discrepancies?.find(d => 
    String(d.cmsCategoryId).trim() === String(selectedTrace.cmsCategoryId).trim() &&
    String(d.pimAttributeCode).trim().toLowerCase() === String(selectedTrace.pimAttributeCode).trim().toLowerCase()
  );

  // Distinct properties in valid rows for filter
  const distinctProperties = Array.from(
    new Set(validImportRows.map(r => `${r.PROPERTYID} - ${r.trace.cmsPropertyName}`))
  );

  // Distinct PIM files for filter
  const distinctPimFiles = Array.from(
    new Set([
      ...validImportRows.map(r => r.trace.fileOrigin).filter(Boolean),
      ...holdRows.map(r => r.fileOrigin).filter(Boolean)
    ])
  );

  // Source Counts for Quick Filters & Badges
  const sourceCounts = useMemo(() => {
    let p2Accepted = 0;
    let p2Auto = 0;
    let p1Accepted = 0;
    let p1 = 0;
    let disc = 0;
    for (const r of validImportRows) {
      const src = r.trace?.source;
      const isP2Confirmed = src === 'priority2_accepted' || r.trace?.isUserConfirmedP2;
      const isP1Confirmed = src === 'priority1_accepted' || r.trace?.isUserConfirmedP1;
      const isAuto = src === 'priority2' || (r.trace?.isAutoMapped && !isP2Confirmed);
      if (isP2Confirmed) p2Accepted++;
      else if (isP1Confirmed) p1Accepted++;
      else if (isAuto) p2Auto++;
      else p1++;

      if (r.trace?.hasDiscrepancy) disc++;
    }
    return {
      all: validImportRows.length,
      p2Accepted,
      p2Auto,
      p1Accepted,
      p1,
      disc
    };
  }, [validImportRows]);

  // Filtered valid rows (searches ProductID, PropertyID, Value ID & Value Text)
  const filteredValidRows = validImportRows.filter(row => {
    const matchSearch =
      row.PRODUCTID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.PROPERTYID.includes(searchTerm) ||
      String(row.PROPVALUEID).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.PROPVALUETEXT && String(row.PROPVALUETEXT).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (row.trace.pimAttributeCode && row.trace.pimAttributeCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (row.trace.fileOrigin && row.trace.fileOrigin.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchProp =
      propertyFilter === 'ALL' || `${row.PROPERTYID} - ${row.trace.cmsPropertyName}` === propertyFilter;
    const matchFile =
      fileFilter === 'ALL' || row.trace.fileOrigin === fileFilter;
    const matchSource =
      sourceFilter === 'ALL' ? true :
      sourceFilter === 'PRIORITY2_ACCEPTED' ? (row.trace.source === 'priority2_accepted' || row.trace.isUserConfirmedP2) :
      sourceFilter === 'PRIORITY2_AUTO' ? (row.trace.source === 'priority2' || (row.trace.isAutoMapped && !row.trace.isUserConfirmedP2 && row.trace.source !== 'priority2_accepted')) :
      sourceFilter === 'PRIORITY1_ACCEPTED' ? (row.trace.source === 'priority1_accepted' || row.trace.isUserConfirmedP1) :
      sourceFilter === 'PRIORITY1' ? (row.trace.source === 'priority1' || row.trace.source === 'file_ref') :
      sourceFilter === 'DISCREPANCY' ? row.trace.hasDiscrepancy : true;
    return matchSearch && matchProp && matchFile && matchSource;
  });

  const [holdReasonFilter, setHoldReasonFilter] = useState('ALL');
  const [selectedCandidateMap, setSelectedCandidateMap] = useState({});

  // Group hold rows by reason for quick filtering
  const holdReasonCounts = React.useMemo(() => {
    const counts = { ALL: holdRows.length };
    for (const r of holdRows) {
      const reason = r.reason || 'Lý do khác';
      counts[reason] = (counts[reason] || 0) + 1;
    }
    return counts;
  }, [holdRows]);

  // Handler for resolving multiple VALUEIDs conflict (Phương án 2)
  const handleResolveHoldRow = (holdRow, chosenValId, applyToAll = false) => {
    if (!chosenValId) {
      notify.warning('Vui lòng chọn 1 mã VALUEID hợp lệ!');
      return;
    }

    const firstConflict = holdRow.conflictList?.[0];
    const conflictText = firstConflict?.text || '';
    const matchedCand = firstConflict?.candidates?.find(c => c.valId === chosenValId);
    const chosenValName = matchedCand?.rawValue || conflictText;

    // Rows to resolve: either this single holdRow or all holdRows with same property and conflicting text
    const rowsToResolve = applyToAll
      ? holdRows.filter(r =>
          r.cmsCategoryId === holdRow.cmsCategoryId &&
          r.cmsPropertyId === holdRow.cmsPropertyId &&
          r.conflictList?.some(c => c.text === conflictText)
        )
      : [holdRow];

    const resolvedIds = new Set(rowsToResolve.map(r => r.id));
    const newValidRows = [];

    for (const r of rowsToResolve) {
      const currentResolved = [...(r.resolvedItems || [])];
      for (const conf of (r.conflictList || [])) {
        if (conf.text === conflictText) {
          currentResolved.push({
            raw: conf.raw,
            decoded: conf.text,
            valId: chosenValId,
            matchedName: chosenValName
          });
        }
      }

      const uniqueValIds = [];
      const uniqueValTexts = [];
      for (const res of currentResolved) {
        if (!uniqueValIds.includes(res.valId)) {
          uniqueValIds.push(res.valId);
          uniqueValTexts.push(res.matchedName || res.decoded || res.raw);
        }
      }

      const finalPropValueId = uniqueValIds.length === 1 ? uniqueValIds[0] : `,${uniqueValIds.join(',')},`;
      const finalPropValueText = uniqueValTexts.length === 1 ? uniqueValTexts[0] : `,${uniqueValTexts.join(',')},`;

      newValidRows.push({
        PRODUCTID: r.cms_product_id,
        PROPERTYID: r.cmsPropertyId,
        PROPVALUEID: finalPropValueId,
        PROPVALUETEXT: finalPropValueText,
        LANGUAGEID: userConfig?.languageId || 'vi-VN',
        USERNAME: userConfig?.username || '174873',
        FULLNAME: userConfig?.fullname || 'Quản trị viên',
        SITEID: userConfig?.siteId || '2',
        trace: {
          fileOrigin: r.fileOrigin,
          rowIndex: r.rowIndex,
          model_code: r.model_code,
          cms_product_id: r.cms_product_id,
          sku: r.sku,
          category_code: r.category_code,
          cmsCategoryId: r.cmsCategoryId,
          cmsCategoryName: r.cmsCategoryName,
          pimAttributeCode: r.pimAttributeCode,
          pimMode: r.pimMode || 'tskt',
          rawValue: r.rawValue,
          decodedItems: currentResolved,
          cmsPropertyId: r.cmsPropertyId,
          cmsPropertyName: r.cmsPropertyName,
          isMulti: uniqueValIds.length > 1,
          source: r.source || 'priority1',
          isUserConfirmedP2: r.isUserConfirmedP2 || r.source === 'priority2_accepted',
          isUserConfirmedP1: r.isUserConfirmedP1 || r.source === 'priority1_accepted',
          hasDiscrepancy: Boolean(r.hasDiscrepancy)
        }
      });
    }

    const updatedHoldRows = holdRows.filter(r => !resolvedIds.has(r.id));
    const updatedValidRows = [...validImportRows, ...newValidRows];

    if (setTransformationResult) {
      setTransformationResult(prev => ({
        ...prev,
        validImportRows: updatedValidRows,
        holdRows: updatedHoldRows,
        stats: {
          ...prev.stats,
          totalValidRows: updatedValidRows.length,
          holdRowsCount: updatedHoldRows.length
        }
      }));
    }

    notify.success(
      `Đã duyệt thành công ${rowsToResolve.length} dòng với mã VALUEID: [${chosenValId}] cho giá trị "${conflictText}"!`
    );
  };

  // Filtered hold rows
  const filteredHoldRows = holdRows.filter(row => {
    const matchSearch =
      row.model_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.pimAttributeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.fileOrigin && row.fileOrigin.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchFile =
      fileFilter === 'ALL' || row.fileOrigin === fileFilter;
    const matchReason =
      holdReasonFilter === 'ALL' || row.reason === holdReasonFilter;
    return matchSearch && matchFile && matchReason;
  });

  return (
    <div className="animate-fade-in" style={{ padding: '0 24px 32px 24px' }}>
      
      {/* Sleek Compact Metric Summary Strip (Replaces Bulky 4 Cards) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        background: '#ffffff',
        padding: '12px 20px',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <Database size={15} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>PIM Nguồn</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {stats.totalProducts?.toLocaleString() || 0} SP <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-dim)' }}>({stats.distinctModels || 0} model)</span>
              </div>
            </div>
          </div>

          <div style={{ width: '1px', height: '22px', background: '#e2e8f0' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <CheckCircle2 size={15} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Dòng Import Hợp Lệ</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#059669' }}>
                {stats.totalValidRows?.toLocaleString() || 0} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-dim)' }}>dòng CMS</span>
              </div>
            </div>
          </div>

          <div style={{ width: '1px', height: '22px', background: '#e2e8f0' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
              <AlertCircle size={15} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Bị Giữ Lại (Cần xử lý)</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#dc2626' }}>
                {stats.holdRowsCount?.toLocaleString() || 0} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-dim)' }}>dòng</span>
              </div>
            </div>
          </div>

          <div style={{ width: '1px', height: '22px', background: '#e2e8f0' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8' }}>
              <Sparkles size={15} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Đề Xuất Tạo Mới</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1d4ed8' }}>
                {stats.proposalsCount?.toLocaleString() || 0} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-dim)' }}>giá trị</span>
              </div>
            </div>
          </div>

          {stats.autoMappedCount > 0 && (
            <>
              <div style={{ width: '1px', height: '22px', background: '#e2e8f0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <Zap size={15} />
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Nhận Diện Tự Động</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#059669' }}>
                    {stats.autoMappedCount} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-dim)' }}>thuộc tính</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {sourceCounts.p2Accepted > 0 && (
            <>
              <div style={{ width: '1px', height: '22px', background: '#e2e8f0' }} />
              <div 
                onClick={() => setSourceFilter('PRIORITY2_ACCEPTED')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: sourceFilter === 'PRIORITY2_ACCEPTED' ? '#d1fae5' : 'transparent', padding: '2px 8px', borderRadius: '8px' }}
                title="Bấm để lọc xem danh sách thuộc tính đã duyệt Ưu tiên 2"
              >
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#065f46' }}>
                  <Check size={16} strokeWidth={3} />
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#065f46', fontWeight: 600 }}>Đã Duyệt Ưu Tiên 2</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#065f46' }}>
                    {sourceCounts.p2Accepted} <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>dòng</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {stats.totalValidRows > 0 && (
          <button
            onClick={onProceedToExport}
            className="btn btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.78rem' }}
          >
            <span>Sang Bước 4: Xuất File CMS</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      {/* Cảnh Báo Chênh Lệch Mã Giữa File Tham Chiếu (Ưu tiên 1) & CMS Thông Minh (Ưu tiên 2) */}
      {transformationResult?.discrepancies?.length > 0 && (
        <div style={{
          background: '#fffef5',
          border: '1.5px solid #fed7aa',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(217, 119, 6, 0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                <ShieldAlert size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#92400e' }}>
                  Phát hiện {transformationResult.discrepancies.length} thuộc tính có sự chênh lệch mã giữa File tham chiếu (Ưu tiên 1) và CMS thông minh (Ưu tiên 2)
                </div>
                <div style={{ fontSize: '0.74rem', color: '#b45309' }}>
                  Hệ thống hỗ trợ bạn chọn trực tiếp mã mong muốn ngay tại đây để cập nhật ngay bảng kết quả.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsDiscrepancyBannerExpanded(!isDiscrepancyBannerExpanded)}
                className="btn"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: isDiscrepancyBannerExpanded ? '#fef3c7' : '#ffffff',
                  border: '1px solid #fed7aa',
                  color: '#92400e',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{isDiscrepancyBannerExpanded ? 'Thu gọn danh sách chênh lệch' : `Xem & Chọn mã ngay (${transformationResult.discrepancies.length})`}</span>
                {isDiscrepancyBannerExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {onGoToMapping && (
                <button
                  onClick={onGoToMapping}
                  className="btn btn-warning"
                  style={{ padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700 }}
                >
                  <span>Quy Tắc Đối Chiếu</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Interactive Discrepancy Quick Switcher */}
          {isDiscrepancyBannerExpanded && (
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #fed7aa', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {transformationResult.discrepancies.map((disc, dIdx) => {
                const isUsingP2 = disc.appliedSource === 'priority2' || disc.resolvedChoice === 'priority2';
                const p1Code = disc.priority1.cmsPropertyId;
                const p2Code = disc.priority2.cmsPropertyId;

                return (
                  <div key={dIdx} style={{
                    background: isUsingP2 ? '#f0fdf4' : '#f8fafc',
                    border: isUsingP2 ? '1.5px solid #86efac' : '1.5px solid #bfdbfe',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    flexWrap: 'wrap',
                    boxShadow: isUsingP2 ? '0 1px 3px rgba(16,185,129,0.08)' : '0 1px 3px rgba(37,99,235,0.08)',
                    transition: 'all 0.2s ease'
                  }}>
                    {/* Left: Attribute Label & Code & Category */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                        {disc.pimAttributeLabel || disc.priority1?.cmsPropertyName}
                      </span>
                      <code style={{ fontSize: '0.76rem', color: '#2563eb', background: '#eff6ff', padding: '2px 7px', borderRadius: '4px', fontFamily: 'var(--font-mono)', border: '1px solid #dbeafe' }}>
                        {disc.pimAttributeCode}
                      </code>
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        (Ngành {disc.cmsCategoryId}{disc.cmsCategoryName ? ` - ${disc.cmsCategoryName}` : ''})
                      </span>

                      {/* Current Active Badge */}
                      {isUsingP2 ? (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: '6px',
                          background: '#d1fae5',
                          color: '#065f46',
                          border: '1px solid #a7f3d0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Check size={12} strokeWidth={3} />
                          <span>Đang dùng: <b>Ưu tiên 2 (CMS: {p2Code})</b></span>
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: '6px',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Check size={12} strokeWidth={3} />
                          <span>Đang dùng: <b>Ưu tiên 1 (File: {p1Code})</b></span>
                        </span>
                      )}
                    </div>

                    {/* Right: Explicit Selection Buttons (Solid Active vs Dashed Switch) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Priority 1 Button */}
                      <button
                        type="button"
                        onClick={() => onResolveDiscrepancy && onResolveDiscrepancy(disc, p1Code, false)}
                        style={{
                          fontSize: '0.76rem',
                          padding: '6px 14px',
                          borderRadius: '7px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                          ...(!isUsingP2 ? {
                            background: '#2563eb',
                            color: '#ffffff',
                            border: '1px solid #1d4ed8',
                            boxShadow: '0 2px 4px rgba(37,99,235,0.3)',
                            fontWeight: 700
                          } : {
                            background: '#ffffff',
                            color: '#1e40af',
                            border: '1.5px dashed #93c5fd',
                            fontWeight: 600
                          })
                        }}
                        title={!isUsingP2 ? 'Đang chọn áp dụng mã theo File tham chiếu (Ưu tiên 1)' : 'Bấm để chuyển sang áp dụng mã theo File tham chiếu (Ưu tiên 1)'}
                      >
                        {!isUsingP2 ? (
                          <>
                            <Check size={13} strokeWidth={3} />
                            <span>✔ Đang chọn: Ưu tiên 1 (File: {p1Code})</span>
                          </>
                        ) : (
                          <span>📁 Chuyển sang Ưu tiên 1 (File: {p1Code})</span>
                        )}
                      </button>

                      {/* Priority 2 Button */}
                      <button
                        type="button"
                        onClick={() => onResolveDiscrepancy && onResolveDiscrepancy(disc, p2Code, true)}
                        style={{
                          fontSize: '0.76rem',
                          padding: '6px 14px',
                          borderRadius: '7px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                          ...(isUsingP2 ? {
                            background: '#059669',
                            color: '#ffffff',
                            border: '1px solid #047857',
                            boxShadow: '0 2px 4px rgba(5,150,105,0.3)',
                            fontWeight: 700
                          } : {
                            background: '#ffffff',
                            color: '#065f46',
                            border: '1.5px dashed #86efac',
                            fontWeight: 600
                          })
                        }}
                        title={isUsingP2 ? 'Đang chọn áp dụng mã theo CMS thông minh (Ưu tiên 2)' : 'Bấm để chuyển sang áp dụng mã theo CMS thông minh (Ưu tiên 2)'}
                      >
                        {isUsingP2 ? (
                          <>
                            <Check size={13} strokeWidth={3} />
                            <span>✔ Đang chọn: Ưu tiên 2 (CMS: {p2Code})</span>
                          </>
                        ) : (
                          <span>⚡ Chuyển sang Ưu tiên 2 (CMS: {p2Code})</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Table Container */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        
        {/* Navigation Tabs and Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveSubTab('valid')}
              className="btn"
              style={{
                background: activeSubTab === 'valid' ? 'var(--accent-primary)' : '#ffffff',
                border: '1px solid ' + (activeSubTab === 'valid' ? 'var(--accent-primary)' : 'var(--border-subtle)'),
                color: activeSubTab === 'valid' ? '#ffffff' : 'var(--text-main)',
                fontSize: '0.82rem',
                whiteSpace: 'nowrap',
                boxShadow: activeSubTab === 'valid' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <CheckCircle2 size={15} />
              <span>Dòng Import Hợp Lệ ({validImportRows.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('hold')}
              className="btn"
              style={{
                background: activeSubTab === 'hold' ? '#ef4444' : '#ffffff',
                border: '1px solid ' + (activeSubTab === 'hold' ? '#ef4444' : 'var(--border-subtle)'),
                color: activeSubTab === 'hold' ? '#ffffff' : 'var(--text-main)',
                fontSize: '0.82rem',
                whiteSpace: 'nowrap',
                boxShadow: activeSubTab === 'hold' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <AlertCircle size={15} />
              <span>Bị Giữ Lại ({holdRows.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('proposals')}
              className="btn"
              style={{
                background: activeSubTab === 'proposals' ? '#0284c7' : '#ffffff',
                border: '1px solid ' + (activeSubTab === 'proposals' ? '#0284c7' : 'var(--border-subtle)'),
                color: activeSubTab === 'proposals' ? '#ffffff' : 'var(--text-main)',
                fontSize: '0.82rem',
                whiteSpace: 'nowrap',
                boxShadow: activeSubTab === 'proposals' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <Sparkles size={15} />
              <span>Đề Xuất Tạo Mới ({proposals.length})</span>
            </button>
          </div>

          {/* Search & Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Tìm ProductID, PropertyID, Value, PIM..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '32px' }}
              />
            </div>

            {/* Filter by Source */}
            {activeSubTab === 'valid' && (
              <select
                value={sourceFilter}
                onChange={e => setSourceFilter(e.target.value)}
                style={{
                  maxWidth: '240px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  color: sourceFilter === 'PRIORITY2_ACCEPTED' ? '#047857' : sourceFilter === 'DISCREPANCY' ? '#b45309' : 'var(--text-main)',
                  border: sourceFilter !== 'ALL' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: sourceFilter === 'PRIORITY2_ACCEPTED' ? '#ecfdf5' : '#ffffff'
                }}
                title="Lọc hiển thị theo nguồn quy tắc ánh xạ"
              >
                <option value="ALL">Tất cả nguồn ({validImportRows.length})</option>
                <option value="PRIORITY2_ACCEPTED">✅ Đã duyệt Ưu tiên 2 ({sourceCounts.p2Accepted})</option>
                <option value="PRIORITY2_AUTO">⚡ Ưu tiên 2 tự động ({sourceCounts.p2Auto})</option>
                <option value="PRIORITY1_ACCEPTED">✅ Đã duyệt Ưu tiên 1 ({sourceCounts.p1Accepted})</option>
                <option value="PRIORITY1">📁 Ưu tiên 1 file ({sourceCounts.p1})</option>
                {sourceCounts.disc > 0 && (
                  <option value="DISCREPANCY">⚠️ Có chênh lệch mã ({sourceCounts.disc})</option>
                )}
              </select>
            )}

            {/* Filter by PIM File */}
            {distinctPimFiles.length > 1 && (
              <select
                value={fileFilter}
                onChange={e => setFileFilter(e.target.value)}
                style={{ maxWidth: '180px' }}
                title="Lọc kết quả theo từng file PIM ngành hàng"
              >
                <option value="ALL">Tất cả file PIM ({distinctPimFiles.length})</option>
                {distinctPimFiles.map((fn, i) => (
                  <option key={i} value={fn}>{fn}</option>
                ))}
              </select>
            )}

            {activeSubTab === 'valid' && (
              <select
                value={propertyFilter}
                onChange={e => setPropertyFilter(e.target.value)}
                style={{ maxWidth: '200px' }}
              >
                <option value="ALL">Tất cả thuộc tính CMS ({distinctProperties.length})</option>
                {distinctProperties.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
            )}
          </div>

        </div>

        {/* Mode Switcher & Quick Export Bar (Only for Valid Import Rows) */}
        {activeSubTab === 'valid' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: '#f8fafc',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                <Layers size={16} color="var(--accent-primary)" />
                <span>Chế độ PROPVALUEID:</span>
              </div>

              {/* Segmented Controller */}
              <div style={{
                display: 'inline-flex',
                background: '#e2e8f0',
                borderRadius: '8px',
                padding: '3px',
                border: '1px solid var(--border-subtle)'
              }}>
                <button
                  type="button"
                  onClick={() => setValueDisplayMode('id')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.78rem',
                    fontWeight: valueDisplayMode === 'id' ? 700 : 500,
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: valueDisplayMode === 'id' ? 'var(--accent-primary)' : 'transparent',
                    color: valueDisplayMode === 'id' ? '#ffffff' : 'var(--text-muted)',
                    boxShadow: valueDisplayMode === 'id' ? '0 2px 6px rgba(79, 70, 229, 0.35)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>🔢 Mã số ID</span>
                </button>

                <button
                  type="button"
                  onClick={() => setValueDisplayMode('text')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.78rem',
                    fontWeight: valueDisplayMode === 'text' ? 700 : 500,
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: valueDisplayMode === 'text' ? '#10b981' : 'transparent',
                    color: valueDisplayMode === 'text' ? '#ffffff' : 'var(--text-muted)',
                    boxShadow: valueDisplayMode === 'text' ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>🔤 Chữ tương ứng</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {exportNotice && (
                <span className="badge badge-success" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                  <CheckCircle2 size={13} /> {exportNotice}
                </span>
              )}

              <button
                onClick={() => handleQuickExport(valueDisplayMode)}
                disabled={isExporting}
                className="btn btn-primary"
                style={{
                  fontSize: '0.82rem',
                  padding: '7px 16px',
                  background: valueDisplayMode === 'text' ? '#10b981' : 'var(--accent-primary)',
                  borderColor: valueDisplayMode === 'text' ? '#059669' : 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
                title={`Tải ngay file Excel import CMS với cột PROPVALUEID ở ${valueDisplayMode === 'text' ? 'Dạng Text' : 'Dạng Mã số ID'}`}
              >
                <Download size={14} />
                <span>{isExporting ? 'Đang xuất...' : `Xuất Excel (${valueDisplayMode === 'text' ? 'File Dạng Text' : 'File Dạng Mã Số'})`}</span>
              </button>
            </div>
          </div>
        )}

        {/* Subtab Content 1: Valid Import Rows */}
        {activeSubTab === 'valid' && (
          <div className="table-scroll-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ whiteSpace: 'nowrap' }}>#</th>
                  <th style={{ whiteSpace: 'nowrap' }}>PRODUCTID (CMS)</th>
                  <th style={{ whiteSpace: 'nowrap' }}>PROPERTYID</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Tên Thuộc Tính CMS</th>
                  <th style={{ whiteSpace: 'nowrap' }}>
                    PROPVALUEID {valueDisplayMode === 'text' ? '(Dạng Text)' : '(Mã Số ID)'}
                  </th>
                  <th style={{ whiteSpace: 'nowrap' }}>Loại Giá Trị</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Mã PIM Gốc</th>
                  <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Hành Trình</th>
                </tr>
              </thead>
              <tbody>
                {filteredValidRows.slice(0, 100).map((row, idx) => {
                  const isMulti = row.trace.isMulti;
                  const isText = row.trace.pimMode === 'text';
                  const displayedValue = valueDisplayMode === 'text' 
                    ? (row.PROPVALUETEXT || row.PROPVALUEID)
                    : row.PROPVALUEID;

                  return (
                    <tr key={idx}>
                      <td style={{ color: 'var(--text-dim)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{idx + 1}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <b style={{ fontFamily: 'var(--font-mono)', color: '#4f46e5' }}>
                          {row.PRODUCTID}
                        </b>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <code style={{ fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: 600 }}>
                          {row.PROPERTYID}
                        </code>
                      </td>
                      <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{row.trace.cmsPropertyName}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {valueDisplayMode === 'text' ? (
                          <span style={{ 
                            fontFamily: 'var(--font-sans)', 
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            color: '#047857',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            display: 'inline-block'
                          }}>
                            {displayedValue}
                          </span>
                        ) : (
                          <span style={{ 
                            fontFamily: 'var(--font-mono)', 
                            background: isMulti ? '#eef2ff' : '#f1f5f9',
                            border: `1px solid ${isMulti ? '#c7d2fe' : '#e2e8f0'}`,
                            color: isMulti ? '#4338ca' : isText ? '#b45309' : '#0f172a',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            display: 'inline-block'
                          }}>
                            {displayedValue}
                          </span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {isMulti ? (
                          <span className="badge badge-info" style={{ whiteSpace: 'nowrap' }}>
                            Đa giá trị {valueDisplayMode === 'text' ? '(Text)' : '(,ID,)'}
                          </span>
                        ) : isText ? (
                          <span className="badge badge-warning" style={{ whiteSpace: 'nowrap' }}>Text trực tiếp</span>
                        ) : (
                          <span className="badge badge-success" style={{ whiteSpace: 'nowrap' }}>
                            Đơn giá trị {valueDisplayMode === 'text' ? '(Text)' : '(Đơn ID)'}
                          </span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{row.trace.pimAttributeCode}</span>

                          {(row.trace.source === 'priority2_accepted' || row.trace.isUserConfirmedP2) ? (
                            <span style={{ 
                              fontSize: '0.68rem', 
                              color: '#065f46', 
                              background: '#d1fae5', 
                              border: '1.5px solid #10b981', 
                              padding: '2px 8px', 
                              borderRadius: '6px', 
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 1px 3px rgba(16, 185, 129, 0.2)'
                            }} title="Thuộc tính này đã được bạn xác nhận áp dụng mã CMS theo Danh mục thông minh (Ưu tiên 2)">
                              <Check size={12} strokeWidth={3} />
                              <span>Đã duyệt Ưu tiên 2</span>
                            </span>
                          ) : (row.trace.source === 'priority1_accepted' || row.trace.isUserConfirmedP1) ? (
                            <span style={{ 
                              fontSize: '0.68rem', 
                              color: '#1e40af', 
                              background: '#eff6ff', 
                              border: '1.5px solid #3b82f6', 
                              padding: '2px 8px', 
                              borderRadius: '6px', 
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }} title="Thuộc tính này đã được bạn xác nhận giữ mã CMS theo File tham chiếu (Ưu tiên 1)">
                              <Check size={12} strokeWidth={3} />
                              <span>Đã duyệt Ưu tiên 1</span>
                            </span>
                          ) : (row.trace.source === 'priority2' || row.trace.isAutoMapped) ? (
                            <span style={{ 
                              fontSize: '0.68rem', 
                              color: '#047857', 
                              background: '#ecfdf5', 
                              border: '1px solid #a7f3d0', 
                              padding: '2px 7px', 
                              borderRadius: '5px', 
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }} title="Tự động nhận diện từ CMS (Ưu tiên 2)">
                              <Zap size={11} />
                              <span>Ưu tiên 2 (Tự động)</span>
                            </span>
                          ) : (
                            <span style={{ 
                              fontSize: '0.68rem', 
                              color: '#3b82f6', 
                              background: '#eff6ff', 
                              border: '1px solid #bfdbfe', 
                              padding: '2px 7px', 
                              borderRadius: '5px', 
                              fontWeight: 600 
                            }} title="Quy tắc lấy từ File tham chiếu (Ưu tiên 1)">
                              📁 Ưu tiên 1
                            </span>
                          )}

                          {row.trace.hasDiscrepancy && row.trace.source !== 'priority2_accepted' && !row.trace.isUserConfirmedP2 && row.trace.source !== 'priority1_accepted' && !row.trace.isUserConfirmedP1 && (
                            <span style={{ 
                              fontSize: '0.65rem', 
                              color: '#b45309', 
                              background: '#fffbeb', 
                              border: '1.5px solid #f59e0b', 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              fontWeight: 700 
                            }} title="Có sự chênh lệch mã giữa File tham chiếu và CMS thông minh">
                              ⚠️ Chênh lệch
                            </span>
                          )}
                        </div>
                        {row.trace.fileOrigin && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                            {row.trace.fileOrigin} (#{row.trace.rowIndex})
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => setSelectedTrace(row.trace)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.74rem', padding: '4px 10px', whiteSpace: 'nowrap' }}
                          title="Xem chi tiết hành trình dữ liệu và kiểm tra kết quả"
                        >
                          <Eye size={13} />
                          <span>Check kết quả</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredValidRows.length > 100 && (
              <div style={{ textAlign: 'center', padding: '12px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Đang hiển thị trước 100 / {filteredValidRows.length.toLocaleString()} dòng. Khi xuất file Excel sẽ xuất đầy đủ 100% dòng hợp lệ.
              </div>
            )}
          </div>
        )}

        {/* Subtab Content 2: Hold Rows */}
        {activeSubTab === 'hold' && (
          <div>
            {/* Quick Reason Filter Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              background: '#f8fafc',
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginRight: '2px' }}>
                  <Filter size={14} color="var(--accent-primary)" />
                  <span>Bộ lọc:</span>
                </div>

                <button
                  type="button"
                  onClick={() => setHoldReasonFilter('ALL')}
                  style={{
                    padding: '4px 11px',
                    fontSize: '0.76rem',
                    borderRadius: '16px',
                    border: holdReasonFilter === 'ALL' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: holdReasonFilter === 'ALL' ? 'var(--accent-primary)' : '#ffffff',
                    color: holdReasonFilter === 'ALL' ? '#ffffff' : 'var(--text-main)',
                    fontWeight: holdReasonFilter === 'ALL' ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Tất cả ({holdRows.length})
                </button>

                {Object.entries(holdReasonCounts)
                  .filter(([key]) => key !== 'ALL')
                  .map(([reason, count]) => {
                    const isConflict = reason.includes('Trùng nhiều VALUEID');
                    const isMissingCms = reason.includes('Thiếu mã model CMS');
                    const isActive = holdReasonFilter === reason;

                    let bg = '#ffffff';
                    let border = 'var(--border-subtle)';
                    let color = 'var(--text-main)';

                    if (isActive) {
                      bg = isConflict ? '#d97706' : isMissingCms ? '#dc2626' : 'var(--accent-primary)';
                      border = bg;
                      color = '#ffffff';
                    } else if (isConflict) {
                      bg = '#fef3c7';
                      border = '#fde68a';
                      color = '#92400e';
                    } else if (isMissingCms) {
                      bg = '#fee2e2';
                      border = '#fca5a5';
                      color = '#991b1b';
                    }

                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setHoldReasonFilter(reason)}
                        style={{
                          padding: '4px 11px',
                          fontSize: '0.76rem',
                          borderRadius: '16px',
                          border: `1px solid ${border}`,
                          background: bg,
                          color: color,
                          fontWeight: isActive || isConflict || isMissingCms ? 700 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isConflict && <span>⚡</span>}
                        {isMissingCms && <span>⚠️</span>}
                        <span>{reason}</span>
                        <span style={{
                          background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                          color: isActive ? '#ffffff' : 'inherit',
                          padding: '1px 5px',
                          borderRadius: '8px',
                          fontSize: '0.7rem'
                        }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}

                {holdReasonFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setHoldReasonFilter('ALL')}
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    ✕ Bỏ lọc
                  </button>
                )}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Hiển thị <b>{filteredHoldRows.length}</b> / {holdRows.length} dòng
              </div>
            </div>

            {/* Streamlined 5-Column Table (No Horizontal Scrolling, No Clipped Headers) */}
            <div className="table-scroll-container">
              <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                  <th style={{ width: '200px' }}>Sản Phẩm & Model</th>
                  <th style={{ width: '240px' }}>Thuộc Tính & Giá Trị</th>
                  <th style={{ width: '290px' }}>Lý Do & Xử Lý (Duyệt nhanh)</th>
                  <th style={{ minWidth: '240px' }}>Chi Tiết Ngoại Lệ</th>
                </tr>
              </thead>
              <tbody>
                {filteredHoldRows.map((h, idx) => {
                  const hasConflict = h.hasMultipleValueIds && h.conflictList && h.conflictList.length > 0;
                  const firstConflict = hasConflict ? h.conflictList[0] : null;
                  const candidates = firstConflict?.candidates || [];
                  const chosenValId = selectedCandidateMap[h.id] || candidates[0]?.valId || '';

                  const sameConflictCount = hasConflict
                    ? holdRows.filter(r => 
                        r.cmsCategoryId === h.cmsCategoryId && 
                        r.cmsPropertyId === h.cmsPropertyId && 
                        r.conflictList?.some(c => c.text === firstConflict.text)
                      ).length
                    : 1;

                  return (
                    <tr 
                      key={h.id || idx} 
                      style={{ 
                        background: h.isMissingCmsId ? '#fff8f8' : hasConflict ? '#fffdfa' : 'transparent' 
                      }}
                    >
                      {/* 1. STT */}
                      <td style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.74rem' }}>
                        {idx + 1}
                      </td>

                      {/* 2. Sản Phẩm & Model */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.82rem' }}>
                            Model: {h.model_code || '(Trống model)'}
                          </div>
                          <div style={{ fontSize: '0.74rem' }}>
                            {h.cms_product_id ? (
                              <span style={{ color: '#059669', fontWeight: 600 }}>CMS ID: {h.cms_product_id}</span>
                            ) : (
                              <span style={{ color: '#dc2626', background: '#fee2e2', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, fontSize: '0.7rem' }}>
                                Chưa có ID CMS
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {h.fileOrigin} (#{h.rowIndex})
                          </div>
                        </div>
                      </td>

                      {/* 3. Thuộc Tính & Giá Trị Thô */}
                      <td>
                        {h.isMissingCmsId ? (
                          <div>
                            <div style={{ fontWeight: 600, color: '#dc2626', fontSize: '0.8rem' }}>Mã Sản Phẩm CMS</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Cột "model_id_cms"</div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.82rem' }}>
                              {h.cmsPropertyName || h.pimAttributeCode}
                            </div>
                            <code style={{ fontSize: '0.7rem', color: '#4f46e5' }}>
                              {h.pimAttributeCode}
                            </code>
                            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px', wordBreak: 'break-word' }}>
                              {h.rawValue}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 4. Lý Do & Xử Lý (Duyệt nhanh hoặc Bổ sung) */}
                      <td>
                        {/* Case 1: Trùng nhiều VALUEID */}
                        {hasConflict ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '3px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 600 }}>Chọn ID:</span>
                              <select
                                value={chosenValId}
                                onChange={(e) => setSelectedCandidateMap(prev => ({ ...prev, [h.id]: e.target.value }))}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.76rem',
                                  borderRadius: '6px',
                                  border: '1px solid #f59e0b',
                                  background: '#fffbeb',
                                  fontWeight: 600,
                                  color: '#92400e',
                                  flex: 1
                                }}
                              >
                                {candidates.map(cand => (
                                  <option key={cand.valId} value={cand.valId}>
                                    Mã {cand.valId} ({cand.rawValue})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleResolveHoldRow(h, chosenValId, false)}
                                className="btn"
                                style={{
                                  padding: '4px 9px',
                                  fontSize: '0.72rem',
                                  background: '#10b981',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  whiteSpace: 'nowrap'
                                }}
                                title="Duyệt dòng này với mã VALUEID đã chọn"
                              >
                                <Check size={12} />
                                <span>Duyệt dòng này</span>
                              </button>

                              {sameConflictCount > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleResolveHoldRow(h, chosenValId, true)}
                                  className="btn"
                                  style={{
                                    padding: '4px 9px',
                                    fontSize: '0.72rem',
                                    background: '#3b82f6',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title={`Áp dụng mã ${chosenValId} cho tất cả ${sameConflictCount} dòng cùng có giá trị này`}
                                >
                                  <CheckCheck size={12} />
                                  <span>Áp dụng tất cả ({sameConflictCount})</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ) : h.isMissingCmsId ? (
                          /* Case 2: Thiếu mã model CMS - Cho phép bổ sung ngay tại đây */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <div style={{ fontSize: '0.74rem', color: '#991b1b', fontWeight: 600 }}>
                              ⚠️ Thiếu ID sản phẩm CMS
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="text"
                                placeholder="Nhập ID CMS..."
                                value={inputCmsIdMap[h.model_code] ?? ''}
                                onChange={(e) => setInputCmsIdMap(prev => ({ ...prev, [h.model_code]: e.target.value }))}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.75rem',
                                  width: '110px',
                                  borderRadius: '6px',
                                  border: '1px solid #fca5a5',
                                  background: '#ffffff'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const val = inputCmsIdMap[h.model_code];
                                  if (!val || !val.trim()) {
                                    notify.warning('Vui lòng nhập mã ID CMS cho model này!');
                                    return;
                                  }
                                  if (onSupplementCmsId) {
                                    onSupplementCmsId(h.model_code, val.trim());
                                  }
                                }}
                                className="btn btn-primary"
                                style={{
                                  padding: '4px 9px',
                                  fontSize: '0.72rem',
                                  whiteSpace: 'nowrap',
                                  borderRadius: '6px'
                                }}
                                title="Bổ sung mã CMS và tự động đối chiếu lại"
                              >
                                <Check size={12} />
                                <span>Bổ sung</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Case 3: Các lý do khác */
                          <div>
                            {h.reason.includes('Chưa có trên CMS') ? (
                              <span 
                                className="badge badge-info" 
                                style={{ fontSize: '0.74rem', cursor: 'pointer', padding: '3px 8px' }} 
                                onClick={() => setActiveSubTab('proposals')}
                                title="Bấm để chuyển sang tab Đề Xuất Tạo Mới trên CMS"
                              >
                                ➔ Xem tab Đề Xuất CMS
                              </span>
                            ) : (
                              <span className="badge badge-warning" style={{ fontSize: '0.74rem' }}>
                                {h.reason}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 5. Chi Tiết Ngoại Lệ (Gọn, trực diện) */}
                      <td>
                        {h.isMissingCmsId ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: '#be123c',
                              background: '#ffe4e6',
                              padding: '2px 7px',
                              borderRadius: '4px'
                            }}>
                              ⚠️ Trống model_id_cms
                            </span>
                            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              Dòng #{h.rowIndex}
                            </span>
                          </div>
                        ) : hasConflict ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: '#92400e',
                                background: '#fef3c7',
                                padding: '1px 6px',
                                borderRadius: '4px'
                              }}>
                                ⚡ Trùng {candidates.length} mã
                              </span>
                              <span style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600 }}>
                                "{firstConflict?.text || h.rawValue}"
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                              {candidates.map((c, cIdx) => (
                                <span
                                  key={cIdx}
                                  style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    background: '#fef3c7',
                                    border: '1px solid #fde68a',
                                    color: '#b45309',
                                    padding: '1px 6px',
                                    borderRadius: '4px'
                                  }}
                                  title={c.rawValue ? `Tên: ${c.rawValue}` : ''}
                                >
                                  {c.valId}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : h.reason.includes('Chưa có trên CMS') ? (
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: '#0369a1',
                            background: '#e0f2fe',
                            padding: '2px 7px',
                            borderRadius: '4px'
                          }}>
                            Mới trên CMS
                          </span>
                        ) : (
                          <div style={{ fontSize: '0.74rem', color: '#475569' }}>
                            {h.reason}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* Subtab Content 3: Proposals for CMS */}
        {activeSubTab === 'proposals' && (
          <div>
            <div style={{
              padding: '10px 16px',
              background: '#eff6ff',
              borderRadius: '8px',
              marginBottom: '14px',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ fontSize: '0.86rem', color: '#1e40af', fontWeight: 700 }}>
                Đề xuất tạo mới ({proposals.length} giá trị)
              </div>

              {proposals.length > 0 && (
                <button
                  onClick={handleQuickExportNewValues}
                  className="btn btn-gold"
                  style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                  title="Tải ngay file Excel import giá trị mới theo chuẩn file_mau_import_gia_tri_tren_cms.xlsx"
                >
                  <Sparkles size={14} />
                  <span>⚡ Tải File Import Giá Trị Mới ({proposals.length} mục)</span>
                </button>
              )}
            </div>

            <div className="table-scroll-container">
              <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ whiteSpace: 'nowrap' }}>Ngành CMS</th>
                  <th style={{ whiteSpace: 'nowrap' }}>CMS PROPERTYID</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Tên Thuộc Tính CMS</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Thuộc Tính PIM</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Giá Trị Cần Tạo Mới Trên CMS</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Số Lần</th>
                  <th>Ví Dụ Model Bị Thiếu</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p, idx) => (
                  <tr key={idx}>
                    <td style={{ whiteSpace: 'nowrap' }}>{p.cmsCategoryId} - {p.cmsCategoryName}</td>
                    <td style={{ whiteSpace: 'nowrap' }}><code style={{ fontFamily: 'var(--font-mono)', color: '#059669' }}>{p.cmsPropertyId}</code></td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{p.cmsPropertyName}</td>
                    <td style={{ whiteSpace: 'nowrap' }}><code style={{ color: '#4f46e5', fontFamily: 'var(--font-mono)' }}>{p.pimAttributeCode}</code></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <b style={{ color: '#b45309', background: '#fef3c7', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                        {p.rawText}
                      </b>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}><span className="badge badge-info" style={{ whiteSpace: 'nowrap' }}>{p.count} lần</span></td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {(p.sampleModels || []).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

      </div>

      {/* Traceability Modal */}
      {selectedTrace && createPortal(
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(15, 23, 42, 0.65)', 
          backdropFilter: 'blur(6px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 99990,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)', borderRadius: '16px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--accent-primary)' }}>
                  <Eye size={18} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Hành Trình Dữ Liệu (Traceability)
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Kiểm tra nguồn gốc từ ô Excel PIM tới dòng Import CMS
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedTrace(null)}
                className="btn btn-secondary" 
                style={{ padding: '6px', borderRadius: '8px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Trace Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.84rem' }}>
              
              {/* Step 1: PIM Source */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '10px', borderLeft: '4px solid #4f46e5' }}>
                <div style={{ fontSize: '0.74rem', color: '#4f46e5', fontWeight: 700, textTransform: 'uppercase' }}>
                  Bước 1: Nguồn Dữ Liệu PIM
                </div>
                <div style={{ marginTop: '4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div>File PIM Nguồn: <b style={{ color: '#7c3aed' }}>{selectedTrace.fileOrigin || 'sp_pim.xlsx'}</b></div>
                  <div>Ngành CMS: <b style={{ color: '#4f46e5' }}>{selectedTrace.cmsCategoryName || selectedTrace.cmsCategoryId || '(Chưa xác định)'}</b></div>
                  <div>ID Sản Phẩm CMS (model_id_cms): <b style={{ color: '#059669', fontFamily: 'var(--font-mono)' }}>{selectedTrace.cms_product_id}</b></div>
                  <div>Mã Model PIM (model_code): <b>{selectedTrace.model_code}</b></div>
                  <div>Dòng Excel PIM: <b>#{selectedTrace.rowIndex}</b></div>
                  <div>Mã SKU ERP: <b>{selectedTrace.sku || '(Trống)'}</b></div>
                </div>
              </div>

              {/* Step 2: Attribute & Raw value */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '10px', borderLeft: '4px solid #0284c7' }}>
                <div style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase' }}>
                  Bước 2: Thuộc Tính & Giá Trị Thô PIM
                </div>
                <div style={{ marginTop: '4px' }}>
                  <div>Cột PIM: <code style={{ color: '#4f46e5', fontFamily: 'var(--font-mono)' }}>{selectedTrace.pimAttributeCode}</code></div>
                  <div style={{ marginTop: '4px' }}>
                    Giá trị thô: <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>{selectedTrace.rawValue}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Loại xử lý: {selectedTrace.pimMode === 'filter' ? 'Giải mã JSON Array qua (Code, OptionCode)' : selectedTrace.pimMode === 'text' ? 'Thuộc tính Text' : 'Tách chuỗi TSKT theo ký tự |'}
                  </div>
                </div>
              </div>

              {/* Step 3: CMS Mapping & Value Resolution */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '10px', borderLeft: '4px solid #059669' }}>
                <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase' }}>
                  Bước 3: Đối Chiếu Thuộc Tính & VALUEID CMS
                </div>
                <div style={{ marginTop: '4px' }}>
                  <div>CMS Property: <b>{selectedTrace.cmsPropertyName}</b> (ID: <code style={{ color: '#059669', fontFamily: 'var(--font-mono)' }}>{selectedTrace.cmsPropertyId}</code>)</div>

                  {/* Nguồn Quy Tắc & Quyết Định Ưu Tiên */}
                  <div style={{ marginTop: '10px', padding: '10px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '6px' }}>Nguồn quy tắc ánh xạ & Trạng thái:</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                      <div>
                        {(selectedTrace.isUserConfirmedP2 || selectedTrace.source === 'priority2_accepted') ? (
                          <span style={{ fontSize: '0.74rem', color: '#065f46', background: '#d1fae5', border: '1.5px solid #10b981', padding: '3px 9px', borderRadius: '6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={13} strokeWidth={3} />
                            <span>Đã duyệt dùng Ưu tiên 2 (Danh mục CMS thông minh)</span>
                          </span>
                        ) : (selectedTrace.isUserConfirmedP1 || selectedTrace.source === 'priority1_accepted') ? (
                          <span style={{ fontSize: '0.74rem', color: '#1e40af', background: '#eff6ff', border: '1.5px solid #3b82f6', padding: '3px 9px', borderRadius: '6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={13} strokeWidth={3} />
                            <span>Đã duyệt giữ Ưu tiên 1 (File tham chiếu)</span>
                          </span>
                        ) : (selectedTrace.isAutoMapped || selectedTrace.source === 'priority2') ? (
                          <span style={{ fontSize: '0.74rem', color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 9px', borderRadius: '6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Zap size={13} />
                            <span>Ưu tiên 2 (Nhận diện tự động từ CMS)</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: '#3b82f6', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '3px 9px', borderRadius: '6px', fontWeight: 600 }}>
                            📁 File tham chiếu (Ưu tiên 1)
                          </span>
                        )}
                      </div>

                      {/* Matching Discrepancy switcher */}
                      {matchingDiscrepancy && (() => {
                        const isModalP2 = selectedTrace.isUserConfirmedP2 || selectedTrace.source === 'priority2_accepted' || matchingDiscrepancy.appliedSource === 'priority2';
                        const p1Code = matchingDiscrepancy.priority1.cmsPropertyId;
                        const p2Code = matchingDiscrepancy.priority2.cmsPropertyId;

                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (onResolveDiscrepancy) {
                                  onResolveDiscrepancy(matchingDiscrepancy, p1Code, false);
                                  setSelectedTrace(null);
                                }
                              }}
                              style={{
                                fontSize: '0.74rem',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.15s ease',
                                ...(!isModalP2 ? {
                                  background: '#2563eb',
                                  color: '#ffffff',
                                  border: '1px solid #1d4ed8',
                                  fontWeight: 700,
                                  boxShadow: '0 2px 4px rgba(37,99,235,0.25)'
                                } : {
                                  background: '#ffffff',
                                  color: '#1e40af',
                                  border: '1.5px dashed #93c5fd',
                                  fontWeight: 600
                                })
                              }}
                              title={!isModalP2 ? 'Đang áp dụng mã theo File tham chiếu (Ưu tiên 1)' : 'Bấm để chuyển sang áp dụng mã theo File tham chiếu (Ưu tiên 1)'}
                            >
                              {!isModalP2 ? (
                                <>
                                  <Check size={12} strokeWidth={3} />
                                  <span>✔ Đang chọn: Ưu tiên 1 ({p1Code})</span>
                                </>
                              ) : (
                                <span>📁 Chuyển sang Ưu tiên 1 ({p1Code})</span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (onResolveDiscrepancy) {
                                  onResolveDiscrepancy(matchingDiscrepancy, p2Code, true);
                                  setSelectedTrace(null);
                                }
                              }}
                              style={{
                                fontSize: '0.74rem',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.15s ease',
                                ...(isModalP2 ? {
                                  background: '#059669',
                                  color: '#ffffff',
                                  border: '1px solid #047857',
                                  fontWeight: 700,
                                  boxShadow: '0 2px 4px rgba(5,150,105,0.25)'
                                } : {
                                  background: '#ffffff',
                                  color: '#065f46',
                                  border: '1.5px dashed #86efac',
                                  fontWeight: 600
                                })
                              }}
                              title={isModalP2 ? 'Đang áp dụng mã theo CMS thông minh (Ưu tiên 2)' : 'Bấm để chuyển sang áp dụng mã theo CMS thông minh (Ưu tiên 2)'}
                            >
                              {isModalP2 ? (
                                <>
                                  <Check size={12} strokeWidth={3} />
                                  <span>✔ Đang chọn: Ưu tiên 2 ({p2Code})</span>
                                </>
                              ) : (
                                <span>⚡ Chuyển sang Ưu tiên 2 ({p2Code})</span>
                              )}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    <b>Chi tiết từng giá trị giải mã:</b>
                    <ul style={{ marginTop: '4px', paddingLeft: '18px', listStyleType: 'disc' }}>
                      {selectedTrace.decodedItems.map((item, i) => (
                        <li key={i} style={{ marginBottom: '2px' }}>
                          Mã thô: <code>{item.raw}</code> ➔ Text: <b>"{item.decoded}"</b> ➔ VALUEID CMS: <b style={{ color: '#059669' }}>{item.valId}</b>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 4: Final Output Row */}
              <div style={{ background: 'rgba(79, 70, 229, 0.05)', border: '1px solid #c7d2fe', padding: '12px 16px', borderRadius: '10px', borderLeft: '4px solid #7c3aed' }}>
                <div style={{ fontSize: '0.74rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase' }}>
                  Bước 4: Kết Quả Ghi Dòng Import CMS
                </div>
                <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.84rem' }}>
                  <div>PRODUCTID: <b style={{ color: '#059669', fontFamily: 'var(--font-mono)' }}>{selectedTrace.cms_product_id}</b></div>
                  <div>PROPERTYID: <b style={{ color: '#4f46e5', fontFamily: 'var(--font-mono)' }}>{selectedTrace.cmsPropertyId}</b></div>
                  <div>
                    PROPVALUEID (Mã số ID): <b style={{ color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
                      {selectedTrace.isMulti ? `,${selectedTrace.decodedItems.map(d => d.valId).join(',')},` : selectedTrace.decodedItems[0]?.valId}
                    </b>
                  </div>
                  <div>
                    PROPVALUEID (Dạng Text): <b style={{ color: '#059669' }}>
                      {selectedTrace.isMulti ? `,${selectedTrace.decodedItems.map(d => d.matchedName || d.decoded).join(',')},` : (selectedTrace.decodedItems[0]?.matchedName || selectedTrace.decodedItems[0]?.decoded)}
                    </b>
                  </div>
                </div>
              </div>

            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button onClick={() => setSelectedTrace(null)} className="btn btn-secondary" style={{ fontSize: '0.82rem' }}>
                Đóng
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Bottom Bar: Proceed to export */}
      <div className="glass-panel" style={{ padding: '16px 24px', marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Đã kiểm tra xong tính toàn vẹn và đường đi dữ liệu. Chuyển sang bước cấu hình thông tin người dùng và xuất file.
        </div>

        <button
          onClick={onProceedToExport}
          className="btn btn-primary"
          style={{ padding: '10px 24px' }}
        >
          <span>Tiếp tục: Cấu Hình & Xuất File</span>
          <ArrowRight size={16} />
        </button>
      </div>

    </div>
  );
}
