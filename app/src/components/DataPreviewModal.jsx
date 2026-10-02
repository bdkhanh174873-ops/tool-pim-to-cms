import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Filter, 
  Download,
  FileSpreadsheet,
  Plus,
  Edit2,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { 
  rebuildCMSCatalogFromRows, 
  rebuildPIMOptionsFromList, 
  rebuildCategoryMappingFromRows,
  rebuildCMSValueTemplateFromRows,
  exportDatasetToExcel 
} from '../services/excelParser';
import { useNotification } from '../context/NotificationContext';

function extractCmsCatalogRows(data) {
  if (!data) return [];
  if (Array.isArray(data.rawTableRows) && data.rawTableRows.length > 0) {
    return data.rawTableRows.map(r => ({ ...r }));
  }
  // Fallback: extract from properties Map or Object
  const rows = [];
  const propList = data.properties instanceof Map
    ? Array.from(data.properties.values())
    : (data.properties && typeof data.properties === 'object' ? Object.values(data.properties) : []);

  for (const p of propList) {
    if (!p.values || p.values.length === 0) {
      rows.push({
        categoryId: p.categoryId || '',
        categoryName: p.categoryName || '',
        propertyId: p.propertyId || '',
        propertyName: p.propertyName || '',
        propertyType: p.propertyType !== undefined && p.propertyType !== null ? p.propertyType : 1,
        valueId: '',
        valueName: ''
      });
    } else {
      for (const v of p.values) {
        rows.push({
          categoryId: p.categoryId || '',
          categoryName: p.categoryName || '',
          propertyId: p.propertyId || '',
          propertyName: p.propertyName || '',
          propertyType: p.propertyType !== undefined && p.propertyType !== null ? p.propertyType : 1,
          valueId: v.valId || '',
          valueName: v.valName || v.rawValue || ''
        });
      }
    }
  }
  return rows;
}

function extractPimOptionList(data) {
  if (!data) return [];
  if (Array.isArray(data.optionsList) && data.optionsList.length > 0) {
    return data.optionsList.map(o => ({ ...o }));
  }
  // Fallback: extract from optionsMap (Map or Object)
  const mapValues = data.optionsMap instanceof Map
    ? Array.from(data.optionsMap.values())
    : (data.optionsMap && typeof data.optionsMap === 'object' ? Object.values(data.optionsMap) : []);
  return mapValues.map(item => ({
    code: item.code || '',
    name: item.name || '',
    optionCode: item.optionCode || '',
    optionValue: item.optionValue || '',
    isActivated: item.isActivated !== undefined ? Boolean(item.isActivated) : true
  }));
}

function extractMappingRefList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data.map(m => ({ ...m }));
  if (Array.isArray(data.mappings)) return data.mappings.map(m => ({ ...m }));
  return [];
}

function extractCatMappingRefRows(data) {
  if (!data) return [];
  if (Array.isArray(data.mappings)) return data.mappings.map(m => ({ ...m }));
  if (Array.isArray(data)) return data.map(m => ({ ...m }));
  return [];
}

function extractCmsTemplateRows(data) {
  if (!data) return [];
  if (Array.isArray(data.sampleRows)) return data.sampleRows.map(r => [...r]);
  return [];
}

function extractCmsValueTemplateRows(data) {
  if (!data) return [];
  if (Array.isArray(data.sampleRows)) {
    return data.sampleRows.map(r => {
      if (Array.isArray(r)) {
        return {
          propertyId: r[0] ?? '',
          value: r[1] ?? '',
          displayOrder: r[2] ?? 3,
          isSearch: r[3] ?? 0,
          compareValue: r[4] ?? 0,
          isExistPro: r[5] ?? 0,
          createdUser: r[6] ?? ''
        };
      }
      return { ...r };
    });
  }
  return [];
}

export default function DataPreviewModal({
  isOpen,
  onClose,
  title,
  fileName,
  fileType, // 'cmsCatalog' | 'pimOption' | 'mappingRef' | 'catMappingRef' | 'cmsTemplate' | 'cmsValueTemplate' | 'pimProduct'
  data, // parsed data object
  onDownloadFile,
  onSaveDataset // fn(fileType, updatedParsedData, updatedSummary)
}) {
  const notify = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Local working copy of items for editing
  const [workingItems, setWorkingItems] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatusMsg, setSaveStatusMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Form Modal State for Add / Edit
  const [formOpen, setFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // null = Add, number = Edit
  const [formData, setFormData] = useState({});

  // Initialize or reset workingItems when modal opens or data changes
  useEffect(() => {
    if (!isOpen || !data) {
      setWorkingItems([]);
      setHasUnsavedChanges(false);
      setSaveStatusMsg('');
      setFormOpen(false);
      return;
    }

    if (fileType === 'cmsCatalog') {
      const rows = extractCmsCatalogRows(data);
      setWorkingItems(rows);
    } else if (fileType === 'pimOption') {
      const list = extractPimOptionList(data);
      setWorkingItems(list);
    } else if (fileType === 'mappingRef') {
      const list = extractMappingRefList(data);
      setWorkingItems(list);
    } else if (fileType === 'catMappingRef') {
      const list = extractCatMappingRefRows(data);
      setWorkingItems(list);
    } else if (fileType === 'cmsTemplate') {
      const rows = extractCmsTemplateRows(data);
      setWorkingItems(rows);
    } else if (fileType === 'cmsValueTemplate') {
      const rows = extractCmsValueTemplateRows(data);
      setWorkingItems(rows);
    } else if (fileType === 'pimProduct') {
      const list = data.products ? [...data.products] : [];
      setWorkingItems(list);
    }
    setHasUnsavedChanges(false);
    setCurrentPage(1);
    setSearchTerm('');
  }, [isOpen, data, fileType]);

  // Handle ESC key to quickly close modal or inner form
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        if (formOpen) {
          // Close inner form dialog first if open
          setFormOpen(false);
        } else {
          // Close main data preview modal
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, formOpen, onClose]);

  // Headers definition
  const tableHeaders = useMemo(() => {
    if (fileType === 'cmsCatalog') {
      return ['CATEGORYID', 'TÊN NGÀNH HÀNG', 'PROPERTYID', 'TÊN THUỘC TÍNH', 'LOẠI', 'VALUEID', 'GIÁ TRỊ (VALUE)'];
    } else if (fileType === 'pimOption') {
      return ['MÃ THUỘC TÍNH (CODE)', 'TÊN THUỘC TÍNH', 'OPTION CODE', 'GIÁ TRỊ (OPTION VALUE)', 'KÍCH HOẠT'];
    } else if (fileType === 'mappingRef') {
      return ['MÃ NGÀNH CMS', 'TÊN NGÀNH CMS', 'MÃ THUỘC TÍNH CMS', 'TÊN THUỘC TÍNH CMS', 'MÃ THUỘC TÍNH PIM'];
    } else if (fileType === 'catMappingRef') {
      return ['MÃ PIM (CATEGORY_CODE)', 'ID NH CMS', 'TÊN NGÀNH HÀNG CMS', 'MÃ HỌ SẢN PHẨM', 'TÊN HỌ SẢN PHẨM', 'NH CHÍNH'];
    } else if (fileType === 'cmsTemplate') {
      return data?.headers || ['PRODUCTID', 'PROPERTYID', 'PROPVALUEID', 'LANGUAGEID', 'USERNAME', 'FULLNAME', 'SITEID'];
    } else if (fileType === 'cmsValueTemplate') {
      return ['Propertyid', 'Value', 'Displayorder', 'Issearch', 'Comparevalue', 'Isexistpro', 'Createduser'];
    } else if (fileType === 'pimProduct') {
      const baseHeaders = ['DÒNG', 'FILE NGUỒN', 'ID CMS (model_id_cms)', 'MÃ MODEL PIM (model_code)', 'MÃ SKU', 'MÃ NGÀNH PIM'];
      if (data && Array.isArray(data.headers)) {
        const specialCols = ['model_id_cms', 'model_code', 'sku', 'category_code'];
        const extraCols = data.headers.filter(h => !specialCols.includes(h.toLowerCase()));
        return [...baseHeaders, ...extraCols];
      }
      return baseHeaders;
    }
    return [];
  }, [fileType, data]);

  // Format a row item to cells array for rendering
  const formatItemToCells = (item) => {
    if (!item) return [];
    if (fileType === 'cmsCatalog') {
      return [
        item.categoryId || '',
        item.categoryName || '',
        item.propertyId || '',
        item.propertyName || '',
        item.propertyType === 0 ? 'Text (0)' : item.propertyType === 1 ? 'Single (1)' : item.propertyType === 2 ? 'Multi (2)' : String(item.propertyType ?? ''),
        item.valueId || '(Trống)',
        item.valueName || '(Trống)'
      ];
    } else if (fileType === 'pimOption') {
      return [
        item.code || '',
        item.name || '',
        item.optionCode || '',
        item.optionValue || '',
        item.isActivated ? 'True' : 'False'
      ];
    } else if (fileType === 'mappingRef') {
      return [
        item.cmsCategoryId || '',
        item.cmsCategoryName || '',
        item.cmsPropertyId || '',
        item.cmsPropertyName || '',
        item.pimAttributeCode || ''
      ];
    } else if (fileType === 'catMappingRef') {
      return [
        item.pimCategoryCode || '',
        item.cmsCategoryId || '',
        item.cmsCategoryName || '',
        item.familyCode || '',
        item.familyName || '',
        item.mainCategory || ''
      ];
    } else if (fileType === 'cmsTemplate') {
      return Array.isArray(item) ? item : [];
    } else if (fileType === 'cmsValueTemplate') {
      return [
        item.propertyId !== undefined ? item.propertyId : (item[0] ?? ''),
        item.value !== undefined ? item.value : (item[1] ?? ''),
        item.displayOrder !== undefined ? item.displayOrder : (item[2] ?? 3),
        item.isSearch !== undefined ? item.isSearch : (item[3] ?? 0),
        item.compareValue !== undefined ? item.compareValue : (item[4] ?? 0),
        item.isExistPro !== undefined ? item.isExistPro : (item[5] ?? 0),
        item.createdUser !== undefined ? item.createdUser : (item[6] ?? '')
      ];
    } else if (fileType === 'pimProduct') {
      const baseCells = [
        item.rowIndex || '',
        item.fileOrigin || data?.fileName || '',
        item.cms_product_id || '(Trống)',
        item.model_code || '',
        item.sku || '(Không có)',
        item.category_code || ''
      ];
      if (data && Array.isArray(data.headers)) {
        const specialCols = ['model_id_cms', 'model_code', 'sku', 'category_code'];
        const extraCols = data.headers.filter(h => !specialCols.includes(h.toLowerCase()));
        const extraCells = extraCols.map(col => {
          const val = item.rawAttributes ? item.rawAttributes[col] : '';
          return val !== undefined && val !== null ? String(val) : '';
        });
        return [...baseCells, ...extraCells];
      }
      return baseCells;
    }
    return [];
  };

  // Filter items by searchTerm
  const filteredIndexedItems = useMemo(() => {
    if (!workingItems) return [];
    return workingItems
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const cells = formatItemToCells(item);
        return cells.some(cell => String(cell || '').toLowerCase().includes(term));
      });
  }, [workingItems, searchTerm, fileType]);

  // Pagination calculation
  const totalRows = filteredIndexedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredIndexedItems.slice(start, start + pageSize);
  }, [filteredIndexedItems, safePage, pageSize]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // ==========================================
  // ACTIONS: ADD, EDIT, DELETE
  // ==========================================

  const handleOpenAddModal = () => {
    setEditingIndex(null);
    if (fileType === 'cmsCatalog') {
      setFormData({
        categoryId: '9499',
        categoryName: 'Adapter sạc',
        propertyId: '',
        propertyName: '',
        propertyType: 1,
        valueId: '',
        valueName: ''
      });
    } else if (fileType === 'pimOption') {
      setFormData({
        code: '',
        name: '',
        optionCode: '',
        optionValue: '',
        isActivated: true
      });
    } else if (fileType === 'mappingRef') {
      setFormData({
        cmsCategoryId: '9499',
        cmsCategoryName: 'Adapter sạc',
        cmsPropertyId: '',
        cmsPropertyName: '',
        pimAttributeCode: '',
        pimAttributeName: ''
      });
    } else if (fileType === 'catMappingRef') {
      setFormData({
        pimCategoryCode: '',
        cmsCategoryId: '',
        cmsCategoryName: '',
        familyCode: '',
        familyName: '',
        mainCategory: ''
      });
    } else if (fileType === 'cmsTemplate') {
      setFormData({
        col_0: '',
        col_1: '',
        col_2: '',
        col_3: 'vi-VN',
        col_4: '174873',
        col_5: 'Quản trị viên',
        col_6: '2'
      });
    } else if (fileType === 'cmsValueTemplate') {
      setFormData({
        propertyId: '',
        value: '',
        displayOrder: 3,
        isSearch: 0,
        compareValue: 0,
        isExistPro: 0,
        createdUser: '174873'
      });
    }
    setFormOpen(true);
  };

  const handleOpenEditModal = (originalIndex) => {
    setEditingIndex(originalIndex);
    const item = workingItems[originalIndex];
    if (!item) return;

    if (fileType === 'cmsCatalog') {
      setFormData({
        categoryId: item.categoryId || '',
        categoryName: item.categoryName || '',
        propertyId: item.propertyId || '',
        propertyName: item.propertyName || '',
        propertyType: item.propertyType ?? 1,
        valueId: item.valueId || '',
        valueName: item.valueName || ''
      });
    } else if (fileType === 'pimOption') {
      setFormData({
        code: item.code || '',
        name: item.name || '',
        optionCode: item.optionCode || '',
        optionValue: item.optionValue || '',
        isActivated: Boolean(item.isActivated)
      });
    } else if (fileType === 'mappingRef') {
      setFormData({
        cmsCategoryId: item.cmsCategoryId || '',
        cmsCategoryName: item.cmsCategoryName || '',
        cmsPropertyId: item.cmsPropertyId || '',
        cmsPropertyName: item.cmsPropertyName || '',
        pimAttributeCode: item.pimAttributeCode || '',
        pimAttributeName: item.pimAttributeName || ''
      });
    } else if (fileType === 'catMappingRef') {
      setFormData({
        pimCategoryCode: item.pimCategoryCode || '',
        cmsCategoryId: item.cmsCategoryId || '',
        cmsCategoryName: item.cmsCategoryName || '',
        familyCode: item.familyCode || '',
        familyName: item.familyName || '',
        mainCategory: item.mainCategory || ''
      });
    } else if (fileType === 'cmsTemplate') {
      setFormData({
        col_0: item[0] || '',
        col_1: item[1] || '',
        col_2: item[2] || '',
        col_3: item[3] || 'vi-VN',
        col_4: item[4] || '',
        col_5: item[5] || '',
        col_6: item[6] || ''
      });
    } else if (fileType === 'cmsValueTemplate') {
      setFormData({
        propertyId: item.propertyId !== undefined ? item.propertyId : (item[0] || ''),
        value: item.value !== undefined ? item.value : (item[1] || ''),
        displayOrder: item.displayOrder !== undefined ? item.displayOrder : (item[2] ?? 3),
        isSearch: item.isSearch !== undefined ? item.isSearch : (item[3] ?? 0),
        compareValue: item.compareValue !== undefined ? item.compareValue : (item[4] ?? 0),
        isExistPro: item.isExistPro !== undefined ? item.isExistPro : (item[5] ?? 0),
        createdUser: item.createdUser !== undefined ? item.createdUser : (item[6] || '174873')
      });
    }
    setFormOpen(true);
  };

  const handleDeleteRow = async (originalIndex) => {
    const confirmed = await notify.confirm({
      title: 'Xác nhận xóa dòng',
      message: `Bạn có chắc chắn muốn xóa dòng số #${originalIndex + 1} này không? Thao tác này sẽ cập nhật trên bảng tạm.`,
      type: 'danger',
      confirmText: 'Xóa dòng',
      cancelText: 'Hủy'
    });
    if (confirmed) {
      const updated = [...workingItems];
      updated.splice(originalIndex, 1);
      setWorkingItems(updated);
      setHasUnsavedChanges(true);
      setSaveStatusMsg('⚠️ Đã xóa 1 dòng. Hãy bấm "Lưu thay đổi vào DB" để cập nhật lâu dài.');
      notify.info(`Đã xóa dòng #${originalIndex + 1} khỏi bảng tạm.`);
    }
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    const updated = [...workingItems];

    if (fileType === 'cmsCatalog') {
      const newItem = {
        categoryId: String(formData.categoryId || '').trim(),
        categoryName: String(formData.categoryName || '').trim(),
        propertyId: String(formData.propertyId || '').trim(),
        propertyName: String(formData.propertyName || '').trim(),
        propertyType: formData.propertyType !== '' ? Number(formData.propertyType) : 1,
        valueId: String(formData.valueId || '').trim(),
        valueName: String(formData.valueName || '').trim()
      };
      if (!newItem.categoryId || !newItem.propertyId || !newItem.propertyName) {
        notify.warning('Vui lòng điền đủ CATEGORYID, PROPERTYID và TÊN THUỘC TÍNH.');
        return;
      }
      if (editingIndex === null) {
        updated.unshift(newItem); // Add to top
      } else {
        updated[editingIndex] = newItem;
      }
    } else if (fileType === 'pimOption') {
      const newItem = {
        code: String(formData.code || '').trim(),
        name: String(formData.name || '').trim(),
        optionCode: String(formData.optionCode || '').trim(),
        optionValue: String(formData.optionValue || '').trim(),
        isActivated: Boolean(formData.isActivated)
      };
      if (!newItem.code || !newItem.optionCode || !newItem.optionValue) {
        notify.warning('Vui lòng điền đủ Mã thuộc tính (Code), OptionCode và Giá trị (OptionValue).');
        return;
      }
      if (editingIndex === null) {
        updated.unshift(newItem);
      } else {
        updated[editingIndex] = newItem;
      }
    } else if (fileType === 'mappingRef') {
      const newItem = {
        cmsCategoryId: String(formData.cmsCategoryId || '').trim(),
        cmsCategoryName: String(formData.cmsCategoryName || '').trim(),
        cmsPropertyId: String(formData.cmsPropertyId || '').trim(),
        cmsPropertyName: String(formData.cmsPropertyName || '').trim(),
        pimAttributeCode: String(formData.pimAttributeCode || '').trim(),
        pimAttributeName: String(formData.pimAttributeName || '').trim()
      };
      if (!newItem.cmsCategoryId || !newItem.cmsPropertyId || !newItem.pimAttributeCode) {
        notify.warning('Vui lòng điền đủ Mã ngành CMS, Mã thuộc tính CMS và Mã thuộc tính PIM.');
        return;
      }
      if (editingIndex === null) {
        updated.unshift(newItem);
      } else {
        updated[editingIndex] = newItem;
      }
    } else if (fileType === 'catMappingRef') {
      const newItem = {
        pimCategoryCode: String(formData.pimCategoryCode || '').trim(),
        cmsCategoryId: String(formData.cmsCategoryId || '').trim(),
        cmsCategoryName: String(formData.cmsCategoryName || '').trim(),
        familyCode: String(formData.familyCode || '').trim(),
        familyName: String(formData.familyName || '').trim(),
        mainCategory: String(formData.mainCategory || '').trim()
      };
      if (!newItem.pimCategoryCode && !newItem.cmsCategoryId) {
        notify.warning('Vui lòng điền tối thiểu Mã PIM hoặc ID Ngành CMS.');
        return;
      }
      if (editingIndex === null) {
        updated.unshift(newItem);
      } else {
        updated[editingIndex] = newItem;
      }
    } else if (fileType === 'cmsTemplate') {
      const newRow = [
        String(formData.col_0 || '').trim(),
        String(formData.col_1 || '').trim(),
        String(formData.col_2 || '').trim(),
        String(formData.col_3 || 'vi-VN').trim(),
        String(formData.col_4 || '').trim(),
        String(formData.col_5 || '').trim(),
        String(formData.col_6 || '').trim()
      ];
      if (!newRow[0] || !newRow[1]) {
        notify.warning('Vui lòng điền tối thiểu PRODUCTID và PROPERTYID.');
        return;
      }
      if (editingIndex === null) {
        updated.unshift(newRow);
      } else {
        updated[editingIndex] = newRow;
      }
    } else if (fileType === 'cmsValueTemplate') {
      const propId = isNaN(Number(formData.propertyId)) ? String(formData.propertyId || '').trim() : Number(formData.propertyId);
      const valText = String(formData.value || '').trim();
      if (!propId || !valText) {
        notify.warning('Vui lòng điền tối thiểu Propertyid và Value.');
        return;
      }
      const newItem = {
        propertyId: propId,
        value: valText,
        displayOrder: Number(formData.displayOrder ?? 3),
        isSearch: Number(formData.isSearch ?? 0),
        compareValue: Number(formData.compareValue ?? 0),
        isExistPro: Number(formData.isExistPro ?? 0),
        createdUser: isNaN(Number(formData.createdUser)) ? String(formData.createdUser || '').trim() : Number(formData.createdUser)
      };
      if (editingIndex === null) {
        updated.unshift(newItem);
      } else {
        updated[editingIndex] = newItem;
      }
    }

    setWorkingItems(updated);
    setHasUnsavedChanges(true);
    setFormOpen(false);
    setSaveStatusMsg('⚠️ Dữ liệu đã thay đổi trên bảng tạm. Hãy bấm "Lưu thay đổi vào DB" để lưu vĩnh viễn.');
    notify.success('Đã cập nhật dòng dữ liệu vào bảng tạm!', 'Thành công');
  };

  // ==========================================
  // SAVE ALL CHANGES TO INDEXED DB
  // ==========================================
  const handleSaveToIndexedDB = async () => {
    if (!onSaveDataset) {
      notify.error('Không tìm thấy hàm lưu dataset.');
      return;
    }

    setIsSaving(true);
    try {
      let updatedParsedData = null;
      let updatedSummary = {};

      if (fileType === 'cmsCatalog') {
        updatedParsedData = rebuildCMSCatalogFromRows(workingItems);
        updatedSummary = {
          categoriesCount: updatedParsedData.categories.length,
          propertiesCount: updatedParsedData.properties.size,
          totalRows: workingItems.length
        };
      } else if (fileType === 'pimOption') {
        updatedParsedData = rebuildPIMOptionsFromList(workingItems);
        updatedSummary = { totalOptions: workingItems.length };
      } else if (fileType === 'mappingRef') {
        updatedParsedData = workingItems;
        updatedSummary = { count: workingItems.length };
      } else if (fileType === 'catMappingRef') {
        updatedParsedData = rebuildCategoryMappingFromRows(workingItems);
        updatedSummary = { count: updatedParsedData.mappings.length };
      } else if (fileType === 'cmsTemplate') {
        updatedParsedData = {
          ...data,
          sampleRows: workingItems,
          sampleRowsCount: workingItems.length
        };
        updatedSummary = {
          sheetName: data?.sheetName || 'Import tên rút gọn ',
          headersCount: data?.headers?.length || 7,
          sampleRowsCount: workingItems.length
        };
      } else if (fileType === 'cmsValueTemplate') {
        updatedParsedData = rebuildCMSValueTemplateFromRows(workingItems);
        updatedSummary = {
          sheetName: 'Sheet1',
          headersCount: 7,
          sampleRowsCount: workingItems.length,
          defaultConfig: {
            displayOrder: Number(workingItems[0]?.displayOrder ?? 3),
            isSearch: Number(workingItems[0]?.isSearch ?? 0),
            compareValue: Number(workingItems[0]?.compareValue ?? 0),
            isExistPro: Number(workingItems[0]?.isExistPro ?? 0),
            createdUser: String(workingItems[0]?.createdUser ?? '174873')
          }
        };
      } else {
        notify.warning('Chế độ lưu chỉ áp dụng cho các tập dữ liệu nền tảng.');
        setIsSaving(false);
        return;
      }

      const success = await onSaveDataset(fileType, updatedParsedData, updatedSummary);
      if (success) {
        setHasUnsavedChanges(false);
        setSaveStatusMsg('✅ Đã lưu thành công toàn bộ thay đổi vào cơ sở dữ liệu IndexedDB!');
        notify.success('Đã lưu thành công toàn bộ thay đổi vào cơ sở dữ liệu IndexedDB!', 'Lưu thành công');
        setTimeout(() => setSaveStatusMsg(''), 4000);
      }
    } catch (err) {
      notify.error('Lỗi lưu dữ liệu: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Export current edited dataset to Excel
  const handleExportCurrentToExcel = () => {
    try {
      let exportObj = data;
      if (fileType === 'cmsCatalog') {
        exportObj = { rawTableRows: workingItems };
      } else if (fileType === 'pimOption') {
        exportObj = { optionsList: workingItems };
      } else if (fileType === 'mappingRef') {
        exportObj = workingItems;
      } else if (fileType === 'catMappingRef') {
        exportObj = { mappings: workingItems };
      } else if (fileType === 'cmsTemplate') {
        exportObj = { ...data, sampleRows: workingItems };
      } else if (fileType === 'cmsValueTemplate') {
        exportObj = { headers: ['Propertyid', 'Value', 'Displayorder', 'Issearch', 'Comparevalue', 'Isexistpro', 'Createduser'], sampleRows: workingItems };
      }
      exportDatasetToExcel(fileType, exportObj, `${fileType}_da_chinh_sua.xlsx`);
      notify.success('Đã xuất file Excel dữ liệu đã chỉnh sửa thành công!');
    } catch (err) {
      notify.error('Lỗi xuất file Excel: ' + err.message);
    }
  };

  const handleCloseModal = async () => {
    if (hasUnsavedChanges) {
      const confirmed = await notify.confirm({
        title: 'Chưa lưu thay đổi',
        message: 'Bạn có các thay đổi chưa được lưu vào cơ sở dữ liệu. Bạn có chắc chắn muốn đóng mà không lưu không?',
        type: 'warning',
        confirmText: 'Vẫn đóng',
        cancelText: 'Ở lại tiếp tục'
      });
      if (confirmed) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen || !data) return null;

  const isEditable = fileType !== 'pimProduct';

  return createPortal(
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
      <div 
        className="glass-panel animate-fade-in" 
        style={{
          width: '95vw',
          maxWidth: '1320px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        
        {/* Modal Top Bar */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
            }}>
              <FileSpreadsheet size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '1.18rem', fontWeight: 700, color: '#0f172a' }}>
                  {title}
                </h3>
                <span className="badge badge-info" style={{ fontSize: '0.74rem' }}>
                  {workingItems.length.toLocaleString()} dòng
                </span>
                {hasUnsavedChanges && (
                  <span className="badge badge-warning" style={{ fontSize: '0.74rem', animation: 'pulse 2s infinite' }}>
                    <AlertTriangle size={12} /> Có thay đổi chưa lưu
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                Tệp: <code style={{ color: '#0369a1', backgroundColor: '#f0f9ff', padding: '1px 6px', borderRadius: '4px', border: '1px solid #bae6fd', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fileName}</code>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            
            {/* Add New Row Button */}
            {isEditable && (
              <button
                onClick={handleOpenAddModal}
                className="btn btn-secondary"
                style={{ 
                  fontSize: '0.8rem', 
                  padding: '7px 14px', 
                  background: '#eff6ff', 
                  border: '1px solid #bfdbfe', 
                  color: '#1d4ed8',
                  fontWeight: 600
                }}
                title="Thêm một dòng dữ liệu mới"
              >
                <Plus size={15} color="#2563eb" />
                <span>Thêm dòng mới</span>
              </button>
            )}

            {/* Save All to IndexedDB */}
            {isEditable && (
              <button
                onClick={handleSaveToIndexedDB}
                disabled={isSaving || !hasUnsavedChanges}
                className={hasUnsavedChanges ? "btn btn-primary" : "btn btn-secondary"}
                style={{
                  fontSize: '0.8rem',
                  padding: '7px 16px',
                  background: hasUnsavedChanges 
                    ? 'var(--accent-gradient)' 
                    : '#f1f5f9',
                  border: hasUnsavedChanges ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
                  color: hasUnsavedChanges ? '#ffffff' : '#64748b',
                  fontWeight: 600,
                  cursor: hasUnsavedChanges ? 'pointer' : 'default',
                  opacity: 1,
                  boxShadow: hasUnsavedChanges ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none'
                }}
                title="Lưu toàn bộ thay đổi vào cơ sở dữ liệu IndexedDB"
              >
                <Save size={15} color={hasUnsavedChanges ? '#ffffff' : '#64748b'} />
                <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi vào DB'}</span>
              </button>
            )}

            {/* Export Edited to Excel */}
            <button
              onClick={handleExportCurrentToExcel}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '7px 12px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 600 }}
              title="Tải bảng dữ liệu hiện tại về file Excel"
            >
              <Download size={14} />
              <span>Tải Excel</span>
            </button>

            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="btn btn-secondary"
              style={{ padding: '6px 8px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#475569' }}
              title="Đóng cửa sổ"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status Message Notification Bar */}
        {saveStatusMsg && (
          <div style={{
            background: saveStatusMsg.startsWith('✅') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '8px 24px',
            fontSize: '0.82rem',
            color: saveStatusMsg.startsWith('✅') ? '#34d399' : '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{saveStatusMsg}</span>
            {hasUnsavedChanges && (
              <button 
                onClick={handleSaveToIndexedDB} 
                className="btn btn-primary" 
                style={{ fontSize: '0.74rem', padding: '3px 10px', background: '#10b981', borderColor: '#059669' }}
              >
                Lưu ngay
              </button>
            )}
          </div>
        )}

        {/* Modal Filter & Pagination Controls */}
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          background: '#f8fafc'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Tìm kiếm trong toàn bộ bảng..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%', paddingLeft: '32px', fontSize: '0.82rem' }}
            />
          </div>

          {/* Pagination Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            
            {/* Page Size Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#475569' }}>
              <span>Hiển thị:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ padding: '5px 8px', fontSize: '0.8rem', width: '120px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '6px' }}
              >
                <option value={50}>50 dòng/trang</option>
                <option value={100}>100 dòng/trang</option>
                <option value={200}>200 dòng/trang</option>
                <option value={500}>500 dòng/trang</option>
              </select>
            </div>

            {/* Page Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => handlePageChange(1)}
                disabled={safePage <= 1}
                className="btn btn-secondary"
                style={{ padding: '6px 8px', border: '1px solid #cbd5e1', color: '#334155', opacity: safePage <= 1 ? 0.35 : 1 }}
                title="Về trang đầu"
              >
                <ChevronsLeft size={15} />
              </button>
              <button
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage <= 1}
                className="btn btn-secondary"
                style={{ padding: '6px 8px', border: '1px solid #cbd5e1', color: '#334155', opacity: safePage <= 1 ? 0.35 : 1 }}
                title="Trang trước"
              >
                <ChevronLeft size={15} />
              </button>

              <span style={{ fontSize: '0.82rem', padding: '0 8px', color: '#0f172a', fontWeight: 700, minWidth: '90px', textAlign: 'center' }}>
                Trang {safePage} / {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage >= totalPages}
                className="btn btn-secondary"
                style={{ padding: '6px 8px', border: '1px solid #cbd5e1', color: '#334155', opacity: safePage >= totalPages ? 0.35 : 1 }}
                title="Trang kế tiếp"
              >
                <ChevronRight size={15} />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={safePage >= totalPages}
                className="btn btn-secondary"
                style={{ padding: '6px 8px', border: '1px solid #cbd5e1', color: '#334155', opacity: safePage >= totalPages ? 0.35 : 1 }}
                title="Về trang cuối"
              >
                <ChevronsRight size={15} />
              </button>
            </div>

          </div>
        </div>

        {/* Modal Table Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 20px 24px' }}>
          {totalRows === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
              <p>Không tìm thấy dòng dữ liệu nào khớp với từ khóa "{searchTerm}".</p>
            </div>
          ) : (
            <table className="custom-table" style={{ fontSize: '0.8rem', marginTop: '16px' }}>
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>STT</th>
                  {tableHeaders.map((header, idx) => (
                    <th key={idx}>{header}</th>
                  ))}
                  {isEditable && (
                    <th style={{ width: '110px', textAlign: 'center' }}>Hành Động</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map(({ item, originalIndex }, rowIdx) => {
                  const cells = formatItemToCells(item);

                  return (
                    <tr key={originalIndex} style={{ transition: 'background 0.15s ease' }}>
                      <td style={{ textAlign: 'center', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        {(safePage - 1) * pageSize + rowIdx + 1}
                      </td>
                      {cells.map((cell, cIdx) => (
                        <td key={cIdx}>
                          {cIdx === 0 && fileType === 'cmsCatalog' ? (
                            <b style={{ color: '#b45309', fontFamily: 'var(--font-mono)' }}>{cell}</b>
                          ) : cIdx === 2 && fileType === 'cmsCatalog' ? (
                            <b style={{ color: '#2563eb', fontFamily: 'var(--font-mono)' }}>{cell}</b>
                          ) : cIdx === 5 && fileType === 'cmsCatalog' ? (
                            <b style={{ color: '#059669', fontFamily: 'var(--font-mono)' }}>{cell}</b>
                          ) : cIdx === 0 && fileType === 'pimOption' ? (
                            <code style={{ color: '#4338ca', fontWeight: 600 }}>{cell}</code>
                          ) : cIdx === 2 && fileType === 'pimOption' ? (
                            <b style={{ color: '#0284c7', fontFamily: 'var(--font-mono)' }}>{cell}</b>
                          ) : cIdx === 0 && fileType === 'catMappingRef' ? (
                            <b style={{ color: '#7c3aed', fontFamily: 'var(--font-mono)' }}>{cell}</b>
                          ) : cIdx === 1 && fileType === 'catMappingRef' ? (
                            <b style={{ color: '#059669', fontFamily: 'var(--font-mono)' }}>{cell}</b>
                          ) : cIdx === 2 && fileType === 'catMappingRef' ? (
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{cell}</span>
                          ) : cIdx === 3 && fileType === 'catMappingRef' ? (
                            <code style={{ color: '#0284c7' }}>{cell}</code>
                          ) : (
                            String(cell)
                          )}
                        </td>
                      ))}
                      {isEditable && (
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenEditModal(originalIndex)}
                              className="btn btn-secondary"
                              style={{ padding: '5px 8px', fontSize: '0.74rem' }}
                              title="Chỉnh sửa dòng này"
                            >
                              <Edit2 size={13} color="#4f46e5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRow(originalIndex)}
                              className="btn btn-secondary"
                              style={{ padding: '5px 8px', fontSize: '0.74rem' }}
                              title="Xóa dòng này"
                            >
                              <Trash2 size={13} color="#ef4444" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
          fontSize: '0.78rem',
          color: 'var(--text-dim)'
        }}>
          <div>
            Đang hiển thị <b>{Math.min(totalRows, (safePage - 1) * pageSize + 1)}</b> đến <b>{Math.min(totalRows, safePage * pageSize)}</b> trong tổng số <b>{workingItems.length.toLocaleString()}</b> dòng.
          </div>
          <div>
            {hasUnsavedChanges ? (
              <span style={{ color: '#d97706', fontWeight: 600 }}>
                ⚠️ Có chỉnh sửa chưa lưu. Hãy nhớ bấm "Lưu thay đổi vào DB" trước khi đóng!
              </span>
            ) : (
              <span>Dữ liệu đã được đồng bộ an toàn với cơ sở dữ liệu.</span>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT RECORD MODAL DIALOG */}
      {/* ========================================================================= */}
      {formOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div 
            className="glass-panel animate-fade-in" 
            style={{
              width: '100%',
              maxWidth: '620px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {editingIndex === null ? '➕ Thêm Dòng Mới' : `✏️ Chỉnh Sửa Dòng #${editingIndex + 1}`}
              </h3>
              <button 
                onClick={() => setFormOpen(false)}
                className="btn btn-secondary" 
                style={{ padding: '5px', borderRadius: '6px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveForm}>
              
              {/* Form fields for cmsCatalog */}
              {fileType === 'cmsCatalog' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Mã Ngành CMS (CATEGORYID) *
                      </label>
                      <input
                        type="text"
                        value={formData.categoryId || ''}
                        onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Tên Ngành CMS (CATEGORYNAME)
                      </label>
                      <input
                        type="text"
                        value={formData.categoryName || ''}
                        onChange={e => setFormData({ ...formData, categoryName: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Mã Thuộc Tính CMS (PROPERTYID) *
                      </label>
                      <input
                        type="text"
                        value={formData.propertyId || ''}
                        onChange={e => setFormData({ ...formData, propertyId: e.target.value })}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Tên Thuộc Tính CMS (PROPERTYNAME) *
                      </label>
                      <input
                        type="text"
                        value={formData.propertyName || ''}
                        onChange={e => setFormData({ ...formData, propertyName: e.target.value })}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      Loại Thuộc Tính (PROPERTYTYPE)
                    </label>
                    <select
                      value={formData.propertyType ?? 1}
                      onChange={e => setFormData({ ...formData, propertyType: Number(e.target.value) })}
                      style={{ width: '100%' }}
                    >
                      <option value={0}>0 - Text nhập tự do (Không có ValueID)</option>
                      <option value={1}>1 - Đơn giá trị (Single-select)</option>
                      <option value={2}>2 - Đa giá trị (Multi-select: ,ID1,ID2,)</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Mã Giá Trị CMS (VALUEID)
                      </label>
                      <input
                        type="text"
                        placeholder="Để trống nếu là Text"
                        value={formData.valueId || ''}
                        onChange={e => setFormData({ ...formData, valueId: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Tên Giá Trị CMS (VALUE)
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Type C"
                        value={formData.valueName || ''}
                        onChange={e => setFormData({ ...formData, valueName: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form fields for pimOption */}
              {fileType === 'pimOption' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Mã Thuộc Tính PIM (Code) *
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: charging_port_filter_master"
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Tên Thuộc Tính PIM (Name)
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Cổng sạc"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Mã Option (OptionCode) *
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: 3"
                        value={formData.optionCode || ''}
                        onChange={e => setFormData({ ...formData, optionCode: e.target.value })}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Giá Trị Option (OptionValue) *
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Type-C"
                        value={formData.optionValue || ''}
                        onChange={e => setFormData({ ...formData, optionValue: e.target.value })}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      Trạng Thái Kích Hoạt (IsActivated)
                    </label>
                    <select
                      value={formData.isActivated ? 'true' : 'false'}
                      onChange={e => setFormData({ ...formData, isActivated: e.target.value === 'true' })}
                      style={{ width: '100%' }}
                    >
                      <option value="true">True - Đang kích hoạt</option>
                      <option value="false">False - Tắt kích hoạt</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Form fields for mappingRef */}
              {fileType === 'mappingRef' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Mã Ngành CMS (cmsCategoryId) *
                      </label>
                      <input
                        type="text"
                        value={formData.cmsCategoryId || ''}
                        onChange={e => setFormData({ ...formData, cmsCategoryId: e.target.value })}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Tên Ngành CMS (cmsCategoryName)
                      </label>
                      <input
                        type="text"
                        value={formData.cmsCategoryName || ''}
                        onChange={e => setFormData({ ...formData, cmsCategoryName: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Mã Thuộc Tính CMS (cmsPropertyId) *
                      </label>
                      <input
                        type="text"
                        value={formData.cmsPropertyId || ''}
                        onChange={e => setFormData({ ...formData, cmsPropertyId: e.target.value })}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Tên Thuộc Tính CMS (cmsPropertyName)
                      </label>
                      <input
                        type="text"
                        value={formData.cmsPropertyName || ''}
                        onChange={e => setFormData({ ...formData, cmsPropertyName: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      Mã Thuộc Tính PIM (pimAttributeCode) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: charging_port_filter_master"
                      value={formData.pimAttributeCode || ''}
                      onChange={e => setFormData({ ...formData, pimAttributeCode: e.target.value })}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}

              {/* Form fields for catMappingRef */}
              {fileType === 'catMappingRef' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Mã Danh Mục PIM (Mã PIM / category_code) *
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: 87"
                        value={formData.pimCategoryCode || ''}
                        onChange={e => setFormData({ ...formData, pimCategoryCode: e.target.value })}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        ID Ngành Hàng CMS (ID NH CMS) *
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: 9499"
                        value={formData.cmsCategoryId || ''}
                        onChange={e => setFormData({ ...formData, cmsCategoryId: e.target.value })}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      Tên Ngành Hàng CMS (Tên Ngành hàng) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Adapter sạc"
                      value={formData.cmsCategoryName || ''}
                      onChange={e => setFormData({ ...formData, cmsCategoryName: e.target.value })}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Mã Họ Sản Phẩm (MÃ HỌ SẢN PHẨM / family_code)
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: adapter_sac_tgdd"
                        value={formData.familyCode || ''}
                        onChange={e => setFormData({ ...formData, familyCode: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Tên Họ Sản Phẩm (TÊN HỌ SẢN PHẨM)
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Họ Adapter sạc"
                        value={formData.familyName || ''}
                        onChange={e => setFormData({ ...formData, familyName: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      Ngành Hàng Chính (NH chính)
                    </label>
                    <input
                      type="text"
                      placeholder="Tùy chọn"
                      value={formData.mainCategory || ''}
                      onChange={e => setFormData({ ...formData, mainCategory: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}

              {/* Form fields for cmsTemplate */}
              {fileType === 'cmsTemplate' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        PRODUCTID *
                      </label>
                      <input
                        type="text"
                        value={formData.col_0 || ''}
                        onChange={e => setFormData({ ...formData, col_0: e.target.value })}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        PROPERTYID *
                      </label>
                      <input
                        type="text"
                        value={formData.col_1 || ''}
                        onChange={e => setFormData({ ...formData, col_1: e.target.value })}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        PROPVALUEID
                      </label>
                      <input
                        type="text"
                        value={formData.col_2 || ''}
                        onChange={e => setFormData({ ...formData, col_2: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>LANGUAGEID</label>
                      <input type="text" value={formData.col_3 || 'vi-VN'} onChange={e => setFormData({ ...formData, col_3: e.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>USERNAME</label>
                      <input type="text" value={formData.col_4 || ''} onChange={e => setFormData({ ...formData, col_4: e.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>FULLNAME</label>
                      <input type="text" value={formData.col_5 || ''} onChange={e => setFormData({ ...formData, col_5: e.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>SITEID</label>
                      <input type="text" value={formData.col_6 || '2'} onChange={e => setFormData({ ...formData, col_6: e.target.value })} style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Form fields for cmsValueTemplate */}
              {fileType === 'cmsValueTemplate' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Propertyid (ID Thuộc tính) *
                      </label>
                      <input
                        type="text"
                        value={formData.propertyId ?? ''}
                        onChange={e => setFormData({ ...formData, propertyId: e.target.value })}
                        required
                        placeholder="Ví dụ: 72"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Value (Giá trị đề xuất tạo mới) *
                      </label>
                      <input
                        type="text"
                        value={formData.value ?? ''}
                        onChange={e => setFormData({ ...formData, value: e.target.value })}
                        required
                        placeholder="Ví dụ: Android 18"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Displayorder
                      </label>
                      <input
                        type="number"
                        value={formData.displayOrder ?? 3}
                        onChange={e => setFormData({ ...formData, displayOrder: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Issearch
                      </label>
                      <select
                        value={formData.isSearch ?? 0}
                        onChange={e => setFormData({ ...formData, isSearch: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      >
                        <option value={0}>0 - Bình thường</option>
                        <option value={1}>1 - Cho phép Filter</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Comparevalue
                      </label>
                      <select
                        value={formData.compareValue ?? 0}
                        onChange={e => setFormData({ ...formData, compareValue: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      >
                        <option value={0}>0 - Không so sánh</option>
                        <option value={1}>1 - Dùng so sánh</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Isexistpro
                      </label>
                      <select
                        value={formData.isExistPro ?? 0}
                        onChange={e => setFormData({ ...formData, isExistPro: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      >
                        <option value={0}>0 - Chưa có SP</option>
                        <option value={1}>1 - Đã có SP</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Createduser
                      </label>
                      <input
                        type="text"
                        value={formData.createdUser ?? ''}
                        onChange={e => setFormData({ ...formData, createdUser: e.target.value })}
                        placeholder="174873"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form Submit & Cancel */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontSize: '0.82rem', padding: '8px 20px' }}
                >
                  {editingIndex === null ? 'Thêm vào bảng tạm' : 'Cập nhật dòng'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>,
    document.body
  );
}
