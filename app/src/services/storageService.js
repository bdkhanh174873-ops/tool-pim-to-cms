const STORAGE_KEYS = {
  CATEGORY_MAPPINGS: 'pim_cms_cat_mappings_v1',
  ATTRIBUTE_MAPPINGS: 'pim_cms_attr_mappings_v1',
  VALUE_MAPPINGS: 'pim_cms_value_mappings_v1',
  AUDIT_LOGS: 'pim_cms_audit_logs_v1',
  USER_CONFIG: 'pim_cms_user_config_v1'
};

/**
 * Default Category Mappings
 */
const DEFAULT_CAT_MAPPINGS = [
  {
    pimCategoryCode: '87',
    cmsCategoryId: '9499',
    cmsCategoryName: 'Adapter sạc',
    status: 'Confirmed', // 'Confirmed' | 'Pending' | 'Disabled'
    confirmedBy: 'Admin',
    confirmedAt: new Date().toISOString()
  }
];

/**
 * Default Attribute Mappings for Adapter sạc (9499)
 * Note: inside_the_box_is_tskt_master maps to 26601 as confirmed by user.
 */
const DEFAULT_ATTR_MAPPINGS = [
  // Ngành 57 - Sạc dự phòng (Quy tắc chuẩn bất di bất dịch từ thuoc_tinh_pim_cms.xlsx)
  {
    cmsCategoryId: '57',
    pimAttributeCode: 'battery_capacity_filter_master',
    cmsPropertyId: '500',
    cmsPropertyName: 'Dung lượng pin',
    pimMode: 'filter',
    status: 'Confirmed',
    source: 'file_ref',
    note: 'Chỉ dùng cho Filter (Mã 500)',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '57',
    pimAttributeCode: 'battery_capacity_tskt_master',
    cmsPropertyId: '23370',
    cmsPropertyName: 'Dung lượng pin',
    pimMode: 'tskt',
    status: 'Confirmed',
    source: 'file_ref',
    note: 'Chỉ dùng cho TSKT (Mã 23370)',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '57',
    pimAttributeCode: 'exit_gate_filter_master',
    cmsPropertyId: '23352',
    cmsPropertyName: 'Cổng ra (Output)',
    pimMode: 'filter',
    status: 'Confirmed',
    source: 'file_ref',
    note: 'Ưu tiên 1 File tham chiếu: Cổng ra Filter dùng mã 23352',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '57',
    pimAttributeCode: 'gateway_filter_master',
    cmsPropertyId: '23351',
    cmsPropertyName: 'Cổng vào (Input)',
    pimMode: 'filter',
    status: 'Confirmed',
    source: 'file_ref',
    note: 'Ưu tiên 1 File tham chiếu: Cổng vào Filter dùng mã 23351',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '57',
    pimAttributeCode: 'output_tskt_master',
    cmsPropertyId: '21149',
    cmsPropertyName: 'Nguồn ra',
    pimMode: 'tskt',
    status: 'Confirmed',
    source: 'file_ref',
    note: 'Ưu tiên 1 File tham chiếu: Nguồn ra TSKT dùng mã 21149',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '57',
    pimAttributeCode: 'input_tskt_master',
    cmsPropertyId: '6441',
    cmsPropertyName: 'Nguồn vào',
    pimMode: 'tskt',
    status: 'Confirmed',
    source: 'file_ref',
    note: 'Ưu tiên 1 File tham chiếu: Nguồn vào TSKT dùng mã 6441',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '57',
    pimAttributeCode: 'inside_the_box_is_tskt_master',
    cmsPropertyId: '10039',
    cmsPropertyName: 'Trong hộp có',
    pimMode: 'tskt',
    status: 'Confirmed',
    source: 'file_ref',
    note: 'Ưu tiên 1 File tham chiếu: Trong hộp có dùng mã 10039',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '57',
    pimAttributeCode: 'charging_power_filter_master',
    cmsPropertyId: '34898',
    cmsPropertyName: 'Công suất sạc',
    pimMode: 'filter',
    status: 'Confirmed',
    source: 'file_ref',
    note: 'Ưu tiên 1 File tham chiếu: Công suất sạc dùng mã 34898',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '57',
    pimAttributeCode: 'utilities_filter_master',
    cmsPropertyId: '20639',
    cmsPropertyName: 'Tiện ích',
    pimMode: 'filter',
    status: 'Confirmed',
    source: 'file_ref',
    note: 'Ưu tiên 1 File tham chiếu: Tiện ích Filter dùng mã 20639',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '57',
    pimAttributeCode: 'technologyutilities_tskt_master',
    cmsPropertyId: '21148',
    cmsPropertyName: 'Công nghệ/Tiện ích',
    pimMode: 'tskt',
    status: 'Confirmed',
    source: 'file_ref',
    note: 'Ưu tiên 1 File tham chiếu: Công nghệ/Tiện ích TSKT dùng mã 21148',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '9499',
    pimAttributeCode: 'charging_power_filter_master',
    cmsPropertyId: '28918',
    cmsPropertyName: 'Công suất sạc',
    pimMode: 'filter', // 'filter' | 'tskt' | 'text'
    status: 'Confirmed',
    note: 'Filter option decode',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '9499',
    pimAttributeCode: 'charging_port_filter_master',
    cmsPropertyId: '34921',
    cmsPropertyName: 'Cổng sạc',
    pimMode: 'filter',
    status: 'Confirmed',
    note: 'Filter option decode',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '9499',
    pimAttributeCode: 'number_of_charging_ports_filter_master',
    cmsPropertyId: '30517',
    cmsPropertyName: 'Số cổng sạc',
    pimMode: 'filter',
    status: 'Confirmed',
    note: 'Filter option decode',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '9499',
    pimAttributeCode: 'product_type_filter_master',
    cmsPropertyId: '26599',
    cmsPropertyName: 'Loại sản phẩm',
    pimMode: 'filter',
    status: 'Confirmed',
    note: 'Filter option decode',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '9499',
    pimAttributeCode: 'utilities_filter_master',
    cmsPropertyId: '26598',
    cmsPropertyName: 'Tiện ích',
    pimMode: 'filter',
    status: 'Confirmed',
    note: 'Filter option decode',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '9499',
    pimAttributeCode: 'brand_of_tskt_master',
    cmsPropertyId: '26617',
    cmsPropertyName: 'Thương hiệu của',
    pimMode: 'tskt',
    status: 'Confirmed',
    note: 'TSKT text split by |',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '9499',
    pimAttributeCode: 'input_tskt_master',
    cmsPropertyId: '26612',
    cmsPropertyName: 'Đầu vào',
    pimMode: 'tskt',
    status: 'Confirmed',
    note: 'TSKT text split by |',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '9499',
    pimAttributeCode: 'inside_the_box_is_tskt_master',
    cmsPropertyId: '26601', // User confirmed 26601 is correct
    cmsPropertyName: 'Trong hộp có',
    pimMode: 'tskt',
    status: 'Confirmed',
    note: 'Đã xác nhận mã 26601 theo danh mục CMS mới',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '9499',
    pimAttributeCode: 'made_in_tskt_master',
    cmsPropertyId: '26616',
    cmsPropertyName: 'Sản xuất tại',
    pimMode: 'tskt',
    status: 'Confirmed',
    note: 'TSKT text split by |',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '9499',
    pimAttributeCode: 'output_tskt_master',
    cmsPropertyId: '26613',
    cmsPropertyName: 'Đầu ra',
    pimMode: 'tskt',
    status: 'Confirmed',
    note: 'TSKT text split by |',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '9499',
    pimAttributeCode: 'product_line_tskt_master',
    cmsPropertyId: '26609',
    cmsPropertyName: 'Model',
    pimMode: 'text', // PropertyType 0 - Text
    status: 'Confirmed',
    note: 'Thuộc tính Text ghi thẳng giá trị vào PROPVALUEID',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '9499',
    pimAttributeCode: 'size_tskt_master',
    cmsPropertyId: '26615',
    cmsPropertyName: 'Kích thước',
    pimMode: 'text', // PropertyType 0 - Text
    status: 'Confirmed',
    note: 'Thuộc tính Text ghi thẳng giá trị vào PROPVALUEID',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '9499',
    pimAttributeCode: 'supports_maximum_charging_tskt_master',
    cmsPropertyId: '26614',
    cmsPropertyName: 'Dòng sạc tối đa',
    pimMode: 'tskt',
    status: 'Confirmed',
    note: 'TSKT text split by |',
    updatedAt: new Date().toISOString()
  },
  {
    cmsCategoryId: '9499',
    pimAttributeCode: 'technologyutilities_tskt_master',
    cmsPropertyId: '26608',
    cmsPropertyName: 'Công nghệ/Tiện ích',
    pimMode: 'tskt',
    status: 'Confirmed',
    note: 'TSKT text split by |',
    updatedAt: new Date().toISOString()
  }
];

export function getCategoryMappings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORY_MAPPINGS);
    return raw ? JSON.parse(raw) : DEFAULT_CAT_MAPPINGS;
  } catch {
    return DEFAULT_CAT_MAPPINGS;
  }
}

export function saveCategoryMappings(mappings) {
  localStorage.setItem(STORAGE_KEYS.CATEGORY_MAPPINGS, JSON.stringify(mappings));
}

export function sanitizeAttributeMappings(mappings = []) {
  if (!Array.isArray(mappings)) return [];
  return mappings.map(rule => {
    const catId = String(rule.cmsCategoryId || '').trim();
    const pimCode = String(rule.pimAttributeCode || '').trim();

    // RÀNG BUỘC NGHIỆP VỤ BẤT DI BẤT DỊCH (NGÀNH 57 - SẠC DỰ PHÒNG):
    // Mã CMS 500 CHỈ DÙNG CHO FILTER (battery_capacity_filter_master)
    // Mã CMS 23370 CHỈ DÙNG CHO TSKT (battery_capacity_tskt_master)
    // Mã CMS 23352 CHỈ DÙNG CHO CỔNG RA FILTER (exit_gate_filter_master)
    // Mã CMS 21149 CHỈ DÙNG CHO NGUỒN RA TSKT (output_tskt_master)
    if (catId === '57') {
      if (pimCode === 'battery_capacity_tskt_master' && String(rule.cmsPropertyId).trim() === '500') {
        return {
          ...rule,
          cmsPropertyId: '23370',
          cmsPropertyName: 'Dung lượng pin',
          pimMode: 'tskt',
          status: 'Confirmed',
          source: 'file_ref',
          originalP1Id: '23370',
          originalP1Name: 'Dung lượng pin',
          note: 'Quy tắc chuẩn: TSKT Dung lượng pin ngành 57 dùng mã 23370 (Mã 500 chỉ dùng cho Filter)',
          updatedAt: new Date().toISOString()
        };
      }
      if (pimCode === 'battery_capacity_filter_master') {
        return {
          ...rule,
          cmsPropertyId: '500',
          cmsPropertyName: 'Dung lượng pin',
          pimMode: 'filter',
          status: 'Confirmed',
          note: 'Quy tắc chuẩn: Filter Dung lượng pin ngành 57 dùng mã 500',
          updatedAt: new Date().toISOString()
        };
      }
      if (pimCode === 'exit_gate_filter_master' && (String(rule.cmsPropertyId).trim() === '26138' || rule.source === 'priority2_accepted')) {
        return {
          ...rule,
          cmsPropertyId: '23352',
          cmsPropertyName: 'Cổng ra (Output)',
          pimMode: 'filter',
          status: 'Confirmed',
          source: 'file_ref',
          originalP1Id: '23352',
          originalP1Name: 'Cổng ra (Output)',
          note: 'File tham chiếu chuẩn (Ưu tiên 1): Cổng ra Filter dùng mã 23352',
          updatedAt: new Date().toISOString()
        };
      }
      if (pimCode === 'output_tskt_master' && (String(rule.cmsPropertyId).trim() === '26138' || rule.source === 'priority2_accepted')) {
        return {
          ...rule,
          cmsPropertyId: '21149',
          cmsPropertyName: 'Nguồn ra',
          pimMode: 'tskt',
          status: 'Confirmed',
          source: 'file_ref',
          originalP1Id: '21149',
          originalP1Name: 'Nguồn ra',
          note: 'File tham chiếu chuẩn (Ưu tiên 1): Nguồn ra TSKT dùng mã 21149',
          updatedAt: new Date().toISOString()
        };
      }
    }

    // Đảm bảo pimMode chuẩn xác theo hậu tố PIM
    let pimMode = rule.pimMode;
    if (pimCode.includes('filter_master') || pimCode.includes('_filter_') || pimCode.endsWith('_filter') || pimCode.includes('_filter')) {
      pimMode = 'filter';
    } else if (
      pimCode.includes('model') || 
      pimCode.includes('product_line') || 
      pimCode.includes('size_') || 
      pimCode.includes('mass_') || 
      pimCode.includes('color_')
    ) {
      pimMode = 'text';
    } else if (pimCode.includes('tskt_master') || pimCode.includes('_tskt_') || pimCode.endsWith('_tskt')) {
      pimMode = 'tskt';
    }

    return {
      ...rule,
      pimMode: pimMode || rule.pimMode || 'tskt'
    };
  });
}

export function getAttributeMappings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTRIBUTE_MAPPINGS);
    const list = raw ? JSON.parse(raw) : DEFAULT_ATTR_MAPPINGS;
    const sanitized = sanitizeAttributeMappings(list);
    if (raw && JSON.stringify(sanitized) !== JSON.stringify(list)) {
      saveAttributeMappings(sanitized);
    }
    return sanitized;
  } catch {
    return sanitizeAttributeMappings(DEFAULT_ATTR_MAPPINGS);
  }
}

export function saveAttributeMappings(mappings) {
  localStorage.setItem(STORAGE_KEYS.ATTRIBUTE_MAPPINGS, JSON.stringify(mappings));
}

export function getValueMappings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VALUE_MAPPINGS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveValueMappings(mappings) {
  localStorage.setItem(STORAGE_KEYS.VALUE_MAPPINGS, JSON.stringify(mappings || {}));
}

export function saveSingleValueMapping({ key, cmsCategoryId, cmsPropertyId, rawText, valId, valName, source = 'smart_suggestion_accepted', reason = '' }) {
  const current = getValueMappings();
  const mapKey = key || `${cmsCategoryId}___${cmsPropertyId}___${String(rawText || '').trim().toLowerCase()}`;
  current[mapKey] = {
    key: mapKey,
    cmsCategoryId: String(cmsCategoryId).trim(),
    cmsPropertyId: String(cmsPropertyId).trim(),
    rawText: String(rawText || '').trim(),
    valId: String(valId).trim(),
    valName: String(valName || '').trim(),
    source,
    reason,
    confirmedAt: new Date().toISOString()
  };
  saveValueMappings(current);
  return current;
}

export function removeValueMapping(key) {
  const current = getValueMappings();
  if (current[key]) {
    delete current[key];
    saveValueMappings(current);
  }
  return current;
}

export function getUserConfig() {
  const defaultConfig = {
    username: '174873',
    fullname: 'Quản trị viên',
    siteId: '2',
    languageId: 'vi-VN',
    valueImportConfig: {
      displayOrder: 3,
      isSearch: 0,
      compareValue: 0,
      isExistPro: 0
    }
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_CONFIG);
    if (!raw) return defaultConfig;
    const parsed = JSON.parse(raw);
    return {
      ...defaultConfig,
      ...parsed,
      valueImportConfig: {
        ...defaultConfig.valueImportConfig,
        ...(parsed.valueImportConfig || {})
      }
    };
  } catch {
    return defaultConfig;
  }
}

export function saveUserConfig(config) {
  localStorage.setItem(STORAGE_KEYS.USER_CONFIG, JSON.stringify(config));
}

export function exportSettingsToJSON() {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    categories: getCategoryMappings(),
    attributes: getAttributeMappings(),
    userConfig: getUserConfig()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pim_cms_mapping_rules_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importSettingsFromJSON(jsonString) {
  const data = JSON.parse(jsonString);
  if (data.categories) saveCategoryMappings(data.categories);
  if (data.attributes) saveAttributeMappings(data.attributes);
  if (data.userConfig) saveUserConfig(data.userConfig);
  return data;
}

/**
 * Merge mapping reference list (from thuoc_tinh_pim_cms.xlsx) into attributeMappings and categoryMappings
 */
export function syncRulesFromMappingRef(mappingRefList = [], currentAttrs = [], currentCats = []) {
  if (!Array.isArray(mappingRefList) || mappingRefList.length === 0) {
    return { mergedAttrs: currentAttrs, mergedCats: currentCats };
  }

  // 1. Merge Attributes
  const attrKey = (catId, code) => `${String(catId).trim()}___${String(code).trim().toLowerCase()}`;
  const existingAttrMap = new Map();
  currentAttrs.forEach(a => {
    existingAttrMap.set(attrKey(a.cmsCategoryId, a.pimAttributeCode), a);
  });

  const mergedAttrs = [...currentAttrs];

  mappingRefList.forEach(item => {
    const catId = String(item.cmsCategoryId || '').trim();
    const pimCode = String(item.pimAttributeCode || '').trim();
    if (!catId || !pimCode) return;

    const key = attrKey(catId, pimCode);
    let pimMode = item.pimMode;
    if (!pimMode) {
      if (pimCode.includes('filter_master') || pimCode.includes('_filter_') || pimCode.endsWith('_filter') || pimCode.includes('_filter')) {
        pimMode = 'filter';
      } else if (
        pimCode.includes('model') || 
        pimCode.includes('product_line') || 
        pimCode.includes('size_') || 
        pimCode.includes('mass_') || 
        pimCode.includes('color_')
      ) {
        pimMode = 'text';
      } else {
        pimMode = 'tskt';
      }
    }

    let cmsPropId = String(item.cmsPropertyId || '').trim();
    let note = item.note || 'Đồng bộ từ file tham chiếu (Ưu tiên 1)';

    const newRule = {
      cmsCategoryId: catId,
      cmsCategoryName: item.cmsCategoryName || '',
      pimAttributeCode: pimCode,
      cmsPropertyId: cmsPropId,
      cmsPropertyName: item.cmsPropertyName || '',
      pimMode,
      status: 'Confirmed',
      source: 'file_ref', // Ưu tiên 1
      note,
      updatedAt: new Date().toISOString()
    };

    if (existingAttrMap.has(key)) {
      const idx = mergedAttrs.findIndex(a => attrKey(a.cmsCategoryId, a.pimAttributeCode) === key);
      if (idx !== -1) {
        // Special case: Ngành 57 battery_capacity_tskt_master không dùng 500, exit_gate không dùng 26138
        const isCat57Misplaced = catId === '57' && (
          (pimCode === 'battery_capacity_tskt_master' && String(mergedAttrs[idx].cmsPropertyId).trim() === '500') ||
          (pimCode === 'exit_gate_filter_master' && String(mergedAttrs[idx].cmsPropertyId).trim() === '26138') ||
          (pimCode === 'output_tskt_master' && String(mergedAttrs[idx].cmsPropertyId).trim() === '26138')
        );

        // If user already confirmed Priority 2, preserve their confirmed choice UNLESS it's an invalid rule
        if (mergedAttrs[idx].source === 'priority2_accepted' && !isCat57Misplaced) {
          mergedAttrs[idx] = {
            ...mergedAttrs[idx],
            originalP1Id: cmsPropId,
            originalP1Name: item.cmsPropertyName || '',
            updatedAt: new Date().toISOString()
          };
        } else {
          mergedAttrs[idx] = {
            ...mergedAttrs[idx],
            ...newRule
          };
        }
      }
    } else {
      existingAttrMap.set(key, newRule);
      mergedAttrs.push(newRule);
    }
  });

  // 2. Merge Categories
  const catKey = (pimCode) => String(pimCode).trim().toLowerCase();
  const existingCatMap = new Map();
  currentCats.forEach(c => {
    existingCatMap.set(catKey(c.pimCategoryCode), c);
    if (c.cmsCategoryId) {
      existingCatMap.set(`cms_${String(c.cmsCategoryId).trim()}`, c);
    }
  });

  const mergedCats = [...currentCats];
  const distinctCats = new Map();

  mappingRefList.forEach(item => {
    const catId = String(item.cmsCategoryId || '').trim();
    const catName = String(item.cmsCategoryName || '').trim();
    if (catId && !distinctCats.has(catId)) {
      distinctCats.set(catId, catName);
    }
  });

  distinctCats.forEach((catName, catId) => {
    if (!existingCatMap.has(`cms_${catId}`)) {
      const newCat = {
        pimCategoryCode: catId, // Default PIM code mapping to CMS ID
        cmsCategoryId: catId,
        cmsCategoryName: catName,
        status: 'Confirmed',
        confirmedBy: 'Auto-Sync',
        confirmedAt: new Date().toISOString()
      };
      existingCatMap.set(`cms_${catId}`, newCat);
      mergedCats.push(newCat);
    }
  });

  return { mergedAttrs: sanitizeAttributeMappings(mergedAttrs), mergedCats };
}

/**
 * Merge category mapping reference list (from nganh_hang_pim_cms.xlsx) into categoryMappings
 */
export function syncCategoriesFromRef(catRefList = [], currentCats = []) {
  if (!Array.isArray(catRefList) || catRefList.length === 0) {
    return currentCats;
  }

  const existingMap = new Map();
  currentCats.forEach(c => {
    if (c.pimCategoryCode) {
      existingMap.set(String(c.pimCategoryCode).trim().toLowerCase(), c);
    }
    if (c.cmsCategoryId) {
      existingMap.set(`cms_${String(c.cmsCategoryId).trim().toLowerCase()}`, c);
    }
  });

  const mergedCats = [...currentCats];

  catRefList.forEach(item => {
    const pimCode = String(item.pimCategoryCode || '').trim();
    const cmsId = String(item.cmsCategoryId || '').trim();
    const cmsName = String(item.cmsCategoryName || '').trim();
    const famCode = String(item.familyCode || '').trim();
    const famName = String(item.familyName || '').trim();

    if (!pimCode && !cmsId) return;

    const key = pimCode.toLowerCase();
    if (!existingMap.has(key)) {
      const newCat = {
        pimCategoryCode: pimCode,
        cmsCategoryId: cmsId,
        cmsCategoryName: cmsName,
        familyCode: famCode,
        familyName: famName,
        status: 'Confirmed',
        confirmedBy: 'Ref-File',
        confirmedAt: new Date().toISOString()
      };
      existingMap.set(key, newCat);
      mergedCats.push(newCat);
    } else {
      // Enrich existing record if it lacks familyCode/familyName
      const existing = existingMap.get(key);
      if (!existing.familyCode && famCode) existing.familyCode = famCode;
      if (!existing.familyName && famName) existing.familyName = famName;
      if (!existing.cmsCategoryName && cmsName) existing.cmsCategoryName = cmsName;
      if (!existing.cmsCategoryId && cmsId) existing.cmsCategoryId = cmsId;
    }
  });

  return mergedCats;
}

