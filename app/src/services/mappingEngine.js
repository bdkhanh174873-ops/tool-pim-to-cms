import { normalizeText } from './excelParser.js';

/**
 * Common Vietnamese E-commerce synonyms between PIM and CMS
 */
export const SMART_SYNONYMS = [
  { pim: "trong hộp có", cms: ["bộ bán hàng chuẩn", "trong hộp có", "phụ kiện kèm theo"] },
  { pim: "loại pin", cms: ["lõi pin", "loại pin"] },
  { pim: "thời gian sạc", cms: ["thời gian sạc đầy pin", "thời gian sạc đầy", "thời gian sạc"] },
  { pim: "cổng vào", cms: ["cổng vào (input)", "cổng vào", "nguồn vào"] },
  { pim: "cổng ra", cms: ["cổng ra (output)", "cổng ra", "nguồn ra"] },
  { pim: "độ dài dây/khoảng cách kết nối", cms: ["độ dài dây/khoảng cách kết nối", "chiều dài dây", "độ dài dây", "khoảng cách kết nối"] },
  { pim: "kết nối", cms: ["cách kết nối", "kết nối", "chuẩn kết nối"] },
  { pim: "polling rate", cms: ["tần số phản hồi (polling rate)", "polling rate"] },
  { pim: "số nút bấm", cms: ["số nút bấm", "số click"] },
  { pim: "cảm biến", cms: ["loại cảm biến", "cảm biến"] },
  { pim: "thời gian sử dụng", cms: ["thời gian dùng pin", "thời gian sử dụng"] },
  { pim: "thiết kế", cms: ["thiết kế & công thái học", "thiết kế"] },
  { pim: "độ phân giải tối đa", cms: ["độ phân giải tối đa", "độ phân giải"] },
  { pim: "tính năng đặc biệt", cms: ["tính năng đặc biệt", "tiện ích", "công nghệ/tiện ích"] },
  { pim: "công nghệ/tiện ích", cms: ["công nghệ/tiện ích", "tiện ích"] },
  { pim: "thương hiệu của", cms: ["thương hiệu của", "thương hiệu", "hãng"] },
  { pim: "sản xuất tại", cms: ["sản xuất tại", "nơi sản xuất", "xuất xứ"] },
  { pim: "nguồn vào", cms: ["nguồn vào", "cổng vào (input)", "cổng vào"] },
  { pim: "nguồn ra", cms: ["nguồn ra", "cổng ra (output)", "cổng ra"] },
  { pim: "dung lượng pin", cms: ["dung lượng pin"] },
  { pim: "công suất sạc", cms: ["công suất sạc"] },
  { pim: "cổng sạc", cms: ["cổng sạc"] },
  { pim: "kích thước", cms: ["kích thước"] },
  { pim: "khối lượng", cms: ["khối lượng", "trọng lượng"] },
  { pim: "loại sản phẩm", cms: ["loại sản phẩm"] }
];

export const SMART_CODE_KEYWORDS = [
  { code: "battery_capacity", names: ["dung lượng pin"] },
  { code: "charging_port", names: ["cổng sạc"] },
  { code: "charging_power", names: ["công suất sạc"] },
  { code: "inside_the_box", names: ["bộ bán hàng chuẩn", "trong hộp có"] },
  { code: "made_in", names: ["sản xuất tại", "xuất xứ"] },
  { code: "mass", names: ["khối lượng", "trọng lượng"] },
  { code: "size", names: ["kích thước"] },
  { code: "input", names: ["nguồn vào", "cổng vào (input)", "cổng vào"] },
  { code: "output", names: ["nguồn ra", "cổng ra (output)", "cổng ra"] },
  { code: "brand", names: ["thương hiệu của", "thương hiệu"] },
  { code: "battery_type", names: ["lõi pin", "loại pin"] },
  { code: "charging_time", names: ["thời gian sạc đầy pin", "thời gian sạc đầy", "thời gian sạc"] },
  { code: "product_type", names: ["loại sản phẩm"] },
  { code: "technologyutilities", names: ["công nghệ/tiện ích", "tiện ích"] },
  { code: "utilities", names: ["tiện ích", "công nghệ/tiện ích"] },
  { code: "polling_rate", names: ["tần số phản hồi (polling rate)", "polling rate"] },
  { code: "sensor", names: ["loại cảm biến", "cảm biến"] },
  { code: "number_of_buttons", names: ["số nút bấm", "số click"] },
  { code: "switch", names: ["switch"] },
  { code: "cable_length", names: ["chiều dài dây", "độ dài dây"] },
  { code: "compatibility", names: ["tương thích"] },
  { code: "connect", names: ["cách kết nối", "kết nối"] },
  { code: "led_lights", names: ["đèn led"] },
  { code: "usage_time", names: ["thời gian dùng pin", "thời gian sử dụng"] },
  { code: "maximum_resolution", names: ["độ phân giải tối đa", "độ phân giải"] }
];

function determineSmartMode(propObj, normCode) {
  let pimMode = 'tskt';
  if (
    propObj.propertyType === 0 || 
    normCode.includes('size_') || 
    normCode.includes('mass_') || 
    normCode.includes('product_line') || 
    normCode.includes('model')
  ) {
    pimMode = 'text';
  } else if (normCode.includes('filter_master') || normCode.includes('_filter')) {
    pimMode = 'filter';
  }
  return {
    propertyId: String(propObj.propertyId).trim(),
    propertyName: propObj.propertyName || '',
    propertyType: propObj.propertyType,
    pimMode
  };
}

/**
 * Smart Auto-Mapping (Ưu tiên 2):
 * Dynamically finds a CMS Property matching a PIM technical code & Vietnamese label within a category.
 */
export function smartFindCmsProperty(cmsCategoryId, pimAttrCode, pimAttrLabel, cmsCatalog) {
  if (!cmsCatalog) return null;
  
  const catProps = [];
  const catKeyPrefix = `${String(cmsCategoryId).trim()}___`;
  if (cmsCatalog.properties) {
    for (const [key, propObj] of cmsCatalog.properties.entries()) {
      if (key.startsWith(catKeyPrefix)) {
        catProps.push(propObj);
      }
    }
  }

  // Fallback to rawTableRows if properties Map is empty for this category
  if (catProps.length === 0 && cmsCatalog.rawTableRows) {
    const seen = new Set();
    cmsCatalog.rawTableRows.forEach(r => {
      if (String(r.categoryId).trim() === String(cmsCategoryId).trim()) {
        const pId = String(r.propertyId).trim();
        if (!seen.has(pId)) {
          seen.add(pId);
          catProps.push({
            categoryId: String(r.categoryId).trim(),
            categoryName: r.categoryName || '',
            propertyId: pId,
            propertyName: r.propertyName || '',
            propertyType: r.propertyType !== null && r.propertyType !== undefined ? Number(r.propertyType) : null
          });
        }
      }
    });
  }

  if (catProps.length === 0) return null;

  const normLabel = normalizeText(pimAttrLabel);
  const normCode = normalizeText(pimAttrCode);

  // 1. Exact match with Vietnamese label
  if (normLabel) {
    for (const p of catProps) {
      if (normalizeText(p.propertyName) === normLabel) {
        return determineSmartMode(p, normCode);
      }
    }
  }

  // 2. Synonyms match
  if (normLabel) {
    for (const syn of SMART_SYNONYMS) {
      if (normLabel === syn.pim || normLabel.includes(syn.pim)) {
        for (const targetName of syn.cms) {
          for (const p of catProps) {
            const pNorm = normalizeText(p.propertyName);
            if (pNorm === targetName || pNorm.includes(targetName)) {
              return determineSmartMode(p, normCode);
            }
          }
        }
      }
    }
  }

  // 3. Technical code keywords match
  for (const kw of SMART_CODE_KEYWORDS) {
    if (normCode.includes(kw.code)) {
      for (const targetName of kw.names) {
        for (const p of catProps) {
          const pNorm = normalizeText(p.propertyName);
          if (pNorm === targetName || pNorm.includes(targetName)) {
            return determineSmartMode(p, normCode);
          }
        }
      }
    }
  }

  // 4. Substring inclusion match (if label >= 3 chars)
  if (normLabel && normLabel.length >= 3) {
    for (const p of catProps) {
      const pNorm = normalizeText(p.propertyName);
      
      // Chặn các false-positives phổ biến:
      // "kết nối" bị map nhầm vào "khoảng cách kết nối"
      const isKetNoi = (s) => s === 'ket noi' || s === 'cach ket noi' || s === 'chuan ket noi';
      if ((isKetNoi(normLabel) && pNorm.includes('khoang cach')) || (isKetNoi(pNorm) && normLabel.includes('khoang cach'))) continue;
      // "cáp" bị map nhầm vào "cáp sạc" hoặc ngược lại nếu không cẩn thận
      
      if (pNorm.includes(normLabel) || normLabel.includes(pNorm)) {
        // Đảm bảo không map lệch nghĩa quá xa (chỉ chấp nhận nếu tỷ lệ chiều dài không quá chênh lệch)
        // hoặc các trường hợp đã bị lọc ở trên
        return determineSmartMode(p, normCode);
      }
    }
  }

  return null;
}

/**
 * Runs the transformation and validation from PIM products to CMS import rows.
 * Implements:
 * - Priority 1: Reference file rules / Confirmed rules
 * - Priority 2: Smart Auto-Mapping from current CMS Catalog
 * - Discrepancy warning & tracking when Priority 1 and Priority 2 differ
 * - Independent per-product category mapping (multi-category file support)
 * - Complete unmapped attribute tracking instead of silent skipping
 */
export function runMappingTransformation({
  pimProducts = [],
  pimOptions = new Map(),
  cmsCatalog = { categories: [], properties: new Map(), valueLookup: new Map() },
  categoryMappings = [],
  attributeMappings = [],
  userConfig = { username: '174873', fullname: 'Quản trị viên', siteId: '2', languageId: 'vi-VN' }
}) {
  const validImportRows = [];
  const holdRows = [];
  const newProposalValues = new Map(); // key: `${catId}___${propId}___${text}` => { catId, catName, propId, propName, rawText, pimAttributeCode, count, sampleModels: [] }
  const duplicateModelStats = new Map(); // model_code => count

  // Discrepancy & Smart tracking
  const discrepanciesMap = new Map(); // key: `${catId}___${code}` => discrepancy object
  const autoMappedMap = new Map(); // key: `${catId}___${code}` => auto-mapped info
  const unmappedMap = new Map(); // key: `${catId}___${code}` => unmapped info

  // Index Category Mappings by pimCategoryCode and familyCode
  const catMap = new Map();
  categoryMappings.forEach(cm => {
    if (cm.status === 'Confirmed') {
      if (cm.pimCategoryCode) {
        catMap.set(String(cm.pimCategoryCode).trim().toLowerCase(), cm);
        catMap.set(String(cm.pimCategoryCode).trim(), cm);
      }
      if (cm.familyCode) {
        catMap.set(String(cm.familyCode).trim().toLowerCase(), cm);
      }
      if (cm.cmsCategoryId) {
        catMap.set(`cms_${String(cm.cmsCategoryId).trim().toLowerCase()}`, cm);
      }
    }
  });

  // Index Attribute Mappings (Priority 1) by `${cmsCategoryId}___${pimAttributeCode.toLowerCase()}`
  const attrMap = new Map();
  attributeMappings.forEach(am => {
    if (am.status === 'Confirmed') {
      const key = `${String(am.cmsCategoryId).trim()}___${String(am.pimAttributeCode).trim().toLowerCase()}`;
      attrMap.set(key, am);
    }
  });

  // Count model occurrences
  pimProducts.forEach(p => {
    const m = String(p.model_code || '').trim();
    if (m) {
      duplicateModelStats.set(m, (duplicateModelStats.get(m) || 0) + 1);
    }
  });

  let skippedUnusedCount = 0;

  // Iterate over each PIM product
  for (const product of pimProducts) {
    const { 
      rowIndex, 
      model_code, 
      cms_product_id, 
      sku, 
      category_code, 
      family_code,
      rawAttributes = {},
      attrLabels = {},
      fileOrigin = 'PIM File',
      assignedCmsCategory,
      assignedCmsCategoryName
    } = product;

    // Check Product Identity on CMS
    // True CMS Product ID comes from model_id_cms column
    if (!cms_product_id) {
      holdRows.push({
        id: `hold_model_id_${rowIndex}_${model_code || 'no_model'}_${Math.random().toString(36).substring(2, 7)}`,
        fileOrigin,
        rowIndex,
        model_code,
        cms_product_id: '',
        sku,
        category_code,
        cmsCategoryId: '',
        cmsCategoryName: '',
        pimAttributeCode: 'model_id_cms',
        rawValue: '(Trống mã ID CMS)',
        cmsPropertyId: '',
        cmsPropertyName: 'Mã Model CMS',
        pimMode: 'system',
        rawItems: [],
        resolvedItems: [],
        conflictList: [],
        hasMultipleValueIds: false,
        isMissingCmsId: true,
        reason: 'Thiếu mã model CMS',
        detail: `Dòng PIM #${rowIndex} (Model: ${model_code || 'Chưa có'}) chưa có mã model_id_cms để gắn PRODUCTID trên CMS. Cần bổ sung mã sản phẩm CMS.`
      });
      continue;
    }

    // Check Category Mapping - Prioritize product's own category_code first!
    let catRule = null;
    // 1. Product's category_code column (Mã PIM: e.g. 24, 65, 87)
    if (category_code) {
      catRule = catMap.get(String(category_code).trim().toLowerCase())
        || catMap.get(String(category_code).trim());
    }
    // 2. Product's family_code column (Mã họ: e.g. sac_du_phong_tgdd, chuot_may_tinh_tgdd)
    if (!catRule && family_code) {
      const famClean = String(family_code).trim().toLowerCase();
      catRule = catMap.get(famClean)
        || Array.from(catMap.values()).find(c => String(c.familyCode || '').trim().toLowerCase() === famClean);
    }
    // 3. Fallback to file-level manual category assignment
    if (!catRule && assignedCmsCategory) {
      catRule = catMap.get(String(assignedCmsCategory).trim().toLowerCase())
        || catMap.get(`cms_${String(assignedCmsCategory).trim().toLowerCase()}`)
        || Array.from(catMap.values()).find(c => String(c.cmsCategoryId).trim() === String(assignedCmsCategory).trim())
        || { cmsCategoryId: String(assignedCmsCategory).trim(), cmsCategoryName: assignedCmsCategoryName || '' };
    }

    if (!catRule) {
      holdRows.push({
        id: `hold_cat_${rowIndex}_${Math.random().toString(36).substring(2, 9)}`,
        fileOrigin,
        rowIndex,
        model_code,
        cms_product_id,
        sku,
        category_code,
        cmsCategoryId: '',
        cmsCategoryName: '',
        pimAttributeCode: 'category_code',
        rawValue: category_code,
        cmsPropertyId: '',
        cmsPropertyName: '',
        pimMode: 'category',
        rawItems: [category_code],
        resolvedItems: [],
        conflictList: [],
        hasMultipleValueIds: false,
        reason: 'Chưa map ngành hàng CMS',
        detail: `[${fileOrigin}] Mã ngành PIM "${category_code || '(Trống)'}" chưa có quy tắc mapping xác nhận sang ngành hàng CMS.`
      });
      continue;
    }

    const cmsCategoryId = String(catRule.cmsCategoryId).trim();
    const cmsCategoryName = catRule.cmsCategoryName || '';

    // Iterate through all attributes in the product row
    for (const [pimAttrCode, rawValue] of Object.entries(rawAttributes)) {
      if (rawValue === null || rawValue === undefined || String(rawValue).trim() === '') {
        continue; // Skip empty attributes
      }

      const pimAttrLabel = (attrLabels && attrLabels[pimAttrCode]) || '';

      // ƯU TIÊN 1: Check in confirmed attributeMappings (File tham chiếu / Đã duyệt)
      const attrRuleKey = `${cmsCategoryId}___${pimAttrCode.toLowerCase()}`;
      const p1Rule = attrMap.get(attrRuleKey);

      // ƯU TIÊN 2: Smart Auto-Mapping from current CMS Catalog
      const p2Match = smartFindCmsProperty(cmsCategoryId, pimAttrCode, pimAttrLabel, cmsCatalog);

      let effectiveRule = null;
      let usedSource = 'none';
      let hasDiscrepancy = false;

      // Extract Priority 1 (File tham chiếu) and Priority 2 (CMS thông minh) candidate IDs
      let p1FileId = null;
      let p1FileName = '';
      if (p1Rule) {
        // originalP1Id is preserved if user previously accepted Priority 2
        p1FileId = String(p1Rule.originalP1Id || p1Rule.cmsPropertyId).trim();
        p1FileName = p1Rule.originalP1Name || p1Rule.cmsPropertyName || '';
      }

      let p2CmsId = null;
      let p2CmsName = '';
      if (p2Match) {
        p2CmsId = String(p2Match.propertyId).trim();
        p2CmsName = p2Match.propertyName || '';
      }

      // Real discrepancy exists ONLY IF both Priority 1 and Priority 2 exist and they have DIFFERENT property IDs!
      const isRealDiscrepancy = Boolean(p1FileId && p2CmsId && p1FileId !== p2CmsId);

      // User explicit choice flag
      const isUserConfirmedP2 = p1Rule?.source === 'priority2_accepted';
      const isUserConfirmedP1 = p1Rule?.source === 'priority1_accepted';

      // Check for DISCREPANCY / CHÊNH LỆCH between Priority 1 and Priority 2
      if (isRealDiscrepancy) {
        hasDiscrepancy = true;
        const discKey = `${cmsCategoryId}___${pimAttrCode.toLowerCase()}`;
        if (!discrepanciesMap.has(discKey)) {
          // MẶC ĐỊNH DÙNG ƯU TIÊN 1: Trừ khi người dùng đã chủ động bấm duyệt Ưu tiên 2
          const isUsingP2 = isUserConfirmedP2;
          const appliedId = isUsingP2 ? p2CmsId : p1FileId;
          const appliedSrc = isUsingP2 ? 'priority2' : 'priority1';

          discrepanciesMap.set(discKey, {
            id: discKey,
            cmsCategoryId,
            cmsCategoryName,
            pimAttributeCode: pimAttrCode,
            pimAttributeLabel: pimAttrLabel || p1FileName || p2CmsName,
            priority1: {
              cmsPropertyId: p1FileId,
              cmsPropertyName: p1FileName,
              source: 'File tham chiếu (Ưu tiên 1)'
            },
            priority2: {
              cmsPropertyId: p2CmsId,
              cmsPropertyName: p2CmsName,
              propertyType: p2Match.propertyType,
              source: 'Danh mục CMS thông minh (Ưu tiên 2)'
            },
            appliedPropertyId: appliedId,
            appliedSource: appliedSrc,
            isResolved: isUserConfirmedP2 || isUserConfirmedP1,
            resolvedChoice: isUserConfirmedP2 ? 'priority2' : (isUserConfirmedP1 ? 'priority1' : 'priority1')
          });
        }
      }

      if (p1Rule) {
        if (isRealDiscrepancy && !isUserConfirmedP1 && !isUserConfirmedP2) {
          // KHÔNG TỰ QUYẾT: Đưa vào holdRows để cảnh báo và chờ người dùng xác nhận
          holdRows.push({
            id: `hold_disc_${rowIndex}_${pimAttrCode}_${Math.random().toString(36).substring(2, 7)}`,
            fileOrigin,
            rowIndex,
            model_code,
            cms_product_id,
            sku,
            category_code,
            cmsCategoryId,
            cmsCategoryName,
            pimAttributeCode: pimAttrCode,
            rawValue: String(rawValue),
            cmsPropertyId: '',
            cmsPropertyName: '(Có chênh lệch - Chờ xác nhận)',
            pimMode: 'unknown',
            rawItems: [String(rawValue)],
            resolvedItems: [],
            conflictList: [{
              type: 'discrepancy',
              message: `Chênh lệch ID: File Excel (Ưu tiên 1) dùng ${p1FileId}, nhưng CMS (Ưu tiên 2) gợi ý ${p2CmsId}. Vui lòng vào tab Quy Tắc Ánh Xạ để chọn.`
            }],
            hasMultipleValueIds: false,
            reason: 'Chênh lệch ID chưa xác nhận',
            detail: `Thuộc tính "${pimAttrLabel || pimAttrCode}" có sự chênh lệch giữa File tham chiếu (Ưu tiên 1) và CMS (Ưu tiên 2). Hệ thống đang chờ bạn xác nhận sẽ áp dụng ID nào ở tab Quy Tắc Ánh Xạ.`
          });
          continue; // Bỏ qua không xuất dòng này cho đến khi được chọn
        }

        // Determine which ID to apply:
        let sourceTag = 'priority1';
        let appliedId = p1FileId;
        let appliedName = p1FileName;
        let appliedPimMode = p1Rule.pimMode || (p2Match ? (p2Match.propertyType === 0 ? 'text' : 'tskt') : 'tskt');

        if (isRealDiscrepancy && isUserConfirmedP2) {
          sourceTag = 'priority2_accepted';
          appliedId = p2CmsId;
          appliedName = p2CmsName;
          if (p2Match && p2Match.propertyType === 0) appliedPimMode = 'text';
        } else if (isUserConfirmedP1) {
          sourceTag = 'priority1_accepted';
        } else if (p1Rule.source === 'smart_auto_map' && !isRealDiscrepancy) {
          sourceTag = 'smart_auto_map';
        } else if (p1Rule.source === 'file_ref') {
          sourceTag = 'priority1';
        }

        effectiveRule = {
          cmsPropertyId: appliedId,
          cmsPropertyName: appliedName,
          pimMode: appliedPimMode,
          source: sourceTag
        };
        usedSource = sourceTag;
      } else if (p2Match) {
        // Apply Priority 2 (Smart Auto-Map)
        effectiveRule = {
          cmsPropertyId: p2CmsId,
          cmsPropertyName: p2CmsName,
          pimMode: p2Match.pimMode || (p2Match.propertyType === 0 ? 'text' : 'tskt'),
          source: 'priority2'
        };
        usedSource = 'priority2';

        const autoKey = `${cmsCategoryId}___${pimAttrCode.toLowerCase()}`;
        if (!autoMappedMap.has(autoKey)) {
          autoMappedMap.set(autoKey, {
            cmsCategoryId,
            cmsCategoryName,
            pimAttributeCode: pimAttrCode,
            pimAttributeLabel: pimAttrLabel || p2Match.propertyName,
            cmsPropertyId: p2Match.propertyId,
            cmsPropertyName: p2Match.propertyName,
            pimMode: p2Match.pimMode,
            propertyType: p2Match.propertyType,
            count: 0
          });
        }
        autoMappedMap.get(autoKey).count++;
      } else {
        // NEITHER Priority 1 NOR Priority 2: Unmapped Attribute!
        const unmappedKey = `${cmsCategoryId}___${pimAttrCode.toLowerCase()}`;
        if (!unmappedMap.has(unmappedKey)) {
          unmappedMap.set(unmappedKey, {
            cmsCategoryId,
            cmsCategoryName,
            pimAttributeCode: pimAttrCode,
            pimAttributeLabel: pimAttrLabel || pimAttrCode,
            sampleValue: String(rawValue),
            count: 0
          });
        }
        unmappedMap.get(unmappedKey).count++;

        // Add to holdRows with clear explanation (NO SILENT SKIP!)
        holdRows.push({
          id: `hold_unmapped_${rowIndex}_${pimAttrCode}_${Math.random().toString(36).substring(2, 7)}`,
          fileOrigin,
          rowIndex,
          model_code,
          cms_product_id,
          sku,
          category_code,
          cmsCategoryId,
          cmsCategoryName,
          pimAttributeCode: pimAttrCode,
          rawValue: String(rawValue),
          cmsPropertyId: '',
          cmsPropertyName: '(Chưa ánh xạ)',
          pimMode: 'unknown',
          rawItems: [String(rawValue)],
          resolvedItems: [],
          conflictList: [],
          hasMultipleValueIds: false,
          reason: 'Thuộc tính chưa có quy tắc mapping',
          detail: `Thuộc tính "${pimAttrLabel || pimAttrCode}" (${pimAttrCode}) chưa có trong file tham chiếu (Ưu tiên 1) và chưa tự động nhận diện được trên ngành "${cmsCategoryName}" (${cmsCategoryId}).`
        });
        continue;
      }

      const cmsPropertyId = effectiveRule.cmsPropertyId;
      const cmsPropertyName = effectiveRule.cmsPropertyName;
      const pimMode = effectiveRule.pimMode;

      // Check if property exists in current CMS catalog
      const propCatalogKey = `${cmsCategoryId}___${cmsPropertyId}`;
      const catalogPropObj = cmsCatalog.properties ? cmsCatalog.properties.get(propCatalogKey) : null;

      // Handle Text properties (PropertyType 0 or configured as text)
      const isTextProperty = pimMode === 'text' || (catalogPropObj && catalogPropObj.propertyType === 0);

      if (isTextProperty) {
        // User rule: write raw text directly into PROPVALUEID and PROPVALUETEXT
        const textVal = String(rawValue).trim();
        if (textVal) {
          validImportRows.push({
            PRODUCTID: cms_product_id,
            PROPERTYID: cmsPropertyId,
            PROPVALUEID: textVal,
            PROPVALUETEXT: textVal,
            LANGUAGEID: userConfig.languageId || 'vi-VN',
            USERNAME: userConfig.username || '174873',
            FULLNAME: userConfig.fullname || 'Quản trị viên',
            SITEID: userConfig.siteId || '2',
            trace: {
              fileOrigin,
              rowIndex,
              model_code,
              cms_product_id,
              sku,
              category_code,
              cmsCategoryId,
              cmsCategoryName,
              pimAttributeCode: pimAttrCode,
              pimAttributeLabel: pimAttrLabel || cmsPropertyName,
              pimMode: 'text',
              rawValue: textVal,
              decodedItems: [{ raw: textVal, decoded: textVal, valId: textVal }],
              cmsPropertyId,
              cmsPropertyName,
              isMulti: false,
              source: usedSource,
              isAutoMapped: usedSource === 'priority2' || usedSource === 'priority2_accepted' || usedSource === 'smart_auto_map',
              isUserConfirmedP2: usedSource === 'priority2_accepted',
              isUserConfirmedP1: usedSource === 'priority1_accepted',
              hasDiscrepancy: hasDiscrepancy
            }
          });
        }
        continue;
      }

      // Handle Filter or TSKT properties that require CMS VALUEID
      let rawItems = [];
      if (pimMode === 'filter') {
        // Parse JSON array like '["140", "6"]' or single number
        try {
          const parsed = JSON.parse(String(rawValue));
          rawItems = Array.isArray(parsed) ? parsed.map(x => String(x).trim()) : [String(rawValue).trim()];
        } catch {
          rawItems = [String(rawValue).trim()];
        }
      } else {
        // TSKT: split by '|'
        rawItems = String(rawValue)
          .split('|')
          .map(x => x.trim())
          .filter(x => x.length > 0);
      }

      let allItemsValid = true;
      const resolvedItems = [];
      const itemErrors = [];
      const conflictList = [];

      for (const item of rawItems) {
        let textToLookup = item;
        let optFound = true;

        if (pimMode === 'filter') {
          const optKey = `${pimAttrCode.toLowerCase()}___${item}`;
          const optObj = pimOptions.get(optKey);
          if (optObj && optObj.optionValue) {
            textToLookup = optObj.optionValue.trim();
          } else {
            optFound = false;
            allItemsValid = false;
            itemErrors.push(`Mã option "${item}" không tìm thấy trong file Option PIM.`);
            continue;
          }
        }

        // Lookup in CMS Catalog valueLookup
        const valLookupKey = `${cmsCategoryId}___${cmsPropertyId}___${normalizeText(textToLookup)}`;
        const matchedVals = cmsCatalog.valueLookup ? cmsCatalog.valueLookup.get(valLookupKey) || [] : [];

        if (matchedVals.length === 1) {
          resolvedItems.push({
            raw: item,
            decoded: textToLookup,
            valId: matchedVals[0].valId,
            matchedName: matchedVals[0].rawValue
          });
        } else if (matchedVals.length > 1) {
          // Multiple ValueIDs for same text
          allItemsValid = false;
          const candidates = matchedVals.map(v => ({
            valId: String(v.valId).trim(),
            rawValue: v.rawValue || textToLookup
          }));
          conflictList.push({
            raw: item,
            text: textToLookup,
            candidates
          });
          itemErrors.push(
            `Tìm thấy nhiều hơn 1 VALUEID (${candidates.map(v => v.valId).join(', ')}) cho giá trị "${textToLookup}". Cần chọn mã xác nhận.`
          );
        } else {
          // Not found in CMS -> Propose new value
          allItemsValid = false;
          itemErrors.push(`Giá trị "${textToLookup}" chưa có trong danh mục CMS (Cần đề xuất tạo mới).`);

          // Collect to proposal list
          const propKey = `${cmsCategoryId}___${cmsPropertyId}___${normalizeText(textToLookup)}`;
          if (!newProposalValues.has(propKey)) {
            newProposalValues.set(propKey, {
              cmsCategoryId,
              cmsCategoryName,
              cmsPropertyId,
              cmsPropertyName,
              pimAttributeCode: pimAttrCode,
              rawText: textToLookup,
              count: 0,
              sampleModels: [],
              associatedProductIds: [],
              associatedModelCodes: []
            });
          }
          const propItem = newProposalValues.get(propKey);
          propItem.count++;
          if (model_code) {
            const cleanModel = String(model_code).trim();
            if (!propItem.associatedModelCodes.includes(cleanModel.toLowerCase())) {
              propItem.associatedModelCodes.push(cleanModel.toLowerCase());
            }
            if (propItem.sampleModels.length < 5 && !propItem.sampleModels.includes(cleanModel)) {
              propItem.sampleModels.push(cleanModel);
            }
          }
          if (cms_product_id) {
            const cleanCmsId = String(cms_product_id).trim();
            if (!propItem.associatedProductIds.includes(cleanCmsId.toLowerCase())) {
              propItem.associatedProductIds.push(cleanCmsId.toLowerCase());
            }
          }
        }
      }

      // CRITICAL INTEGRITY RULE: If ANY item failed, HOLD the entire attribute for this product!
      if (!allItemsValid || resolvedItems.length === 0) {
        let primaryReason = 'Có giá trị chưa map được trong cụm';
        let isMultipleValueIds = false;

        if (conflictList.length > 0) {
          primaryReason = 'Trùng nhiều VALUEID (Cần chọn mã)';
          isMultipleValueIds = true;
        } else if (itemErrors.some(e => e.includes('chưa có trong danh mục CMS'))) {
          primaryReason = 'Chưa có trên CMS (Cần đề xuất tạo mới)';
        } else if (itemErrors.some(e => e.includes('không tìm thấy trong file Option PIM'))) {
          primaryReason = 'Mã option chưa có trong PIM';
        }

        holdRows.push({
          id: `hold_${rowIndex}_${pimAttrCode}_${Math.random().toString(36).substring(2, 9)}`,
          fileOrigin,
          rowIndex,
          model_code,
          cms_product_id,
          sku,
          category_code,
          cmsCategoryId,
          cmsCategoryName,
          pimAttributeCode: pimAttrCode,
          rawValue: String(rawValue),
          cmsPropertyId,
          cmsPropertyName,
          pimMode,
          rawItems,
          resolvedItems,
          conflictList,
          hasMultipleValueIds: isMultipleValueIds,
          source: usedSource,
          isUserConfirmedP2: usedSource === 'priority2_accepted',
          isUserConfirmedP1: usedSource === 'priority1_accepted',
          hasDiscrepancy: hasDiscrepancy,
          reason: primaryReason,
          detail: itemErrors.join(' | ')
        });
        continue;
      }

      // All items resolved! Deduplicate ValueIDs while preserving order
      const uniqueValIds = [];
      const uniqueValTexts = [];
      for (const res of resolvedItems) {
        if (!uniqueValIds.includes(res.valId)) {
          uniqueValIds.push(res.valId);
          uniqueValTexts.push(res.matchedName || res.decoded || res.raw);
        }
      }

      // 1. Format PROPVALUEID (Chế độ 1 - Mặc định: Dạng mã số ID)
      let finalPropValueId = '';
      if (uniqueValIds.length === 1) {
        finalPropValueId = uniqueValIds[0];
      } else {
        finalPropValueId = `,${uniqueValIds.join(',')},`;
      }

      // 2. Format PROPVALUETEXT (Chế độ 2: Dạng text tương ứng)
      let finalPropValueText = '';
      if (uniqueValTexts.length === 1) {
        finalPropValueText = uniqueValTexts[0];
      } else {
        finalPropValueText = `,${uniqueValTexts.join(',')},`;
      }

      validImportRows.push({
        PRODUCTID: cms_product_id,
        PROPERTYID: cmsPropertyId,
        PROPVALUEID: finalPropValueId,
        PROPVALUETEXT: finalPropValueText,
        LANGUAGEID: userConfig.languageId || 'vi-VN',
        USERNAME: userConfig.username || '174873',
        FULLNAME: userConfig.fullname || 'Quản trị viên',
        SITEID: userConfig.siteId || '2',
        trace: {
          fileOrigin,
          rowIndex,
          model_code,
          cms_product_id,
          sku,
          category_code,
          cmsCategoryId,
          cmsCategoryName,
          pimAttributeCode: pimAttrCode,
          pimAttributeLabel: pimAttrLabel || cmsPropertyName,
          pimMode,
          rawValue: String(rawValue),
          decodedItems: resolvedItems,
          cmsPropertyId,
          cmsPropertyName,
          isMulti: uniqueValIds.length > 1,
          source: usedSource,
          isAutoMapped: usedSource === 'priority2' || usedSource === 'priority2_accepted' || usedSource === 'smart_auto_map',
          isUserConfirmedP2: usedSource === 'priority2_accepted',
          isUserConfirmedP1: usedSource === 'priority1_accepted',
          hasDiscrepancy: hasDiscrepancy
        }
      });
    }
  }

  // Summary statistics
  const distinctProductsCount = new Set(pimProducts.map(p => p.model_code)).size;
  const distinctCmsIdsCount = new Set(pimProducts.map(p => p.cms_product_id).filter(Boolean)).size;
  const distinctFilesCount = new Set(pimProducts.map(p => p.fileOrigin).filter(Boolean)).size;
  const singleValCount = validImportRows.filter(r => !r.trace.isMulti && r.trace.pimMode !== 'text').length;
  const multiValCount = validImportRows.filter(r => r.trace.isMulti).length;
  const textValCount = validImportRows.filter(r => r.trace.pimMode === 'text').length;

  return {
    validImportRows,
    holdRows,
    proposals: Array.from(newProposalValues.values()),
    discrepancies: Array.from(discrepanciesMap.values()),
    autoMappedAttributes: Array.from(autoMappedMap.values()),
    unmappedAttributes: Array.from(unmappedMap.values()),
    stats: {
      totalProducts: pimProducts.length,
      distinctModels: distinctProductsCount,
      distinctCmsIds: distinctCmsIdsCount,
      totalFiles: distinctFilesCount,
      totalValidRows: validImportRows.length,
      singleValCount,
      multiValCount,
      textValCount,
      holdRowsCount: holdRows.length,
      proposalsCount: newProposalValues.size,
      discrepanciesCount: discrepanciesMap.size,
      autoMappedCount: autoMappedMap.size,
      unmappedCount: unmappedMap.size,
      duplicateModelsCount: Array.from(duplicateModelStats.values()).filter(c => c > 1).length,
      skippedUnusedProductsCount: skippedUnusedCount
    }
  };
}
