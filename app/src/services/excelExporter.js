import * as XLSX from 'xlsx';

/**
 * Generates and downloads the multi-sheet CMS Import Excel file.
 */
export function exportCMSImportExcel({
  validImportRows = [],
  holdRows = [],
  proposals = [],
  fileName = 'import_cms_result.xlsx',
  valueMode = 'id', // 'id' (Mặc định: mã số) | 'text' (Dạng text tương ứng)
  targetProductIds = null // Array or Set of product IDs to filter by (or null for all)
}) {
  // Filter rows if targetProductIds is provided
  let rowsToExport = validImportRows;
  let holdRowsToExport = holdRows;

  if (targetProductIds && (targetProductIds instanceof Set || Array.isArray(targetProductIds))) {
    const idSet = targetProductIds instanceof Set 
      ? new Set(Array.from(targetProductIds).map(x => String(x).trim().toLowerCase()))
      : new Set(targetProductIds.map(x => String(x).trim().toLowerCase()));

    if (idSet.size > 0) {
      rowsToExport = validImportRows.filter(row => {
        const pid = String(row.PRODUCTID || '').trim().toLowerCase();
        const model = String(row.trace?.model_code || '').trim().toLowerCase();
        const cmsId = String(row.trace?.cms_product_id || '').trim().toLowerCase();
        return idSet.has(pid) || (model && idSet.has(model)) || (cmsId && idSet.has(cmsId));
      });

      holdRowsToExport = holdRows.filter(h => {
        const pid = String(h.cms_product_id || '').trim().toLowerCase();
        const model = String(h.model_code || '').trim().toLowerCase();
        return (pid && idSet.has(pid)) || (model && idSet.has(model));
      });
    }
  }

  const wb = XLSX.utils.book_new();

  // 1. Sheet 1: Import CMS (Exactly matches import_sp_cms.xlsx)
  const importSheetData = [
    ['PRODUCTID', 'PROPERTYID', 'PROPVALUEID', 'LANGUAGEID', 'USERNAME', 'FULLNAME', 'SITEID']
  ];

  rowsToExport.forEach(row => {
    // Determine value to export based on valueMode
    const rawVal = valueMode === 'text'
      ? (row.PROPVALUETEXT !== undefined && row.PROPVALUETEXT !== null && String(row.PROPVALUETEXT).trim() !== '' ? row.PROPVALUETEXT : row.PROPVALUEID)
      : row.PROPVALUEID;

    // Enforce correct types:
    // PRODUCTID & PROPERTYID: numeric if valid number
    const productVal = isNaN(Number(row.PRODUCTID)) ? row.PRODUCTID : Number(row.PRODUCTID);
    const propertyVal = isNaN(Number(row.PROPERTYID)) ? row.PROPERTYID : Number(row.PROPERTYID);

    // PROPVALUEID:
    // - In ID mode: numeric if single numeric ID; string if multi-ID (e.g. ,41348,41349,)
    // - In Text mode: keep as string text
    let finalPropVal = rawVal;
    if (valueMode === 'id' && !isNaN(Number(rawVal)) && String(rawVal).trim() !== '') {
      finalPropVal = Number(rawVal);
    } else {
      finalPropVal = String(rawVal);
    }

    importSheetData.push([
      productVal,
      propertyVal,
      finalPropVal,
      row.LANGUAGEID,
      isNaN(Number(row.USERNAME)) ? row.USERNAME : Number(row.USERNAME),
      row.FULLNAME,
      isNaN(Number(row.SITEID)) ? row.SITEID : Number(row.SITEID)
    ]);
  });

  const wsImport = XLSX.utils.aoa_to_sheet(importSheetData);
  XLSX.utils.book_append_sheet(wb, wsImport, 'Import tên rút gọn ');

  // 2. Sheet 2: Báo cáo dòng giữ lại (Hold)
  const holdSheetData = [
    [
      'FILE PIM NGUỒN',
      'DÒNG PIM',
      'ID SẢN PHẨM CMS (model_id_cms)',
      'MÃ MODEL PIM (model_code)',
      'MÃ SKU ERP',
      'MÃ THUỘC TÍNH PIM',
      'MÃ THUỘC TÍNH CMS',
      'TÊN THUỘC TÍNH CMS',
      'GIÁ TRỊ THÔ TRONG PIM',
      'LÝ DO GIỮ LẠI',
      'CHI TIẾT NGOẠI LỆ'
    ]
  ];

  holdRowsToExport.forEach(h => {
    holdSheetData.push([
      h.fileOrigin || '',
      h.rowIndex,
      h.cms_product_id || '',
      h.model_code || '',
      h.sku || '',
      h.pimAttributeCode,
      h.cmsPropertyId || '',
      h.cmsPropertyName || '',
      h.rawValue,
      h.reason,
      h.detail
    ]);
  });

  const wsHold = XLSX.utils.aoa_to_sheet(holdSheetData);
  XLSX.utils.book_append_sheet(wb, wsHold, 'Báo cáo dòng giữ lại (Hold)');

  // 3. Sheet 3: Đề xuất tạo mới giá trị CMS
  const proposalSheetData = [
    [
      'MÃ NGÀNH CMS',
      'TÊN NGÀNH CMS',
      'MÃ THUỘC TÍNH CMS',
      'TÊN THUỘC TÍNH CMS',
      'MÃ THUỘC TÍNH PIM',
      'GIÁ TRỊ CẦN TẠO MỚI',
      'SỐ LẦN XUẤT HIỆN',
      'CÁC MODEL MẪU'
    ]
  ];

  proposals.forEach(p => {
    proposalSheetData.push([
      p.cmsCategoryId,
      p.cmsCategoryName,
      p.cmsPropertyId,
      p.cmsPropertyName,
      p.pimAttributeCode,
      p.rawText,
      p.count,
      (p.sampleModels || []).join(', ')
    ]);
  });

  const wsProposal = XLSX.utils.aoa_to_sheet(proposalSheetData);
  XLSX.utils.book_append_sheet(wb, wsProposal, 'Đề xuất tạo mới CMS');

  // Trigger file download in browser
  XLSX.writeFile(wb, fileName);
}

/**
 * Generates and downloads the CMS New Values Import Excel file according to import_gt_cms.xlsx.
 * Columns: Propertyid, Value, Displayorder, Issearch, Comparevalue, Isexistpro, Createduser
 */
export function exportCMSNewValuesExcel({
  proposals = [],
  fileName = 'import_gia_tri_moi_cms.xlsx',
  config = {}
}) {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Propertyid',
    'Value',
    'Displayorder',
    'Issearch',
    'Comparevalue',
    'Isexistpro',
    'Createduser'
  ];

  const dispOrder = !isNaN(Number(config.displayOrder)) ? Number(config.displayOrder) : 3;
  const isSearch = !isNaN(Number(config.isSearch)) ? Number(config.isSearch) : 0;
  const compVal = !isNaN(Number(config.compareValue)) ? Number(config.compareValue) : 0;
  const isExist = !isNaN(Number(config.isExistPro)) ? Number(config.isExistPro) : 0;
  const user = !isNaN(Number(config.createdUser)) && String(config.createdUser).trim() !== ''
    ? Number(config.createdUser)
    : (config.createdUser || '');

  const rows = [headers];
  const seen = new Set();

  proposals.forEach(p => {
    const rawProp = p.cmsPropertyId !== undefined && p.cmsPropertyId !== null ? p.cmsPropertyId : '';
    const propId = !isNaN(Number(rawProp)) && String(rawProp).trim() !== '' ? Number(rawProp) : String(rawProp).trim();
    const valText = String(p.rawText || '').trim();

    if (!propId && !valText) return;

    // Distinct by Propertyid + Value
    const key = `${propId}___${valText.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);

    rows.push([
      propId,
      valText,
      dispOrder,
      isSearch,
      compVal,
      isExist,
      user
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set clean column widths so headers like Comparevalue are fully visible
  ws['!cols'] = [
    { wch: 14 }, // Propertyid
    { wch: 28 }, // Value
    { wch: 14 }, // Displayorder
    { wch: 12 }, // Issearch
    { wch: 16 }, // Comparevalue
    { wch: 12 }, // Isexistpro
    { wch: 14 }  // Createduser
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, fileName);
}

