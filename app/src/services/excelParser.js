import * as XLSX from 'xlsx';

/**
 * Normalizes text for comparison (trim, lower, NFC unicode)
 */
export function normalizeText(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .trim()
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Reads an Excel file buffer/file object into a workbook
 */
export async function readExcelWorkbook(fileOrBuffer) {
  let arrayBuffer;
  if (fileOrBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer;
  } else if (fileOrBuffer instanceof Blob || fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    throw new Error('Unsupported file type');
  }

  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  return wb;
}

/**
 * Parses raw sheet rows by scanning all cells directly to avoid missing rows due to faulty dimension metadata.
 */
export function sheetToRawRows(worksheet) {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  
  // Find actual max row and col by scanning keys
  let maxR = range.e.r;
  let maxC = range.e.c;
  for (const key in worksheet) {
    if (key[0] === '!') continue;
    const cell = XLSX.utils.decode_cell(key);
    if (cell.r > maxR) maxR = cell.r;
    if (cell.c > maxC) maxC = cell.c;
  }

  const rows = [];
  for (let r = 0; r <= maxR; r++) {
    const row = [];
    let hasData = false;
    for (let c = 0; c <= maxC; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[cellRef];
      const val = cell ? cell.v : null;
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        hasData = true;
      }
      row.push(val !== undefined ? val : null);
    }
    // Only push if row has data or within first 5 rows (headers)
    if (hasData || r < 3) {
      rows.push(row);
    }
  }
  return rows;
}

/**
 * 1. Parser for PIM Product File (e.g. export_productadap.xlsx)
 * Row 1: Technical column codes
 * Row 2: Vietnamese labels
 * Row 3+: Actual data
 */
export function parsePIMProductFile(worksheet, fileName = '') {
  const rows = sheetToRawRows(worksheet);
  if (rows.length < 2) {
    throw new Error('File sản phẩm PIM không đúng cấu trúc (cần ít nhất dòng header kỹ thuật và nhãn).');
  }

  const techHeaders = rows[0].map(h => (h ? String(h).trim() : ''));
  const vnLabels = rows[1].map(l => (l ? String(l).trim() : ''));

  // 1. CỘT ID SẢN PHẨM TRÊN CMS (Bắt buộc để tạo PRODUCTID):
  // Dòng 1 kỹ thuật: model_id_cms
  // Dòng 2 nhãn tiếng Việt: Mã sản phẩm CMS của model
  let cmsIdColIndex = techHeaders.findIndex(h => h.toLowerCase() === 'model_id_cms');
  if (cmsIdColIndex === -1) {
    cmsIdColIndex = vnLabels.findIndex(l => {
      const lower = l.toLowerCase();
      return lower.includes('mã sản phẩm cms') || lower.includes('mã model sản phẩm cms');
    });
  }
  if (cmsIdColIndex === -1) {
    cmsIdColIndex = techHeaders.findIndex(h => h.toLowerCase().includes('model_id_cms'));
  }

  // 2. CỘT MÃ MODEL NỘI BỘ PIM:
  // Dòng 1 kỹ thuật: model_code | Dòng 2: Mã model
  const modelColIndex = techHeaders.findIndex(h => h.toLowerCase() === 'model_code');

  // Kiểm tra tối thiểu: phải có ít nhất cột ID CMS (model_id_cms) hoặc mã PIM (model_code)
  if (cmsIdColIndex === -1 && modelColIndex === -1) {
    throw new Error('File PIM không đúng cấu trúc: thiếu cột "model_id_cms" (Mã sản phẩm CMS của model) hoặc "model_code".');
  }

  const skuColIndex = techHeaders.findIndex(h => h.toLowerCase() === 'sku');
  
  // Resilient category column detection: category_code, category, or Vietnamese label
  let catColIndex = techHeaders.findIndex(h => {
    const l = h.toLowerCase();
    return l === 'category_code' || l === 'category' || l === 'danh_muc' || l === 'nhom_hang';
  });
  if (catColIndex === -1) {
    catColIndex = vnLabels.findIndex(l => {
      const lower = l.toLowerCase();
      return lower.includes('mã danh mục') || lower.includes('mã ngành hàng') || lower.includes('ngành hàng');
    });
  }

  // Family code column detection: family_code, family, or Vietnamese label (mã họ sản phẩm)
  let famColIndex = techHeaders.findIndex(h => {
    const l = h.toLowerCase();
    return l === 'family_code' || l === 'family' || l === 'ma_ho';
  });
  if (famColIndex === -1) {
    famColIndex = vnLabels.findIndex(l => {
      const lower = l.toLowerCase();
      return lower.includes('mã họ');
    });
  }

  const products = [];
  const originName = fileName || 'sp_pim.xlsx';
  const seenProductKeys = new Set();

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const modelCode = modelColIndex !== -1 && row[modelColIndex] !== null && row[modelColIndex] !== undefined
      ? String(row[modelColIndex]).trim()
      : '';
    const cmsProductId = cmsIdColIndex !== -1 && row[cmsIdColIndex] !== null && row[cmsIdColIndex] !== undefined
      ? String(row[cmsIdColIndex]).trim()
      : '';

    // Bỏ qua dòng hoàn toàn trống (không có cả modelCode lẫn cmsProductId)
    if (!modelCode && !cmsProductId) continue;

    // Lọc bỏ biến thể trùng lặp: chỉ giữ lại 1 dòng duy nhất cho mỗi ID CMS (hoặc Model PIM)
    const productKey = (cmsProductId || modelCode).toLowerCase();
    if (seenProductKeys.has(productKey)) {
      continue;
    }
    seenProductKeys.add(productKey);

    const sku = skuColIndex !== -1 && row[skuColIndex] !== null && row[skuColIndex] !== undefined
      ? String(row[skuColIndex]).trim()
      : '';
    const categoryCode = catColIndex !== -1 && row[catColIndex] !== null && row[catColIndex] !== undefined
      ? String(row[catColIndex]).trim()
      : '';
    const familyCode = famColIndex !== -1 && row[famColIndex] !== null && row[famColIndex] !== undefined
      ? String(row[famColIndex]).trim()
      : '';

    const attributes = {};
    const attrLabels = {};
    for (let c = 0; c < techHeaders.length; c++) {
      const colName = techHeaders[c];
      if (!colName) continue;
      const lowerCol = colName.toLowerCase();
      // Bỏ qua các cột định danh hệ thống
      if ([
        'model_code', 'sku', 'category_code', 'variant_code', 'family_code', 
        'family_variant_code', 'model_id_cms', 'model_activated', 'variant_activated',
        'category', 'nhom_hang', 'danh_muc', 'ma_ho', 'family'
      ].includes(lowerCol)) {
        continue;
      }

      // Check master attributes hoặc cột có nhãn thuộc tính hợp lệ
      const isMasterAttr = lowerCol.includes('tskt_master') || 
                           lowerCol.includes('filter_master') || 
                           lowerCol.endsWith('_master') || 
                           lowerCol.includes('_tskt') || 
                           lowerCol.includes('_filter') ||
                           (vnLabels[c] && vnLabels[c].trim().length > 0 && !lowerCol.includes('activated'));
      if (!isMasterAttr) continue;

      const rawVal = row[c] !== null && row[c] !== undefined ? String(row[c]).trim() : '';
      attributes[colName] = rawVal;
      attrLabels[colName] = vnLabels[c] ? String(vnLabels[c]).trim() : '';
    }

    products.push({
      rowIndex: i + 1, // Dòng Excel (1-indexed)
      cms_product_id: cmsProductId, // ID sản phẩm trên CMS (dùng làm PRODUCTID chuẩn)
      model_code: modelCode, // Mã model nội bộ PIM (dùng để đối chiếu/truy vết)
      sku,
      category_code: categoryCode,
      family_code: familyCode,
      rawAttributes: attributes,
      attrLabels,
      fileOrigin: originName
    });
  }

  const detectedCategoryCodes = Array.from(new Set(products.map(p => p.category_code).filter(Boolean)));
  const distinctModels = new Set(products.map(p => p.model_code).filter(Boolean)).size;
  const distinctCmsIds = new Set(products.map(p => p.cms_product_id).filter(Boolean)).size;

  return {
    fileName: originName,
    headers: techHeaders,
    labels: vnLabels,
    products,
    totalRows: products.length,
    hasCmsProductIdColumn: cmsIdColIndex !== -1,
    detectedCategoryCodes,
    distinctModels,
    distinctCmsIds
  };
}

/**
 * 2. Parser for PIM Option File (e.g. option_pim.xlsx)
 * Key: (Code, OptionCode) -> OptionValue
 * Row 1: Code, Name, AttributeTypeName, AttributeGroupName, IsActivated, OptionCode, OptionValue, OptionSortOrder
 * Row 2: Tiếng Việt
 * Row 3+: Data
 */
export function parsePIMOptionFile(worksheet) {
  const rows = sheetToRawRows(worksheet);
  if (rows.length < 2) {
    throw new Error('File Option PIM không đúng cấu trúc.');
  }

  const headers = rows[0].map(h => (h ? String(h).trim() : ''));
  const codeIdx = headers.findIndex(h => h.toLowerCase() === 'code');
  const optCodeIdx = headers.findIndex(h => h.toLowerCase() === 'optioncode');
  const optValIdx = headers.findIndex(h => h.toLowerCase() === 'optionvalue');
  const isActIdx = headers.findIndex(h => h.toLowerCase() === 'isactivated');

  if (codeIdx === -1 || optCodeIdx === -1 || optValIdx === -1) {
    throw new Error('File Option PIM thiếu một trong các cột bắt buộc: Code, OptionCode, OptionValue.');
  }

  const optionsMap = new Map(); // key: `${code.toLowerCase()}___${optionCode}` => { code, optionCode, optionValue, isActivated }
  const optionsList = [];
  let totalOptions = 0;

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const code = row[codeIdx] ? String(row[codeIdx]).trim() : '';
    const optCode = row[optCodeIdx] !== null && row[optCodeIdx] !== undefined ? String(row[optCodeIdx]).trim() : '';
    const optVal = row[optValIdx] !== null && row[optValIdx] !== undefined ? String(row[optValIdx]).trim() : '';
    const isActivated = isActIdx !== -1 ? Boolean(row[isActIdx]) : true;

    if (!code || !optCode) continue;

    const optItem = {
      code,
      optionCode: optCode,
      optionValue: optVal,
      isActivated
    };

    const key = `${code.toLowerCase()}___${optCode}`;
    optionsMap.set(key, optItem);
    optionsList.push(optItem);
    totalOptions++;
  }

  return {
    optionsMap,
    optionsList,
    totalOptions
  };
}

/**
 * 3. Parser for CMS Attribute & Value Category File (e.g. data_tt_gt_cms.xlsx or file-thuoctinh-giatri.xlsx)
 * Required: CATEGORYID, CATEGORYNAME, PROPERTYID, PROPERTYNAME, VALUEID, VALUE
 * Optional: PROPERTYTYPE (0: text, 1: single, 2: multi), GROUPNAME, etc.
 */
export function parseCMSCatalogFile(worksheet) {
  const rows = sheetToRawRows(worksheet);
  if (rows.length < 2) {
    throw new Error('File danh mục CMS không có dữ liệu.');
  }

  const headers = rows[0].map(h => (h ? String(h).trim().toUpperCase() : ''));
  const catIdIdx = headers.indexOf('CATEGORYID');
  const catNameIdx = headers.indexOf('CATEGORYNAME');
  const propIdIdx = headers.indexOf('PROPERTYID');
  const propNameIdx = headers.indexOf('PROPERTYNAME');
  const propTypeIdx = headers.indexOf('PROPERTYTYPE');
  const valIdIdx = headers.indexOf('VALUEID');
  const valIdx = headers.indexOf('VALUE');

  if (catIdIdx === -1 || propIdIdx === -1 || propNameIdx === -1) {
    throw new Error('File danh mục CMS thiếu các cột bắt buộc: CATEGORYID, PROPERTYID, PROPERTYNAME.');
  }

  // Categories metadata
  const categories = new Map(); // catId => catName
  // Properties metadata: key `${catId}___${propId}` => { catId, propId, propName, propType, values: [] }
  const properties = new Map();
  // Value lookup: key `${catId}___${propId}___${normalizeText(value)}` => array of { valId, rawValue }
  const valueLookup = new Map();
  const rawTableRows = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const catId = row[catIdIdx] !== null && row[catIdIdx] !== undefined ? String(row[catIdIdx]).trim() : '';
    if (!catId) continue;
    const catName = catNameIdx !== -1 && row[catNameIdx] ? String(row[catNameIdx]).trim() : '';
    categories.set(catId, catName);

    const propId = row[propIdIdx] !== null && row[propIdIdx] !== undefined ? String(row[propIdIdx]).trim() : '';
    if (!propId) continue;
    const propName = row[propNameIdx] ? String(row[propNameIdx]).trim() : '';
    const propType = propTypeIdx !== -1 && row[propTypeIdx] !== null ? Number(row[propTypeIdx]) : null;

    const propKey = `${catId}___${propId}`;
    if (!properties.has(propKey)) {
      properties.set(propKey, {
        categoryId: catId,
        categoryName: catName,
        propertyId: propId,
        propertyName: propName,
        propertyType: propType, // 0: text, 1: single, 2: multi
        values: []
      });
    }

    const valId = valIdIdx !== -1 && row[valIdIdx] !== null && row[valIdIdx] !== undefined ? String(row[valIdIdx]).trim() : '';
    const rawVal = valIdx !== -1 && row[valIdx] !== null && row[valIdx] !== undefined ? String(row[valIdx]).trim() : '';

    if (valId || rawVal) {
      const propObj = properties.get(propKey);
      propObj.values.push({ valId, valName: rawVal });

      if (rawVal) {
        const valLookupKey = `${catId}___${propId}___${normalizeText(rawVal)}`;
        if (!valueLookup.has(valLookupKey)) {
          valueLookup.set(valLookupKey, []);
        }
        valueLookup.get(valLookupKey).push({ valId, rawValue: rawVal });
      }
    }

    rawTableRows.push({
      categoryId: catId,
      categoryName: catName,
      propertyId: propId,
      propertyName: propName,
      propertyType: propType,
      valueId: valId,
      valueName: rawVal
    });
  }

  return {
    categories: Array.from(categories.entries()).map(([id, name]) => ({ id, name })),
    properties,
    valueLookup,
    rawTableRows,
    totalRows: rawTableRows.length
  };
}

/**
 * 4. Parser for Attribute Mapping Reference File (e.g. thuoc_tinh_pim_cms.xlsx)
 * Columns: 'MÃ NGÀNH HÀNG CMS', 'TÊN NGÀNH HÀNG CMS', 'MÃ THUỘC TÍNH TSKT', 'TÊN THUỘC TÍNH TSKT', 'MÃ THUỘC TÍNH PIM'
 */
export function parseMappingReferenceFile(worksheet) {
  const rows = sheetToRawRows(worksheet);
  if (rows.length < 2) {
    throw new Error('File mapping tham chiếu không đủ dòng.');
  }

  const headers = rows[0].map(h => (h ? String(h).trim().toUpperCase() : ''));
  const catIdIdx = headers.findIndex(h => h.includes('MÃ NGÀNH') || h.includes('CATEGORYID'));
  const catNameIdx = headers.findIndex(h => h.includes('TÊN NGÀNH') || h.includes('CATEGORYNAME'));
  const propIdIdx = headers.findIndex(h => h.includes('MÃ THUỘC TÍNH') || h.includes('PROPERTYID'));
  const propNameIdx = headers.findIndex(h => h.includes('TÊN THUỘC TÍNH') || h.includes('PROPERTYNAME'));
  const pimAttrIdx = headers.findIndex(h => h.includes('MÃ THUỘC TÍNH PIM') || h.includes('PIM'));

  const mappings = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cmsCatId = catIdIdx !== -1 && row[catIdIdx] !== null ? String(row[catIdIdx]).trim() : '';
    const cmsCatName = catNameIdx !== -1 && row[catNameIdx] ? String(row[catNameIdx]).trim() : '';
    const cmsPropId = propIdIdx !== -1 && row[propIdIdx] !== null ? String(row[propIdIdx]).trim() : '';
    const cmsPropName = propNameIdx !== -1 && row[propNameIdx] ? String(row[propNameIdx]).trim() : '';
    const pimAttr = pimAttrIdx !== -1 && row[pimAttrIdx] ? String(row[pimAttrIdx]).trim() : '';

    if (cmsCatId && cmsPropId && pimAttr) {
      mappings.push({
        cmsCategoryId: cmsCatId,
        cmsCategoryName: cmsCatName,
        cmsPropertyId: cmsPropId,
        cmsPropertyName: cmsPropName,
        pimAttributeCode: pimAttr
      });
    }
  }

  return mappings;
}

/**
 * 5. Parser for CMS Import Template File (e.g. import_sp_cms.xlsx)
 * Extracts sheet name, headers, and column order.
 */
export function parseCMSImportTemplate(workbook) {
  const sheetName = workbook.SheetNames[0] || 'Import tên rút gọn ';
  const worksheet = workbook.Sheets[sheetName];
  const rows = sheetToRawRows(worksheet);
  
  if (rows.length < 1) {
    throw new Error('File mẫu import CMS không có header.');
  }

  const rawHeaders = rows[0].map(h => (h ? String(h).trim() : '')).filter(Boolean);
  const mandatoryCols = ['PRODUCTID', 'PROPERTYID', 'PROPVALUEID', 'LANGUAGEID', 'USERNAME', 'FULLNAME', 'SITEID'];
  
  const missing = mandatoryCols.filter(col => !rawHeaders.includes(col));
  if (missing.length > 0) {
    throw new Error(`File mẫu import CMS thiếu các cột bắt buộc: ${missing.join(', ')}`);
  }

  const sampleRows = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')) {
      sampleRows.push(row.slice(0, rawHeaders.length));
    }
  }

  return {
    sheetName,
    headers: rawHeaders,
    sampleRows,
    sampleRowsCount: sampleRows.length
  };
}

/**
 * 5b. Parser for CMS Value Import Template File (e.g. import_gt_cms.xlsx)
 * Columns: Propertyid, Value, Displayorder, Issearch, Comparevalue, Isexistpro, Createduser
 */
export function parseCMSValueImportTemplate(workbook) {
  const sheetName = workbook.SheetNames[0] || 'Sheet1';
  const worksheet = workbook.Sheets[sheetName];
  const rows = sheetToRawRows(worksheet);

  if (rows.length < 1) {
    throw new Error('File mẫu import giá trị CMS không có header.');
  }

  const rawHeaders = rows[0].map(h => (h ? String(h).trim() : '')).filter(Boolean);
  const mandatoryCols = ['Propertyid', 'Value'];
  const lowerHeaders = rawHeaders.map(h => h.toLowerCase());

  const missing = mandatoryCols.filter(col => !lowerHeaders.includes(col.toLowerCase()));
  if (missing.length > 0) {
    throw new Error(`File mẫu import giá trị CMS thiếu các cột bắt buộc: ${missing.join(', ')}`);
  }

  const sampleRows = [];
  const defaultConfig = {
    displayOrder: 3,
    isSearch: 0,
    compareValue: 0,
    isExistPro: 0,
    createdUser: '174873'
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')) {
      sampleRows.push(row.slice(0, rawHeaders.length));
    }
  }

  // Extract defaultConfig from first sample row if available
  if (sampleRows.length > 0) {
    const first = sampleRows[0];
    const dispIdx = lowerHeaders.indexOf('displayorder');
    const searchIdx = lowerHeaders.indexOf('issearch');
    const compIdx = lowerHeaders.indexOf('comparevalue');
    const existIdx = lowerHeaders.indexOf('isexistpro');
    const userIdx = lowerHeaders.indexOf('createduser');

    if (dispIdx !== -1 && first[dispIdx] !== undefined) defaultConfig.displayOrder = Number(first[dispIdx]) || 3;
    if (searchIdx !== -1 && first[searchIdx] !== undefined) defaultConfig.isSearch = Number(first[searchIdx]) || 0;
    if (compIdx !== -1 && first[compIdx] !== undefined) defaultConfig.compareValue = Number(first[compIdx]) || 0;
    if (existIdx !== -1 && first[existIdx] !== undefined) defaultConfig.isExistPro = Number(first[existIdx]) || 0;
    if (userIdx !== -1 && first[userIdx] !== undefined) defaultConfig.createdUser = String(first[userIdx]);
  }

  return {
    sheetName,
    headers: rawHeaders,
    sampleRows,
    sampleRowsCount: sampleRows.length,
    defaultConfig
  };
}

/**
 * Rebuild CMS Value Import Template from edited rows
 */
export function rebuildCMSValueTemplateFromRows(rows) {
  const headers = ['Propertyid', 'Value', 'Displayorder', 'Issearch', 'Comparevalue', 'Isexistpro', 'Createduser'];
  const sampleRows = rows.map(r => {
    if (Array.isArray(r)) return r;
    return [
      r.propertyId !== undefined ? (isNaN(Number(r.propertyId)) ? r.propertyId : Number(r.propertyId)) : '',
      r.value !== undefined ? String(r.value) : '',
      r.displayOrder !== undefined ? Number(r.displayOrder) : 3,
      r.isSearch !== undefined ? Number(r.isSearch) : 0,
      r.compareValue !== undefined ? Number(r.compareValue) : 0,
      r.isExistPro !== undefined ? Number(r.isExistPro) : 0,
      r.createdUser !== undefined ? (isNaN(Number(r.createdUser)) ? r.createdUser : Number(r.createdUser)) : ''
    ];
  });

  return {
    sheetName: 'Sheet1',
    headers,
    sampleRows,
    sampleRowsCount: sampleRows.length
  };
}

/**
 * 6. Rebuild CMS Catalog data structure from edited rawTableRows
 */
export function rebuildCMSCatalogFromRows(rawTableRows) {
  const categories = new Map();
  const properties = new Map();
  const valueLookup = new Map();

  for (const item of rawTableRows) {
    const catId = String(item.categoryId || '').trim();
    if (!catId) continue;
    const catName = String(item.categoryName || '').trim();
    categories.set(catId, catName);

    const propId = String(item.propertyId || '').trim();
    if (!propId) continue;
    const propName = String(item.propertyName || '').trim();
    const propType = item.propertyType !== null && item.propertyType !== undefined && item.propertyType !== ''
      ? Number(item.propertyType)
      : null;

    const propKey = `${catId}___${propId}`;
    if (!properties.has(propKey)) {
      properties.set(propKey, {
        categoryId: catId,
        categoryName: catName,
        propertyId: propId,
        propertyName: propName,
        propertyType: propType,
        values: []
      });
    }

    const valId = item.valueId !== null && item.valueId !== undefined ? String(item.valueId).trim() : '';
    const valName = item.valueName !== null && item.valueName !== undefined ? String(item.valueName).trim() : '';

    if (valId && valName && valId !== '(Trống)' && valName !== '(Trống)') {
      const propObj = properties.get(propKey);
      if (!propObj.values.some(v => v.valId === valId)) {
        propObj.values.push({
          valId,
          valName,
          rawValue: valName
        });
      }

      const lookupKey = `${catId}___${propId}___${normalizeText(valName)}`;
      if (!valueLookup.has(lookupKey)) {
        valueLookup.set(lookupKey, []);
      }
      const existingMatches = valueLookup.get(lookupKey);
      if (!existingMatches.some(m => m.valId === valId)) {
        existingMatches.push({
          valId,
          rawValue: valName
        });
      }
    }
  }

  return {
    categories: Array.from(categories.entries()).map(([id, name]) => ({ id, name })),
    properties,
    valueLookup,
    rawTableRows,
    totalRows: rawTableRows.length
  };
}

/**
 * 7. Rebuild PIM Options data structure from edited optionsList
 */
export function rebuildPIMOptionsFromList(optionsList) {
  const optionsMap = new Map();
  for (const item of optionsList) {
    const code = String(item.code || '').trim();
    const optCode = String(item.optionCode || '').trim();
    if (code && optCode) {
      optionsMap.set(`${code.toLowerCase()}___${optCode}`, {
        code,
        name: item.name || '',
        optionCode: optCode,
        optionValue: String(item.optionValue || '').trim(),
        isActivated: Boolean(item.isActivated)
      });
    }
  }
  return {
    optionsMap,
    optionsList,
    totalOptions: optionsList.length
  };
}

/**
 * 8. Export any master dataset to Excel and trigger download
 */
export function exportDatasetToExcel(fileType, data, fileName) {
  const wb = XLSX.utils.book_new();

  if (fileType === 'cmsCatalog') {
    const headers = ['CATEGORYID', 'CATEGORYNAME', 'PROPERTYID', 'PROPERTYNAME', 'PROPERTYTYPE', 'VALUEID', 'VALUE'];
    const rows = [headers];
    const list = data.rawTableRows || [];
    list.forEach(r => {
      rows.push([
        r.categoryId,
        r.categoryName,
        r.propertyId,
        r.propertyName,
        r.propertyType,
        r.valueId,
        r.valueName
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'DanhMucCMS');
  } else if (fileType === 'pimOption') {
    const headers = ['Code', 'Name', 'OptionCode', 'OptionValue', 'IsActivated'];
    const rows = [headers];
    const list = data.optionsList || [];
    list.forEach(r => {
      rows.push([
        r.code,
        r.name,
        r.optionCode,
        r.optionValue,
        r.isActivated ? 'True' : 'False'
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'PIMOptions');
  } else if (fileType === 'mappingRef') {
    const headers = ['MÃ NGÀNH HÀNG CMS', 'TÊN NGÀNH HÀNG CMS', 'MÃ THUỘC TÍNH TSKT', 'TÊN THUỘC TÍNH TSKT', 'MÃ THUỘC TÍNH PIM'];
    const rows = [headers];
    const list = Array.isArray(data) ? data : (data.mappings || []);
    list.forEach(r => {
      rows.push([
        r.cmsCategoryId,
        r.cmsCategoryName,
        r.cmsPropertyId,
        r.cmsPropertyName,
        r.pimAttributeCode
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'MappingRef');
  } else if (fileType === 'catMappingRef') {
    const headers = ['Mã PIM', 'NH chính', 'Tên Ngành hàng', 'image', 'ID NH CMS', 'MÃ HỌ SẢN PHẨM', 'TÊN HỌ SẢN PHẨM'];
    const rows = [headers];
    const list = data.mappings || data.rawRows || (Array.isArray(data) ? data : []);
    list.forEach(r => {
      rows.push([
        r.pimCategoryCode,
        r.mainCategory || '',
        r.cmsCategoryName,
        r.image || '',
        r.cmsCategoryId,
        r.familyCode || '',
        r.familyName || ''
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'MappingNganhHang');
  } else if (fileType === 'cmsTemplate') {
    const headers = data.headers || ['PRODUCTID', 'PROPERTYID', 'PROPVALUEID', 'LANGUAGEID', 'USERNAME', 'FULLNAME', 'SITEID'];
    const rows = [headers, ...(data.sampleRows || [])];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, data.sheetName || 'Import tên rút gọn ');
  } else if (fileType === 'cmsValueTemplate') {
    const headers = data.headers || ['Propertyid', 'Value', 'Displayorder', 'Issearch', 'Comparevalue', 'Isexistpro', 'Createduser'];
    const sampleRows = (data.sampleRows || []).map(r => {
      if (Array.isArray(r)) return r;
      return [r.propertyId ?? '', r.value ?? '', r.displayOrder ?? 3, r.isSearch ?? 0, r.compareValue ?? 0, r.isExistPro ?? 0, r.createdUser ?? ''];
    });
    const rows = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, data.sheetName || 'Sheet1');
  }

  XLSX.writeFile(wb, fileName || `${fileType}_updated.xlsx`);
}

/**
 * 9. Parser for Category Mapping Reference File (e.g. nganh_hang_pim_cms.xlsx)
 * Header row: Mã PIM, NH chính, Tên Ngành hàng, image, ID NH CMS, MÃ HỌ SẢN PHẨM, TÊN HỌ SẢN PHẨM
 * Mã PIM: Mã danh mục PIM (category_code, e.g. 87)
 * ID NH CMS: ID Ngành hàng ở CMS (e.g. 9499)
 * Tên Ngành hàng: Tên ngành hàng CMS (e.g. Adapter sạc)
 * MÃ HỌ SẢN PHẨM: Mã họ sản phẩm (family_code, e.g. adapter_sac_tgdd)
 * TÊN HỌ SẢN PHẨM: Tên họ sản phẩm (e.g. Họ Adapter sạc)
 */
export function parseCategoryMappingReferenceFile(worksheet) {
  const rows = sheetToRawRows(worksheet);
  if (rows.length < 2) {
    throw new Error('File bảng mapping ngành hàng PIM - CMS không có dữ liệu hợp lệ.');
  }

  const headers = rows[0].map(h => (h !== null && h !== undefined ? String(h).trim() : ''));

  const pimCatCol = headers.findIndex(h => {
    const l = h.toLowerCase();
    return l === 'mã pim' || l === 'pim_category_code' || l === 'category_code' || l === 'mã danh mục pim';
  });

  const cmsIdCol = headers.findIndex(h => {
    const l = h.toLowerCase();
    return l === 'id nh cms' || l === 'cms_category_id' || l === 'categoryid' || l.includes('id nh') || l.includes('id ngành');
  });

  const cmsNameCol = headers.findIndex(h => {
    const l = h.toLowerCase();
    return l === 'tên ngành hàng' || l === 'tên ngành hàng cms' || l === 'categoryname' || l.includes('tên ngành');
  });

  const familyCodeCol = headers.findIndex(h => {
    const l = h.toLowerCase();
    return l === 'mã họ sản phẩm' || l === 'family_code' || l.includes('mã họ');
  });

  const familyNameCol = headers.findIndex(h => {
    const l = h.toLowerCase();
    return l === 'tên họ sản phẩm' || l.includes('tên họ');
  });

  const mainCatCol = headers.findIndex(h => {
    const l = h.toLowerCase();
    return l === 'nh chính' || l.includes('chính');
  });

  const imageCol = headers.findIndex(h => h.toLowerCase() === 'image');

  const mappings = [];
  const byPimCategoryCode = new Map();
  const byFamilyCode = new Map();
  const byCmsCategoryId = new Map();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const pimCode = pimCatCol !== -1 && row[pimCatCol] !== null && row[pimCatCol] !== undefined
      ? String(row[pimCatCol]).trim()
      : '';
    const cmsId = cmsIdCol !== -1 && row[cmsIdCol] !== null && row[cmsIdCol] !== undefined
      ? String(row[cmsIdCol]).trim()
      : '';
    const cmsName = cmsNameCol !== -1 && row[cmsNameCol] !== null && row[cmsNameCol] !== undefined
      ? String(row[cmsNameCol]).trim()
      : '';
    const famCode = familyCodeCol !== -1 && row[familyCodeCol] !== null && row[familyCodeCol] !== undefined
      ? String(row[familyCodeCol]).trim()
      : '';
    const famName = familyNameCol !== -1 && row[familyNameCol] !== null && row[familyNameCol] !== undefined
      ? String(row[familyNameCol]).trim()
      : '';
    const mainCat = mainCatCol !== -1 && row[mainCatCol] !== null && row[mainCatCol] !== undefined
      ? String(row[mainCatCol]).trim()
      : '';
    const img = imageCol !== -1 && row[imageCol] !== null && row[imageCol] !== undefined
      ? String(row[imageCol]).trim()
      : '';

    // Ignore completely empty rows
    if (!pimCode && !cmsId && !famCode && !cmsName) continue;

    const item = {
      rowIndex: i + 1,
      pimCategoryCode: pimCode,
      cmsCategoryId: cmsId,
      cmsCategoryName: cmsName,
      familyCode: famCode,
      familyName: famName,
      mainCategory: mainCat,
      image: img
    };

    mappings.push(item);
    if (pimCode) byPimCategoryCode.set(pimCode.toLowerCase(), item);
    if (famCode) byFamilyCode.set(famCode.toLowerCase(), item);
    if (cmsId) byCmsCategoryId.set(cmsId.toLowerCase(), item);
  }

  return {
    mappings,
    byPimCategoryCode,
    byFamilyCode,
    byCmsCategoryId,
    totalCount: mappings.length
  };
}

/**
 * 10. Rebuild Category Mapping structure from edited list
 */
export function rebuildCategoryMappingFromRows(rawRows) {
  const mappings = [];
  const byPimCategoryCode = new Map();
  const byFamilyCode = new Map();
  const byCmsCategoryId = new Map();

  for (let i = 0; i < rawRows.length; i++) {
    const item = rawRows[i];
    const pimCode = String(item.pimCategoryCode || '').trim();
    const cmsId = String(item.cmsCategoryId || '').trim();
    const cmsName = String(item.cmsCategoryName || '').trim();
    const famCode = String(item.familyCode || '').trim();
    const famName = String(item.familyName || '').trim();
    const mainCat = String(item.mainCategory || '').trim();
    const img = String(item.image || '').trim();

    if (!pimCode && !cmsId && !famCode && !cmsName) continue;

    const rec = {
      rowIndex: i + 1,
      pimCategoryCode: pimCode,
      cmsCategoryId: cmsId,
      cmsCategoryName: cmsName,
      familyCode: famCode,
      familyName: famName,
      mainCategory: mainCat,
      image: img
    };

    mappings.push(rec);
    if (pimCode) byPimCategoryCode.set(pimCode.toLowerCase(), rec);
    if (famCode) byFamilyCode.set(famCode.toLowerCase(), rec);
    if (cmsId) byCmsCategoryId.set(cmsId.toLowerCase(), rec);
  }

  return {
    mappings,
    byPimCategoryCode,
    byFamilyCode,
    byCmsCategoryId,
    totalCount: mappings.length
  };
}

/**
 * 11. Parses an Excel sheet containing a list of target IDs (1 column of PRODUCTID or model_code)
 */
export function parseTargetIdListFromSheet(worksheet) {
  const rows = sheetToRawRows(worksheet);
  if (!rows || rows.length === 0) return [];
  const ids = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    // Find first non-empty cell in the row
    const cell = row.find(c => c !== null && c !== undefined && String(c).trim() !== '');
    if (!cell) continue;
    const str = String(cell).trim();
    const lower = str.toLowerCase();
    // Skip common header names in the first row
    if (r === 0 && ['productid', 'product_id', 'id', 'mã sp', 'ma sp', 'mã sản phẩm', 'model', 'model_code', 'stt'].includes(lower)) {
      continue;
    }
    ids.push(str);
  }
  return Array.from(new Set(ids));
}

/**
 * 12. Parses a plain text input containing product IDs (one per line, or comma/tab/space separated)
 */
export function parseTargetIdListFromText(text) {
  if (!text || typeof text !== 'string') return [];
  const parts = text.split(/[\r\n,;\t]+/);
  const ids = parts
    .map(p => p.trim())
    .filter(p => {
      if (!p) return false;
      const lower = p.toLowerCase();
      return !['productid', 'product_id', 'id', 'mã sp', 'ma sp', 'model'].includes(lower);
    });
  return Array.from(new Set(ids));
}

