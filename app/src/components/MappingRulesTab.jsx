import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Check, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Search, 
  HelpCircle,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';

export default function MappingRulesTab({
  categoryMappings = [],
  setCategoryMappings,
  attributeMappings = [],
  setAttributeMappings,
  cmsCatalog,
  discrepancies = [],
  autoMappedAttributes = [],
  unmappedAttributes = [],
  onResolveDiscrepancy,
  onAddAutoMappedRules,
  onProceedToPreview
}) {
  const [activeSubTab, setActiveSubTab] = useState(discrepancies.length > 0 ? 'discrepancies' : 'attributes'); // 'attributes' | 'smart_auto' | 'discrepancies' | 'categories'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Dynamic Category List from all available sources
  const uniqueCategories = useMemo(() => {
    const map = new Map();
    // 1. From categoryMappings
    categoryMappings.forEach(c => {
      if (c.cmsCategoryId) {
        map.set(String(c.cmsCategoryId).trim(), c.cmsCategoryName || `Ngành ${c.cmsCategoryId}`);
      }
    });
    // 2. From attributeMappings
    attributeMappings.forEach(a => {
      if (a.cmsCategoryId && !map.has(String(a.cmsCategoryId).trim())) {
        map.set(String(a.cmsCategoryId).trim(), a.cmsCategoryName || `Ngành ${a.cmsCategoryId}`);
      }
    });
    // 3. From cmsCatalog
    if (cmsCatalog && cmsCatalog.categories) {
      cmsCatalog.categories.forEach(c => {
        if (!map.has(String(c.id).trim())) {
          map.set(String(c.id).trim(), c.name || `Ngành ${c.id}`);
        }
      });
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [categoryMappings, attributeMappings, cmsCatalog]);

  // Handlers for Category Mappings
  const toggleCatStatus = (pimCode) => {
    setCategoryMappings(prev =>
      prev.map(c =>
        c.pimCategoryCode === pimCode
          ? { ...c, status: c.status === 'Confirmed' ? 'Pending' : 'Confirmed', confirmedAt: new Date().toISOString() }
          : c
      )
    );
  };

  // Handlers for Attribute Mappings
  const toggleAttrStatus = (index) => {
    setAttributeMappings(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        status: next[index].status === 'Confirmed' ? 'Disabled' : 'Confirmed',
        updatedAt: new Date().toISOString()
      };
      return next;
    });
  };

  // Handle Discrepancy Choice
  const handleSelectDiscrepancyCode = (disc, chosenPropertyId, isPriority2) => {
    if (onResolveDiscrepancy) {
      onResolveDiscrepancy(disc, chosenPropertyId, isPriority2);
    } else {
      // Local fallback
      setAttributeMappings(prev => {
        const catId = String(disc.cmsCategoryId).trim();
        const pimCode = String(disc.pimAttributeCode).trim().toLowerCase();
        return prev.map(attr => {
          if (String(attr.cmsCategoryId).trim() === catId && String(attr.pimAttributeCode).trim().toLowerCase() === pimCode) {
            return {
              ...attr,
              cmsPropertyId: String(chosenPropertyId).trim(),
              status: 'Confirmed',
              source: isPriority2 ? 'priority2_accepted' : 'priority1_accepted',
              note: isPriority2 
                ? `Đã duyệt dùng mã ${chosenPropertyId} theo Danh mục CMS thông minh (Ưu tiên 2)` 
                : `Đã chọn giữ mã ${chosenPropertyId} theo File tham chiếu (Ưu tiên 1)`,
              updatedAt: new Date().toISOString()
            };
          }
          return attr;
        });
      });
    }
  };

  // Filtered attributes (Priority 1)
  const filteredAttributes = attributeMappings.filter(attr => {
    const matchSearch =
      attr.pimAttributeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (attr.cmsPropertyName && attr.cmsPropertyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      attr.cmsPropertyId.includes(searchTerm);
    const matchCat = filterCategory === 'ALL' || String(attr.cmsCategoryId) === filterCategory;
    return matchSearch && matchCat;
  });

  // Filtered Auto-Mapped attributes (Priority 2)
  const filteredAutoMapped = autoMappedAttributes.filter(attr => {
    const matchSearch =
      attr.pimAttributeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (attr.cmsPropertyName && attr.cmsPropertyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      attr.cmsPropertyId.includes(searchTerm);
    const matchCat = filterCategory === 'ALL' || String(attr.cmsCategoryId) === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="animate-fade-in" style={{ padding: '0 24px 32px 24px' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Quy Tắc Mapping
            </h2>
          </div>

          {/* Subtab Toggle Buttons */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px', gap: '4px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveSubTab('attributes')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: activeSubTab === 'attributes' ? 700 : 500,
                background: activeSubTab === 'attributes' ? '#2563eb' : 'transparent',
                color: activeSubTab === 'attributes' ? '#ffffff' : '#475569',
                border: 'none',
                cursor: 'pointer',
                boxShadow: activeSubTab === 'attributes' ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Thuộc Tính ({attributeMappings.length})
            </button>

            {autoMappedAttributes.length > 0 && (
              <button
                onClick={() => setActiveSubTab('smart_auto')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: activeSubTab === 'smart_auto' ? 700 : 500,
                  background: activeSubTab === 'smart_auto' ? '#059669' : 'transparent',
                  color: activeSubTab === 'smart_auto' ? '#ffffff' : '#059669',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: activeSubTab === 'smart_auto' ? '0 2px 6px rgba(5, 150, 105, 0.25)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Zap size={13} />
                <span>Tự Động ({autoMappedAttributes.length})</span>
              </button>
            )}

            {discrepancies.length > 0 && (
              <button
                onClick={() => setActiveSubTab('discrepancies')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: activeSubTab === 'discrepancies' ? 700 : 600,
                  background: activeSubTab === 'discrepancies' ? '#d97706' : '#fffbeb',
                  color: activeSubTab === 'discrepancies' ? '#ffffff' : '#b45309',
                  border: '1px solid #fde68a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: activeSubTab === 'discrepancies' ? '0 2px 6px rgba(217, 119, 6, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <ShieldAlert size={14} />
                <span>Chênh Lệch ({discrepancies.length})</span>
              </button>
            )}

            <button
              onClick={() => setActiveSubTab('categories')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: activeSubTab === 'categories' ? 700 : 500,
                background: activeSubTab === 'categories' ? '#2563eb' : 'transparent',
                color: activeSubTab === 'categories' ? '#ffffff' : '#475569',
                border: 'none',
                cursor: 'pointer',
                boxShadow: activeSubTab === 'categories' ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Ngành Hàng ({categoryMappings.length})
            </button>
          </div>
        </div>
      </div>

      {/* Thông Báo Đối Soát Mã - Gợi ý CMS */}
      {discrepancies.length > 0 && (
        <div className="glass-panel" style={{ padding: '14px 18px', marginBottom: '18px', borderColor: '#bfdbfe', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={16} color="#2563eb" />
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e40af' }}>
                Thông báo đối soát: Có {discrepancies.length} thuộc tính có mã CMS gợi ý khác (Mặc định giữ Ưu tiên 1)
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
              Mặc định giữ Ưu tiên 1
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {discrepancies.map((disc, idx) => {
              const currentAttr = attributeMappings.find(a => 
                String(a.cmsCategoryId).trim() === String(disc.cmsCategoryId).trim() && 
                String(a.pimAttributeCode).trim().toLowerCase() === String(disc.pimAttributeCode).trim().toLowerCase()
              );
              const p1Code = disc.priority1.cmsPropertyId;
              const p2Code = disc.priority2.cmsPropertyId;
              const isUsingP2 = currentAttr ? currentAttr.source === 'priority2_accepted' : false;

              return (
                <div key={idx} style={{
                  background: isUsingP2 ? '#f0fdf4' : '#ffffff',
                  border: isUsingP2 ? '1px solid #86efac' : '1px solid #cbd5e1',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                      {disc.pimAttributeLabel || disc.pimAttributeCode}
                    </span>
                    <code style={{ color: '#2563eb', fontFamily: 'var(--font-mono)', fontSize: '0.74rem', background: '#eff6ff', padding: '1px 6px', borderRadius: '4px', border: '1px solid #dbeafe' }}>
                      {disc.pimAttributeCode}
                    </code>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      • Ngành {disc.cmsCategoryId}{disc.cmsCategoryName ? ` (${disc.cmsCategoryName})` : ''}
                    </span>
                  </div>

                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: '#f1f5f9',
                    padding: '3px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    gap: '2px',
                    flexShrink: 0
                  }}>
                    <button
                      type="button"
                      onClick={() => handleSelectDiscrepancyCode(disc, p1Code, false)}
                      style={{
                        fontSize: '0.74rem',
                        padding: '5px 13px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                        background: !isUsingP2 ? '#2563eb' : 'transparent',
                        color: !isUsingP2 ? '#ffffff' : '#64748b',
                        fontWeight: !isUsingP2 ? 700 : 500,
                        boxShadow: !isUsingP2 ? '0 1px 2px rgba(37,99,235,0.25)' : 'none'
                      }}
                      title={`Áp dụng Ưu tiên 1 (Mã CMS: ${p1Code})`}
                    >
                      {!isUsingP2 && <Check size={12} strokeWidth={3} />}
                      <span>Ưu tiên 1 ({p1Code})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDiscrepancyCode(disc, p2Code, true)}
                      style={{
                        fontSize: '0.74rem',
                        padding: '5px 13px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                        background: isUsingP2 ? '#059669' : 'transparent',
                        color: isUsingP2 ? '#ffffff' : '#64748b',
                        fontWeight: isUsingP2 ? 700 : 500,
                        boxShadow: isUsingP2 ? '0 1px 2px rgba(5,150,105,0.25)' : 'none'
                      }}
                      title={`Áp dụng Ưu tiên 2 (Mã CMS: ${p2Code})`}
                    >
                      {isUsingP2 && <Check size={12} strokeWidth={3} />}
                      <span>Ưu tiên 2 ({p2Code})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtab 1: Confirmed Attributes (Ưu tiên 1) */}
      {activeSubTab === 'attributes' && (
        <div className="glass-panel" style={{ padding: '18px' }}>
          
          {/* Filter and Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Tìm theo mã PIM, mã CMS, tên thuộc tính..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%', paddingLeft: '32px', fontSize: '0.8rem', padding: '6px 10px 6px 32px' }}
                />
              </div>

              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                style={{ width: '220px', fontSize: '0.8rem', padding: '6px 10px' }}
              >
                <option value="ALL">Tất cả ngành CMS ({uniqueCategories.length})</option>
                {uniqueCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.id} - {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Hiển thị <b>{filteredAttributes.length}</b> / {attributeMappings.length} quy tắc
            </div>
          </div>

          {/* Attributes Table */}
          <div className="table-scroll-container">
            <table className="custom-table" style={{ minWidth: '1050px', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '90px', textAlign: 'center' }}>NGÀNH</th>
                  <th style={{ width: '270px' }}>MÃ THUỘC TÍNH PIM</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>CƠ CHẾ PIM</th>
                  <th style={{ width: '130px' }}>CMS PROPERTYID</th>
                  <th style={{ width: '240px' }}>TÊN THUỘC TÍNH CMS</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>TRẠNG THÁI</th>
                  <th style={{ minWidth: '180px' }}>GHI CHÚ / NGUỒN</th>
                  <th style={{ width: '80px', textAlign: 'right' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttributes.map((attr, idx) => {
                  const hasDiscrepancy = discrepancies.some(d => 
                    String(d.cmsCategoryId).trim() === String(attr.cmsCategoryId).trim() && 
                    String(d.pimAttributeCode).trim().toLowerCase() === String(attr.pimAttributeCode).trim().toLowerCase()
                  );

                  return (
                    <tr key={idx} style={{ backgroundColor: hasDiscrepancy ? 'rgba(245, 158, 11, 0.06)' : 'transparent' }}>
                      <td style={{ textAlign: 'center', color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
                        {attr.cmsCategoryId}
                      </td>
                      <td>
                        <code style={{ fontFamily: 'var(--font-mono)', color: '#2563eb', fontWeight: 600, fontSize: '0.78rem', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>
                          {attr.pimAttributeCode}
                        </code>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${attr.pimMode === 'filter' ? 'badge-info' : attr.pimMode === 'text' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
                          {attr.pimMode === 'filter' ? 'Filter JSON' : attr.pimMode === 'text' ? 'Text' : 'TSKT (|)'}
                        </span>
                      </td>
                      <td>
                        <code style={{ fontFamily: 'var(--font-mono)', color: hasDiscrepancy ? '#d97706' : '#059669', fontWeight: 700, fontSize: '0.82rem' }}>
                          {attr.cmsPropertyId}
                        </code>
                        {hasDiscrepancy && <span style={{ marginLeft: '6px', color: '#d97706', fontSize: '0.7rem' }}>⚠️ Chênh lệch</span>}
                      </td>
                      <td style={{ fontWeight: 600, color: '#1e293b' }}>{attr.cmsPropertyName}</td>
                      <td style={{ textAlign: 'center' }}>
                        {attr.status === 'Confirmed' ? (
                          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}><Check size={11} /> Hoạt động</span>
                        ) : (
                          <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>Vô hiệu</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.76rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={attr.note || ''}>
                        {attr.source === 'priority2_accepted' ? (
                          <span style={{ color: '#065f46', background: '#d1fae5', border: '1px solid #10b981', padding: '2px 7px', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Check size={11} strokeWidth={3} />
                            <span>Đã duyệt Ưu tiên 2</span>
                          </span>
                        ) : attr.source === 'priority1_accepted' ? (
                          <span style={{ color: '#1e40af', background: '#eff6ff', border: '1px solid #3b82f6', padding: '2px 7px', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Check size={11} strokeWidth={3} />
                            <span>Đã duyệt Ưu tiên 1</span>
                          </span>
                        ) : attr.source === 'file_ref' ? (
                          <span style={{ color: '#475569' }}>📁 File tham chiếu (Ưu tiên 1)</span>
                        ) : (
                          attr.note || '—'
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => toggleAttrStatus(idx)}
                          className={`btn ${attr.status === 'Confirmed' ? 'btn-secondary' : 'btn-success'}`}
                          style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px' }}
                        >
                          {attr.status === 'Confirmed' ? 'Tắt' : 'Bật'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Subtab 2: Smart Auto-Mapped Attributes (Ưu tiên 2) */}
      {activeSubTab === 'smart_auto' && (
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0, color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={16} />
                <span>Thuộc Tính Nhận Diện Tự Động Từ Danh Mục CMS (Ưu tiên 2)</span>
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                Các thuộc tính này chưa có trong file tham chiếu (Ưu tiên 1), hệ thống đã tự động đối chiếu thành công sang CMS.
              </p>
            </div>

            {onAddAutoMappedRules && (
              <button
                onClick={() => onAddAutoMappedRules(autoMappedAttributes)}
                className="btn btn-success"
                style={{ padding: '6px 14px', fontSize: '0.78rem' }}
              >
                <Check size={14} />
                <span>Lưu Tất Cả ({autoMappedAttributes.length}) Thành Quy Tắc Chính Thức</span>
              </button>
            )}
          </div>

          <div className="table-scroll-container">
            <table className="custom-table" style={{ minWidth: '1000px', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '90px', textAlign: 'center' }}>NGÀNH</th>
                  <th style={{ width: '270px' }}>MÃ THUỘC TÍNH PIM</th>
                  <th style={{ width: '160px' }}>NHÃN TIẾNG VIỆT</th>
                  <th style={{ width: '130px' }}>CMS PROPERTYID</th>
                  <th style={{ width: '240px' }}>TÊN THUỘC TÍNH CMS</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>LOẠI / CƠ CHẾ</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>SỐ SẢN PHẨM</th>
                </tr>
              </thead>
              <tbody>
                {filteredAutoMapped.map((attr, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center', color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
                      {attr.cmsCategoryId}
                    </td>
                    <td>
                      <code style={{ fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: 600, fontSize: '0.78rem', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
                        {attr.pimAttributeCode}
                      </code>
                    </td>
                    <td style={{ fontWeight: 600, color: '#334155' }}>
                      {attr.pimAttributeLabel}
                    </td>
                    <td>
                      <code style={{ fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: 700, fontSize: '0.82rem' }}>
                        {attr.cmsPropertyId}
                      </code>
                    </td>
                    <td style={{ fontWeight: 600, color: '#1e293b' }}>{attr.cmsPropertyName}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${attr.pimMode === 'text' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
                        {attr.pimMode === 'text' ? 'Text' : 'TSKT / Value'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>
                      {attr.count || 1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: Discrepancies Table */}
      {activeSubTab === 'discrepancies' && (
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0, color: '#b45309' }}>
              Danh Sách Chênh Lệch Mã Cần Xác Nhận ({discrepancies.length})
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
              Bấm chọn trực tiếp mã bạn muốn áp dụng cho việc chuyển đổi dữ liệu.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {discrepancies.map((disc, idx) => {
              const currentAttr = attributeMappings.find(a => 
                String(a.cmsCategoryId).trim() === String(disc.cmsCategoryId).trim() && 
                String(a.pimAttributeCode).trim().toLowerCase() === String(disc.pimAttributeCode).trim().toLowerCase()
              );
              const p1Code = disc.priority1.cmsPropertyId;
              const p2Code = disc.priority2.cmsPropertyId;
              const isUsingP2 = currentAttr ? currentAttr.source === 'priority2_accepted' : false;

              return (
                <div key={idx} style={{
                  background: '#fffef5',
                  border: '1.5px solid #fde68a',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                  boxShadow: '0 1px 3px rgba(217,119,6,0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                      {disc.pimAttributeLabel || disc.pimAttributeCode}
                    </span>
                    <code style={{ color: '#2563eb', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #dbeafe' }}>
                      {disc.pimAttributeCode}
                    </code>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      • Ngành: <b style={{ color: '#334155' }}>{disc.cmsCategoryId} - {disc.cmsCategoryName}</b>
                    </span>
                    {/* Badge trạng thái */}
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: '6px',
                      background: isUsingP2 ? '#d1fae5' : '#dbeafe',
                      color: isUsingP2 ? '#065f46' : '#1d4ed8',
                      border: `1px solid ${isUsingP2 ? '#a7f3d0' : '#93c5fd'}`,
                      display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}>
                      <Check size={12} strokeWidth={3} />
                      <span>Đang dùng: <b>{isUsingP2 ? `P2 (${p2Code})` : `P1 (${p1Code})`}</b></span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => handleSelectDiscrepancyCode(disc, p1Code, false)}
                      style={{
                        fontSize: '0.76rem', padding: '6px 14px', borderRadius: '7px', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s ease',
                        ...(!isUsingP2 ? {
                          background: '#2563eb', color: '#fff', border: '1px solid #1d4ed8', fontWeight: 700,
                          boxShadow: '0 2px 4px rgba(37,99,235,0.3)'
                        } : {
                          background: '#fff', color: '#1e40af', border: '1.5px dashed #93c5fd', fontWeight: 600
                        })
                      }}>
                      {!isUsingP2 ? <><Check size={13} strokeWidth={3} /><span>P1: {p1Code}</span></> : <span>📁 Chọn P1: {p1Code}</span>}
                    </button>
                    <button type="button" onClick={() => handleSelectDiscrepancyCode(disc, p2Code, true)}
                      style={{
                        fontSize: '0.76rem', padding: '6px 14px', borderRadius: '7px', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s ease',
                        ...(isUsingP2 ? {
                          background: '#059669', color: '#fff', border: '1px solid #047857', fontWeight: 700,
                          boxShadow: '0 2px 4px rgba(5,150,105,0.3)'
                        } : {
                          background: '#fff', color: '#065f46', border: '1.5px dashed #86efac', fontWeight: 600
                        })
                      }}>
                      {isUsingP2 ? <><Check size={13} strokeWidth={3} /><span>P2: {p2Code}</span></> : <span>⚡ Chọn P2: {p2Code}</span>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtab 4: Categories Table */}
      {activeSubTab === 'categories' && (
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0 }}>Bảng Đối Chiếu Ngành Hàng PIM ➔ CMS</h3>
            <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
              Toàn bộ ngành hàng hợp lệ sẽ kích hoạt xử lý sản phẩm
            </span>
          </div>

          <div className="table-scroll-container">
            <table className="custom-table" style={{ minWidth: '950px', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>Mã Ngành PIM</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>MÃ CMS (ID)</th>
                  <th style={{ width: '240px' }}>Tên Ngành Hàng CMS</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ width: '120px' }}>Người Duyệt</th>
                  <th style={{ width: '110px' }}>Thời Gian</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {categoryMappings.map((cm, idx) => (
                  <tr key={idx}>
                    <td>
                      <code style={{ fontFamily: 'var(--font-mono)', color: '#2563eb', fontWeight: 600, background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>
                        {cm.pimCategoryCode}
                      </code>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <code style={{ fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: 700 }}>
                        {cm.cmsCategoryId}
                      </code>
                    </td>
                    <td style={{ fontWeight: 600, color: '#1e293b' }}>{cm.cmsCategoryName}</td>
                    <td style={{ textAlign: 'center' }}>
                      {cm.status === 'Confirmed' ? (
                        <span className="badge badge-success" style={{ fontSize: '0.72rem' }}><Check size={11} /> Đã duyệt</span>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>Chờ duyệt</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.76rem', color: '#64748b' }}>{cm.confirmedBy || 'Admin'}</td>
                    <td style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      {cm.confirmedAt ? new Date(cm.confirmedAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => toggleCatStatus(cm.pimCategoryCode)}
                        className={`btn ${cm.status === 'Confirmed' ? 'btn-secondary' : 'btn-success'}`}
                        style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '6px' }}
                      >
                        {cm.status === 'Confirmed' ? 'Hủy' : 'Duyệt'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onProceedToPreview}
          className="btn btn-primary"
          style={{ padding: '8px 18px', fontSize: '0.82rem' }}
        >
          <span>Xem Trước & Đối Soát</span>
          <ArrowRight size={15} />
        </button>
      </div>

    </div>
  );
}
