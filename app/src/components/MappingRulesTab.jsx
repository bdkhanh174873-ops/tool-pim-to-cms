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
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Quy Tắc Mapping PIM ➔ CMS</span>
              <span style={{ fontSize: '0.74rem', fontWeight: 500, color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                Ưu tiên 1: File tham chiếu | Ưu tiên 2: Nhận diện thông minh
              </span>
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
              Thuộc Tính Đã Lưu ({attributeMappings.length})
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
                <span>Nhận Diện Tự Động ({autoMappedAttributes.length})</span>
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
                <span>Chênh Lệch Mã ({discrepancies.length})</span>
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

      {/* Discrepancies Warning Banner - Single or Multiple */}
      {discrepancies.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '18px', borderColor: '#fde68a', background: '#fffef5' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="#d97706" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#92400e' }}>
                Cảnh Báo Chênh Lệch Mã Giữa File Tham Chiếu (Ưu tiên 1) và CMS Thông Minh (Ưu tiên 2):
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#b45309', background: '#fef3c7', padding: '3px 10px', borderRadius: '6px', fontWeight: 600 }}>
              Mặc định hệ thống áp dụng theo File tham chiếu (Ưu tiên 1)
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
              const isUsingPriority2 = currentAttr ? currentAttr.source === 'priority2_accepted' : false;
              const isUsingPriority1 = currentAttr ? currentAttr.source === 'priority1_accepted' : false;
              const isConfirmed = isUsingPriority1 || isUsingPriority2;
              const isUsingPriority1 = currentAttr ? currentAttr.source === 'priority1_accepted' : false;
              const isConfirmed = isUsingPriority1 || isUsingPriority2;
              const currentCode = isUsingPriority2 ? p2Code : p1Code;

              return (
                <div key={idx} style={{
                  background: isUsingPriority2 ? '#f0fdf4' : '#f8fafc',
                  border: isUsingPriority2 ? '1.5px solid #86efac' : '1.5px solid #bfdbfe',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                  boxShadow: isUsingPriority2 ? '0 1px 3px rgba(16,185,129,0.06)' : '0 1px 3px rgba(37,99,235,0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                      {disc.pimAttributeLabel || disc.priority1.cmsPropertyName}
                    </span>
                    <code style={{ color: '#2563eb', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #dbeafe' }}>
                      {disc.pimAttributeCode}
                    </code>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      • Ngành: <b style={{ color: '#334155' }}>{disc.cmsCategoryId} - {disc.cmsCategoryName}</b>
                    </span>
                    
                    {/* Active State Badge */}
                    {!isConfirmed ? (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: '6px',
                        background: '#fef3c7',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{fontSize:'12px'}}>⚠️</span>
                        <span>Chưa xác nhận (Đang bị tạm giữ)</span>
                      </span>
                    ) : isUsingPriority2 ? (
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
                        <span>Đang áp dụng: <b>Ưu tiên 2 (CMS: {p2Code})</b></span>
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
                        <span>Đang áp dụng: <b>Ưu tiên 1 (File: {p1Code})</b></span>
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Priority 1 Button */}
                    <button
                      type="button"
                      onClick={() => handleSelectDiscrepancyCode(disc, p1Code, false)}
                      style={{
                        fontSize: '0.76rem',
                        padding: '6px 14px',
                        borderRadius: '7px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                        ...(isUsingPriority1 ? {
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
                      title={isUsingPriority1 ? 'Đang áp dụng theo File tham chiếu (Ưu tiên 1)' : 'Chuyển sang áp dụng theo File tham chiếu (Ưu tiên 1)'}
                    >
                      {isUsingPriority1 ? (
                        <>
                          <Check size={13} strokeWidth={3} />
                          <span>✔ Đã chọn: Ưu tiên 1 (File: {p1Code})</span>
                        </>
                      ) : (
                        <span>📁 Chọn Ưu tiên 1 (File: {p1Code})</span>
                      )}
                    </button>

                    {/* Priority 2 Button */}
                    <button
                      type="button"
                      onClick={() => handleSelectDiscrepancyCode(disc, p2Code, true)}
                      style={{
                        fontSize: '0.76rem',
                        padding: '6px 14px',
                        borderRadius: '7px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                        ...(isUsingPriority2 ? {
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
                      title={isUsingPriority2 ? 'Đang áp dụng theo CMS thông minh (Ưu tiên 2)' : 'Chuyển sang áp dụng theo CMS thông minh (Ưu tiên 2)'}
                    >
                      {isUsingPriority2 ? (
                        <>
                          <Check size={13} strokeWidth={3} />
                          <span>✔ Đã chọn: Ưu tiên 2 (CMS: {p2Code})</span>
                        </>
                      ) : (
                        <span>⚡ Chọn Ưu tiên 2 (CMS: {p2Code})</span>
                      )}
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
              const isUsingPriority2 = currentAttr ? currentAttr.source === 'priority2_accepted' : false;

              return (
                <div key={idx} style={{
                  background: isUsingPriority2 ? '#f0fdf4' : '#f8fafc',
                  border: isUsingPriority2 ? '1.5px solid #86efac' : '1.5px solid #bfdbfe',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                  boxShadow: isUsingPriority2 ? '0 1px 3px rgba(16,185,129,0.06)' : '0 1px 3px rgba(37,99,235,0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                      {disc.pimAttributeLabel || disc.priority1.cmsPropertyName}
                    </span>
                    <code style={{ color: '#2563eb', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #dbeafe' }}>
                      {disc.pimAttributeCode}
                    </code>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      • Ngành: <b style={{ color: '#334155' }}>{disc.cmsCategoryId} - {disc.cmsCategoryName}</b>
                    </span>

                    {/* Active State Badge */}
                    {!isConfirmed ? (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: '6px',
                        background: '#fef3c7',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{fontSize:'12px'}}>⚠️</span>
                        <span>Chưa xác nhận (Đang bị tạm giữ)</span>
                      </span>
                    ) : isUsingPriority2 ? (
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Priority 1 Button */}
                    <button
                      type="button"
                      onClick={() => handleSelectDiscrepancyCode(disc, p1Code, false)}
                      style={{
                        fontSize: '0.76rem',
                        padding: '6px 14px',
                        borderRadius: '7px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                        ...(isUsingPriority1 ? {
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
                      title={isUsingPriority1 ? 'Đang áp dụng theo File tham chiếu (Ưu tiên 1)' : 'Chuyển sang áp dụng theo File tham chiếu (Ưu tiên 1)'}
                    >
                      {isUsingPriority1 ? (
                        <>
                          <Check size={13} strokeWidth={3} />
                          <span>✔ Đã chọn: Ưu tiên 1 (File: {p1Code})</span>
                        </>
                      ) : (
                        <span>📁 Chọn Ưu tiên 1 (File: {p1Code})</span>
                      )}
                    </button>

                    {/* Priority 2 Button */}
                    <button
                      type="button"
                      onClick={() => handleSelectDiscrepancyCode(disc, p2Code, true)}
                      style={{
                        fontSize: '0.76rem',
                        padding: '6px 14px',
                        borderRadius: '7px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                        ...(isUsingPriority2 ? {
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
                      title={isUsingPriority2 ? 'Đang áp dụng theo CMS thông minh (Ưu tiên 2)' : 'Chuyển sang áp dụng theo CMS thông minh (Ưu tiên 2)'}
                    >
                      {isUsingPriority2 ? (
                        <>
                          <Check size={13} strokeWidth={3} />
                          <span>✔ Đã chọn: Ưu tiên 2 (CMS: {p2Code})</span>
                        </>
                      ) : (
                        <span>⚡ Chọn Ưu tiên 2 (CMS: {p2Code})</span>
                      )}
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
      <div className="glass-panel" style={{ padding: '14px 20px', marginTop: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Hệ thống ưu tiên số 1 cho file tham chiếu. Các thuộc tính thiếu sẽ được tự động nhận diện theo Ưu tiên 2.
        </div>

        <button
          onClick={onProceedToPreview}
          className="btn btn-primary"
          style={{ padding: '8px 18px', fontSize: '0.82rem' }}
        >
          <span>Chạy Chuyển Đổi & Xem Trước</span>
          <ArrowRight size={15} />
        </button>
      </div>

    </div>
  );
}
