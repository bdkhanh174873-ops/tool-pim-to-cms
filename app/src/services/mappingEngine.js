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

/**
 * Rút trích khái niệm kỹ thuật gốc từ mã PIM (bỏ các hậu tố _tskt, _filter, _master, _dmxfilter, _tgddfilter)
 * Ví dụ: ram_tskt_master -> ram, ram_filter_master -> ram
 */
export function getBaseAttrCode(code = '') {
  return String(code || '')
    .trim()
    .toLowerCase()
    .replace(/_(tskt|filter)(_master)?$/, '')
    .replace(/_(dmxfilter|tgddfilter)$/, '');
}

/**
 * Chuẩn hóa giá trị thông số kỹ thuật để so khớp thông minh:
 * Tách và nhận diện số (loại bỏ dấu chấm/phẩy phân cách hàng nghìn như 20.000 -> 20000), đơn vị (mAh, W...), ký tự đặc biệt.
 */
export function canonicalizeValue(str) {
  if (str === null || str === undefined) return { raw: '', clean: '', numbers: [], unit: '', compact: '', words: [] };

  const raw = String(str).trim();
  let clean = raw.toLowerCase();

  // Chuẩn hóa dấu phân cách hàng nghìn (20.000 hoặc 20,000 -> 20000)
  const normNumbers = clean.replace(/(\d{1,3})[.,](\d{3})(?=\D|$)/g, '$1$2')
                           .replace(/(\d{1,3})[.,](\d{3})(?=\D|$)/g, '$1$2');

  // Trích xuất các số (số nguyên hoặc số thập phân như 1.8 hoặc 20000)
  const numberMatches = (normNumbers.match(/\d+(?:[.,]\d+)?/g) || []).map(n => {
    return parseFloat(n.replace(',', '.'));
  });

  // Nhận diện đơn vị công nghệ thông dụng
  const units = ['mah', 'kwh', 'wh', 'dpi', 'ghz', 'mhz', 'khz', 'hz', 'fps', 'tb', 'gb', 'mb', 'kb', 'inch', 'mm', 'cm', 'm', 'kg', 'g', 'w', 'v', 'a', 'pin'];
  let unit = '';
  for (const u of units) {
    const reg = new RegExp(`\\b${u}\\b|(?<=\\d)${u}(?=\\W|$)`, 'i');
    if (reg.test(clean)) {
      unit = u;
      break;
    }
  }

  // Dạng chuỗi gọn không dấu cách/ký hiệu (vd: "type-c" -> "typec", "20.000mah" -> "20000mah")
  const compact = normNumbers.replace(/[\s\-_.,/()]/g, '').toLowerCase();

  // Danh sách từ khóa
  const words = clean.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ').split(/\s+/).filter(Boolean);

  return {
    raw,
    clean,
    numbers: numberMatches,
    unit,
    compact,
    words
  };
}

/**
 * Thuật toán AI Smart Value Matcher:
 * Tìm giá trị CMS tương ứng có sẵn khi giá trị PIM chỉ khác cách trình bày (vd: 20000mAh vs 20.000 mAh vs 20000).
 * CÁC RÀNG BUỘC AN TOÀN TUYỆT ĐỐI ĐỂ TRÁNH GỢI Ý SAI:
 * 1. Bất biến số: Nếu 2 bên có số, số phải bằng nhau 100% (10000 không bao giờ map sang 20000).
 * 2. Phủ định: "Có" không bao giờ map sang "Không", "Có dây" không bao giờ map sang "Không dây".
 * 3. Đơn vị: Không bao giờ map chéo đơn vị khác nhau (W vs mAh).
 */
export function findSmartCmsValueSuggestion(textToLookup, availableCmsValues, isFilterProperty = false) {
  if (!textToLookup || !Array.isArray(availableCmsValues) || availableCmsValues.length === 0) {
    return null;
  }

  const target = canonicalizeValue(textToLookup);
  if (!target.compact) return null;

  let bestMatch = null;
  let highestScore = 0;

  for (const cmsItem of availableCmsValues) {
    const cmsValText = cmsItem.valName || cmsItem.rawValue || '';
    if (!cmsValText) continue;

    const cand = canonicalizeValue(cmsValText);
    if (!cand.compact) continue;

    // Ràng buộc 1: Bất biến số lượng
    if (target.numbers.length > 0 || cand.numbers.length > 0) {
      if (target.numbers.length !== cand.numbers.length) {
        // Trường hợp đặc biệt: CMS chỉ lưu số (20000) và PIM là 20.000 mAh
        if (target.numbers.length === 1 && cand.numbers.length === 1) {
          if (target.numbers[0] !== cand.numbers[0]) continue;
        } else {
          continue;
        }
      } else {
        let numsMatch = true;
        for (let i = 0; i < target.numbers.length; i++) {
          if (target.numbers[i] !== cand.numbers[i]) {
            numsMatch = false;
            break;
          }
        }
        if (!numsMatch) continue;
      }
    }

    // Ràng buộc 2: Tính phủ định (Có vs Không)
    const targetHasKhong = target.words.includes('không') || target.clean.includes('khong');
    const candHasKhong = cand.words.includes('không') || cand.clean.includes('khong');
    if (targetHasKhong !== candHasKhong) {
      continue;
    }

    // Ràng buộc 3: Đơn vị không được xung đột
    if (target.unit && cand.unit && target.unit !== cand.unit) {
      continue;
    }

    let score = 0;
    let reason = '';

    // Mẫu 1: Trùng khớp chuỗi rút gọn (vd: "20000mah" === "20000mah", "typec" === "typec", "65w" === "65w")
    if (target.compact === cand.compact) {
      score = 0.98;
      reason = 'Đồng nhất nội dung, chỉ khác cách viết số hoặc khoảng trắng/dấu gạch';
    } 
    // Mẫu 2: PIM có đơn vị, CMS chỉ lưu số hoặc ngược lại (vd: PIM "20.000 mAh" -> CMS "20000")
    else if (target.numbers.length === 1 && cand.numbers.length === 1 && target.numbers[0] === cand.numbers[0]) {
      if (cand.compact === String(target.numbers[0]) || cand.unit === target.unit) {
        score = 0.96;
        reason = `Trùng khớp thông số kỹ thuật (${target.numbers[0]}${target.unit ? ' ' + target.unit : ''}), CMS chỉ lưu số hoặc định dạng rút gọn`;
      } else {
        const commonWords = target.words.filter(w => cand.words.includes(w));
        if (commonWords.length > 0) {
          score = 0.88;
          reason = `Trùng khớp thông số kỹ thuật và từ khóa (${commonWords.join(' ')})`;
        }
      }
    }
    // Mẫu 3: Không có số, kiểm tra độ tương đồng từ khóa
    else if (target.numbers.length === 0 && cand.numbers.length === 0) {
      if (target.compact === cand.compact) {
        score = 0.96;
        reason = 'Đồng nhất chữ cái, chỉ khác dấu cách hoặc dấu gạch nối';
      } else {
        const intersection = target.words.filter(w => cand.words.includes(w));
        const union = new Set([...target.words, ...cand.words]);
        const jaccard = union.size > 0 ? intersection.length / union.size : 0;
        if (jaccard >= 0.75) {
          score = 0.85;
          reason = `Độ tương đồng từ khóa cao (${Math.round(jaccard * 100)}%)`;
        }
      }
    }

    if (score > highestScore && score >= 0.82) {
      highestScore = score;
      bestMatch = {
        valId: String(cmsItem.valId).trim(),
        valName: cmsValText,
        confidence: score,
        reason,
        isFilter: Boolean(isFilterProperty)
      };
    }
  }

  return bestMatch;
}

/**
 * Kiểm tra xem một thuộc tính trên CMS có phải là dạng nhập text hay không:
 * - Trong file CMS Catalog, các cột VALUEID và VALUE bị trống (không có giá trị mẫu nào được đổ ra từ CMS)
 * - Hoặc propertyType === 0
 * - Hoặc propObj.isText === true
 */
export function isCmsPropertyTextOnly(cmsCatalog, categoryId, propertyId) {
  if (!cmsCatalog) return false;
  const propKey = `${String(categoryId).trim()}___${String(propertyId).trim()}`;
  if (cmsCatalog.properties && cmsCatalog.properties.has(propKey)) {
    const propObj = cmsCatalog.properties.get(propKey);
    if (propObj.propertyType === 0 || propObj.isText === true) return true;
    if (!propObj.values || propObj.values.length === 0) return true;
    return false;
  }
  if (cmsCatalog.rawTableRows && cmsCatalog.rawTableRows.length > 0) {
    const catIdStr = String(categoryId).trim();
    const propIdStr = String(propertyId).trim();
    const matchingRows = cmsCatalog.rawTableRows.filter(
      r => String(r.categoryId).trim() === catIdStr && String(r.propertyId).trim() === propIdStr
    );
    if (matchingRows.length > 0) {
      const hasAnyValue = matchingRows.some(r => {
        const vId = r.valueId !== null && r.valueId !== undefined ? String(r.valueId).trim() : '';
        const vName = r.valueName !== null && r.valueName !== undefined ? String(r.valueName).trim() : '';
        return (vId !== '' && vId !== '(Trống)') || (vName !== '' && vName !== '(Trống)');
      });
      return !hasAnyValue;
    }
  }
  return false;
}

function determineSmartMode(propObj, normCode) {
  let pimMode = 'tskt';
  const isCmsText = propObj.propertyType === 0 || propObj.isText === true || (!propObj.values || propObj.values.length === 0);
  if (
    isCmsText || 
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
    propertyType: isCmsText ? 0 : propObj.propertyType,
    pimMode
  };
}

/**
 * Smart Auto-Mapping (Ưu tiên 2):
 * Dynamically finds a CMS Property matching a PIM technical code & Vietnamese label within a category.
 */
export function smartFindCmsProperty(cmsCategoryId, pimAttrCode, pimAttrLabel, cmsCatalog, attrMap = null) {
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

  const catIdStr = String(cmsCategoryId).trim();
  const normLabel = normalizeText(pimAttrLabel);
  const normCode = normalizeText(pimAttrCode);
  const isFilterAttr = normCode.includes('filter_master') || normCode.includes('_filter') || normCode.endsWith('_filter');
  const isTsktAttr = normCode.includes('tskt_master') || normCode.includes('_tskt') || normCode.endsWith('_tskt');

  // RÀNG BUỘC BẤT BIẾN NGÀNH 57 (SẠC DỰ PHÒNG):
  // - battery_capacity_filter_master CHỈ map với CMS 500 (Dung lượng pin, Filter)
  // - battery_capacity_tskt_master CHỈ map với CMS 23370 (Dung lượng pin, TSKT)
  // TUYỆT ĐỐI KHÔNG GỢI Ý MÃ 500 CHO TSKT!
  if (catIdStr === '57') {
    if (normCode.includes('battery_capacity') && isTsktAttr) {
      const p23370 = catProps.find(p => String(p.propertyId).trim() === '23370');
      if (p23370) return determineSmartMode(p23370, normCode);
    }
    if (normCode.includes('battery_capacity') && isFilterAttr) {
      const p500 = catProps.find(p => String(p.propertyId).trim() === '500');
      if (p500) return determineSmartMode(p500, normCode);
    }
  }

  // 0. NGUYÊN TẮC CHUẨN: Nếu thuộc tính này ĐÃ CÓ trong File Mapping chuẩn (attrMap)
  // và mã CMS đó tồn tại hợp lệ trong danh mục CMS của ngành hàng này:
  // ➔ Ưu tiên 2 (Smart Map) xác nhận dùng luôn mã chuẩn này, KHÔNG tự ý gợi ý mã khác để sinh chênh lệch giả.
  const catRuleKey = `${catIdStr}___${normCode}`;
  if (attrMap && attrMap.has(catRuleKey)) {
    const existingRule = attrMap.get(catRuleKey);
    const existingPropId = String(existingRule.cmsPropertyId || '').trim();
    if (existingPropId) {
      const matchInCatalog = catProps.find(p => String(p.propertyId).trim() === existingPropId);
      if (matchInCatalog) {
        return determineSmartMode(matchInCatalog, normCode);
      }
    }
  }

  // Pre-scan attrMap to detect properties already claimed by opposite mode (Filter vs TSKT)
  const mappedFilterPropIds = new Set();
  const mappedTsktPropIds = new Set();
  if (attrMap) {
    for (const [k, rule] of attrMap.entries()) {
      if (k.startsWith(`${catIdStr}___`)) {
        const code = String(rule.pimAttributeCode || '').toLowerCase();
        const propId = String(rule.originalP1Id || rule.cmsPropertyId).trim();
        if (!propId) continue;
        if (code.includes('filter_master') || code.includes('_filter') || rule.pimMode === 'filter') {
          mappedFilterPropIds.add(propId);
        } else if (code.includes('tskt_master') || code.includes('_tskt') || rule.pimMode === 'tskt') {
          mappedTsktPropIds.add(propId);
        }
      }
    }
  }

  const currentBaseCode = getBaseAttrCode(pimAttrCode);

  const isCandidateEligible = (p) => {
    const pId = String(p.propertyId).trim();

    // Ràng buộc riêng ngành 57 (Sạc dự phòng):
    // 500 CHỈ DÙNG CHO FILTER, 23370 CHỈ DÙNG CHO TSKT
    if (catIdStr === '57') {
      if (isTsktAttr && pId === '500') return false;
      if (isFilterAttr && pId === '23370') return false;
    }

    // Nếu mã này đang được map cho 1 thuộc tính khác trong attrMap:
    if (attrMap) {
      let isClaimedByDifferentConcept = false;

      for (const [k, rule] of attrMap.entries()) {
        if (k.startsWith(`${catIdStr}___`)) {
          const rulePimCode = String(rule.pimAttributeCode || '').toLowerCase();
          const rulePropId = String(rule.originalP1Id || rule.cmsPropertyId).trim();
          if (rulePropId === pId) {
            const ruleBase = getBaseAttrCode(rulePimCode);
            // Nếu cùng khái niệm kỹ thuật (ví dụ ram_tskt_master và ram_filter_master)
            // -> HOÀN TOÀN HỢP LỆ ĐỂ DÙNG CHUNG MÃ CMS (Dual-Role TSKT & Filter)!
            if (ruleBase === currentBaseCode && catIdStr !== '57') {
              return true;
            }
            // Khác khái niệm kỹ thuật -> đã bị thuộc tính khác chiếm dụng
            isClaimedByDifferentConcept = true;
          }
        }
      }
      if (isClaimedByDifferentConcept) {
        return false;
      }
    }

    // TSKT không được gợi ý mã CMS chỉ dùng cho Filter
    if (isTsktAttr && mappedFilterPropIds.has(pId) && !mappedTsktPropIds.has(pId)) {
      return false;
    }
    // Filter không được gợi ý mã CMS chỉ dùng cho TSKT
    if (isFilterAttr && mappedTsktPropIds.has(pId) && !mappedFilterPropIds.has(pId)) {
      return false;
    }
    return true;
  };

  // 1. Exact match with Vietnamese label
  if (normLabel) {
    for (const p of catProps) {
      if (normalizeText(p.propertyName) === normLabel && isCandidateEligible(p)) {
        return determineSmartMode(p, normCode);
      }
    }
  }

  // 2. Synonyms - EXACT match
  if (normLabel) {
    for (const syn of SMART_SYNONYMS) {
      if (normLabel === syn.pim || normLabel.includes(syn.pim)) {
        for (const targetName of syn.cms) {
          for (const p of catProps) {
            if (normalizeText(p.propertyName) === targetName && isCandidateEligible(p)) {
              return determineSmartMode(p, normCode);
            }
          }
        }
      }
    }
  }

  // 3. Technical code keywords - EXACT match
  for (const kw of SMART_CODE_KEYWORDS) {
    if (normCode.includes(kw.code)) {
      for (const targetName of kw.names) {
        for (const p of catProps) {
          if (normalizeText(p.propertyName) === targetName && isCandidateEligible(p)) {
            return determineSmartMode(p, normCode);
          }
        }
      }
    }
  }

  // 4. Synonyms - PARTIAL match
  if (normLabel) {
    for (const syn of SMART_SYNONYMS) {
      if (normLabel === syn.pim || normLabel.includes(syn.pim)) {
        for (const targetName of syn.cms) {
          for (const p of catProps) {
            if (normalizeText(p.propertyName).includes(targetName) && isCandidateEligible(p)) {
              return determineSmartMode(p, normCode);
            }
          }
        }
      }
    }
  }

  // 5. Technical code keywords - PARTIAL match
  for (const kw of SMART_CODE_KEYWORDS) {
    if (normCode.includes(kw.code)) {
      for (const targetName of kw.names) {
        for (const p of catProps) {
          if (normalizeText(p.propertyName).includes(targetName) && isCandidateEligible(p)) {
            return determineSmartMode(p, normCode);
          }
        }
      }
    }
  }

  // 6. Substring inclusion match (if label >= 3 chars)
  if (normLabel && normLabel.length >= 3) {
    for (const p of catProps) {
      const pNorm = normalizeText(p.propertyName);
      if ((pNorm.includes(normLabel) || normLabel.includes(pNorm)) && isCandidateEligible(p)) {
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
  mappingRef = [],
  userConfig = { username: '174873', fullname: 'Quản trị viên', siteId: '2', languageId: 'vi-VN' },
  valueMappings = {}
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

  // Index Attribute Mappings (Ưu tiên 1 - File tham chiếu & Đã lưu)
  const attrMap = new Map();

  // 1. Nạp toàn bộ quy tắc gốc từ file tham chiếu mappingRef (Ưu tiên 1 bắt buộc)
  const refList = Array.isArray(mappingRef) ? mappingRef : (mappingRef?.mappings || []);
  refList.forEach(m => {
    const catId = String(m.cmsCategoryId || m['MÃ NGÀNH HÀNG CMS'] || '').trim();
    const pimCode = String(m.pimAttributeCode || m['MÃ THUỘC TÍNH PIM'] || '').trim();
    const propId = String(m.cmsPropertyId || m['MÃ THUỘC TÍNH TSKT'] || '').trim();
    const propName = m.cmsPropertyName || m['TÊN THUỘC TÍNH TSKT'] || '';
    const catName = m.cmsCategoryName || m['TÊN NGÀNH HÀNG CMS'] || '';
    if (catId && pimCode && propId) {
      const key = `${catId}___${pimCode.toLowerCase()}`;
      let pimMode = 'tskt';
      if (pimCode.includes('filter_master') || pimCode.includes('_filter_') || pimCode.endsWith('_filter') || pimCode.includes('_filter')) pimMode = 'filter';
      else if (pimCode.includes('model') || pimCode.includes('product_line') || pimCode.includes('size_') || pimCode.includes('mass_')) pimMode = 'text';

      attrMap.set(key, {
        cmsCategoryId: catId,
        cmsCategoryName: catName,
        pimAttributeCode: pimCode,
        cmsPropertyId: propId,
        cmsPropertyName: propName,
        pimMode,
        status: 'Confirmed',
        source: 'file_ref',
        updatedAt: new Date().toISOString()
      });
    }
  });

  // 2. Nạp đè bằng bảng quy tắc attributeMappings (chứa các tùy chỉnh/xác nhận của người dùng)
  attributeMappings.forEach(am => {
    if (am.status === 'Confirmed') {
      const key = `${String(am.cmsCategoryId).trim()}___${String(am.pimAttributeCode).trim().toLowerCase()}`;
      attrMap.set(key, am);
    }
  });

  // RÀNG BUỘC BẤT DI BẤT DỊCH NGÀNH 57 (SẠC DỰ PHÒNG):
  // 1. Mã CMS 500 CHỈ DÙNG CHO FILTER (battery_capacity_filter_master)
  // 2. Mã CMS 23370 CHỈ DÙNG CHO TSKT (battery_capacity_tskt_master)
  // 3. Mã CMS 23352 CHỈ DÙNG CHO CỔNG RA FILTER (exit_gate_filter_master) - Ưu tiên 1 mặc định
  // 4. Mã CMS 21149 CHỈ DÙNG CHO NGUỒN RA TSKT (output_tskt_master) - Ưu tiên 1 mặc định
  const cat57FilterKey = '57___battery_capacity_filter_master';
  if (attrMap.has(cat57FilterKey)) {
    const existing = attrMap.get(cat57FilterKey);
    attrMap.set(cat57FilterKey, {
      ...existing,
      cmsPropertyId: '500',
      cmsPropertyName: 'Dung lượng pin',
      originalP1Id: '500',
      originalP1Name: 'Dung lượng pin',
      pimMode: 'filter',
      status: 'Confirmed',
      source: 'file_ref'
    });
  } else {
    attrMap.set(cat57FilterKey, {
      cmsCategoryId: '57',
      cmsCategoryName: 'Sạc dự phòng',
      pimAttributeCode: 'battery_capacity_filter_master',
      cmsPropertyId: '500',
      cmsPropertyName: 'Dung lượng pin',
      originalP1Id: '500',
      originalP1Name: 'Dung lượng pin',
      pimMode: 'filter',
      status: 'Confirmed',
      source: 'file_ref'
    });
  }
  const cat57TsktKey = '57___battery_capacity_tskt_master';
  if (attrMap.has(cat57TsktKey)) {
    const existing = attrMap.get(cat57TsktKey);
    attrMap.set(cat57TsktKey, {
      ...existing,
      cmsPropertyId: '23370',
      cmsPropertyName: 'Dung lượng pin',
      originalP1Id: '23370',
      originalP1Name: 'Dung lượng pin',
      pimMode: 'tskt',
      status: 'Confirmed',
      source: 'file_ref'
    });
  } else {
    attrMap.set(cat57TsktKey, {
      cmsCategoryId: '57',
      cmsCategoryName: 'Sạc dự phòng',
      pimAttributeCode: 'battery_capacity_tskt_master',
      cmsPropertyId: '23370',
      cmsPropertyName: 'Dung lượng pin',
      originalP1Id: '23370',
      originalP1Name: 'Dung lượng pin',
      pimMode: 'tskt',
      status: 'Confirmed',
      source: 'file_ref'
    });
  }
  const cat57ExitGateKey = '57___exit_gate_filter_master';
  if (attrMap.has(cat57ExitGateKey)) {
    const existing = attrMap.get(cat57ExitGateKey);
    if (String(existing.cmsPropertyId).trim() === '26138' || existing.source === 'priority2_accepted') {
      attrMap.set(cat57ExitGateKey, {
        ...existing,
        cmsPropertyId: '23352',
        cmsPropertyName: 'Cổng ra (Output)',
        pimMode: 'filter',
        status: 'Confirmed',
        source: 'file_ref',
        originalP1Id: '23352',
        originalP1Name: 'Cổng ra (Output)'
      });
    }
  } else {
    attrMap.set(cat57ExitGateKey, {
      cmsCategoryId: '57',
      pimAttributeCode: 'exit_gate_filter_master',
      cmsPropertyId: '23352',
      cmsPropertyName: 'Cổng ra (Output)',
      pimMode: 'filter',
      status: 'Confirmed',
      source: 'file_ref',
      originalP1Id: '23352',
      originalP1Name: 'Cổng ra (Output)'
    });
  }
  const cat57OutputKey = '57___output_tskt_master';
  if (attrMap.has(cat57OutputKey)) {
    const existing = attrMap.get(cat57OutputKey);
    if (String(existing.cmsPropertyId).trim() === '26138' || existing.source === 'priority2_accepted') {
      attrMap.set(cat57OutputKey, {
        ...existing,
        cmsPropertyId: '21149',
        cmsPropertyName: 'Nguồn ra',
        pimMode: 'tskt',
        status: 'Confirmed',
        source: 'file_ref',
        originalP1Id: '21149',
        originalP1Name: 'Nguồn ra'
      });
    }
  } else {
    attrMap.set(cat57OutputKey, {
      cmsCategoryId: '57',
      pimAttributeCode: 'output_tskt_master',
      cmsPropertyId: '21149',
      cmsPropertyName: 'Nguồn ra',
      pimMode: 'tskt',
      status: 'Confirmed',
      source: 'file_ref',
      originalP1Id: '21149',
      originalP1Name: 'Nguồn ra'
    });
  }

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
      let p2Match = smartFindCmsProperty(cmsCategoryId, pimAttrCode, pimAttrLabel, cmsCatalog, attrMap);

      // KIỂM TRA XUNG ĐỘT: Nếu Ưu tiên 2 đề xuất 1 cmsPropertyId mà đã có cột PIM KHÁC
      // chiếm dụng qua Ưu tiên 1 rồi → vô hiệu hóa Ưu tiên 2 để tránh map nhầm.
      // Ví dụ: wireless_connection → Smart map gợi ý 8853 (Khoảng cách kết nối),
      // nhưng 8853 đã bị cable_lengthconnection_distance chiếm qua file mapping rồi → bỏ qua.
      if (p2Match) {
        const p2PropId = String(p2Match.propertyId).trim();
        // Kiểm tra xem có mapping nào khác trong file đã chiếm cmsPropertyId này chưa
        let isP2PropertyClaimedByAnotherP1 = false;
        for (const [key, rule] of attrMap.entries()) {
          if (key.startsWith(`${cmsCategoryId}___`)) {
            // Bỏ qua chính mapping của cột PIM hiện tại (nếu có)
            const keyPimCode = key.split('___')[1];
            if (keyPimCode === pimAttrCode.toLowerCase()) continue;

            const rulePropertyId = String(rule.originalP1Id || rule.cmsPropertyId).trim();
            if (rulePropertyId === p2PropId) {
              // Ngoại lệ hợp lệ: Cùng 1 thuộc tính kỹ thuật có 2 vai trò PIM (1 TSKT, 1 Filter) dùng chung mã CMS
              // Ví dụ: ram_tskt_master và ram_filter_master cùng dùng mã CMS 50 (hoặc 3059)
              const currentBase = getBaseAttrCode(pimAttrCode);
              const ruleBase = getBaseAttrCode(keyPimCode);
              const isDifferentRole = (
                (keyPimCode.includes('filter') && pimAttrCode.toLowerCase().includes('tskt')) ||
                (keyPimCode.includes('tskt') && pimAttrCode.toLowerCase().includes('filter'))
              );

              // Riêng ngành 57 (Sạc dự phòng): Tuyệt đối không cho TSKT dùng mã 500 hoặc Filter dùng mã 23370
              const isCat57BatteryConflict = String(cmsCategoryId).trim() === '57' && (p2PropId === '500' || p2PropId === '23370');

              if (currentBase === ruleBase && isDifferentRole && !isCat57BatteryConflict) {
                // Hợp lệ: Dual-role thuộc tính kỹ thuật dùng chung mã CMS
                continue;
              }

              // Khác thuộc tính kỹ thuật mà đòi chiếm chung mã CMS → chặn xung đột
              isP2PropertyClaimedByAnotherP1 = true;
              break;
            }
          }
        }
        if (isP2PropertyClaimedByAnotherP1) {
          p2Match = null; // Vô hiệu hóa Smart Map cho trường hợp này
        }
      }

      let effectiveRule = null;
      let usedSource = 'none';
      let hasDiscrepancy = false;

      // Extract Priority 1 (File tham chiếu) and Priority 2 (CMS thông minh) candidate IDs
      let p1FileId = null;
      let p1FileName = '';
      if (p1Rule) {
        if (p1Rule.source === 'priority2_accepted') {
          p1FileId = String(p1Rule.originalP1Id || p1Rule.cmsPropertyId).trim();
          p1FileName = p1Rule.originalP1Name || p1Rule.cmsPropertyName || '';
        } else {
          p1FileId = String(p1Rule.cmsPropertyId).trim();
          p1FileName = p1Rule.cmsPropertyName || '';
        }
      }

      // Ràng buộc bất biến tuyệt đối Ngành 57:
      if (cmsCategoryId === '57') {
        const normCode = pimAttrCode.toLowerCase();
        if (normCode.includes('battery_capacity') && (normCode.includes('tskt') || p1Rule?.pimMode === 'tskt')) {
          p1FileId = '23370';
          p1FileName = 'Dung lượng pin';
        } else if (normCode.includes('battery_capacity') && (normCode.includes('filter') || p1Rule?.pimMode === 'filter')) {
          p1FileId = '500';
          p1FileName = 'Dung lượng pin';
        }
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
          // BẮT BUỘC DÙNG ƯU TIÊN 1: Tuyệt đối không mặc định chọn Ưu tiên 2.
          // Chỉ áp dụng Ưu tiên 2 khi người dùng ĐÃ CHỦ ĐỘNG XÁC NHẬN (isUserConfirmedP2).
          const isUsingP2 = Boolean(isUserConfirmedP2);
          const appliedId = isUsingP2 ? p2CmsId : p1FileId;
          const appliedSrc = isUsingP2 ? 'priority2_accepted' : 'priority1';

          const isFilterAttr = pimAttrCode.includes('_filter_') || pimAttrCode.endsWith('_filter');
          const isTsktAttr = pimAttrCode.includes('_tskt_') || pimAttrCode.endsWith('_tskt');
          const pimAttributeKind = isFilterAttr ? 'Filter' : (isTsktAttr ? 'TSKT' : 'Thuộc tính');

          discrepanciesMap.set(discKey, {
            id: discKey,
            cmsCategoryId,
            cmsCategoryName,
            pimAttributeCode: pimAttrCode,
            pimAttributeLabel: pimAttrLabel || p1FileName || p2CmsName,
            pimAttributeKind,
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
            resolvedChoice: isUserConfirmedP2 ? 'priority2' : 'priority1'
          });
        }
      }

      if (p1Rule) {
        // MẶC ĐỊNH BẮT BUỘC: Ưu tiên 1 luôn là lựa chọn chính thức.
        // Chỉ khi người dùng đã chủ động bấm duyệt chọn Ưu tiên 2 mới chuyển sang P2.
        let sourceTag = p1Rule.source || 'priority1';
        let appliedId = p1FileId;
        let appliedName = p1FileName;
        let appliedPimMode = p1Rule.pimMode || 'tskt';

        if (isRealDiscrepancy && isUserConfirmedP2) {
          // Người dùng ĐÃ XÁC NHẬN CHỌN Ưu tiên 2
          sourceTag = 'priority2_accepted';
          appliedId = p2CmsId;
          appliedName = p2CmsName;
          if (p2Match && p2Match.propertyType === 0) appliedPimMode = 'text';
        } else if (isRealDiscrepancy) {
          // Có chênh lệch mã giữa P1 và P2: BẮT BUỘC giữ Ưu tiên 1, gắn cờ cảnh báo
          sourceTag = isUserConfirmedP1 ? 'priority1_accepted' : 'priority1';
          appliedId = p1FileId;
          appliedName = p1FileName;
        }

        effectiveRule = {
          cmsPropertyId: appliedId,
          cmsPropertyName: appliedName,
          pimMode: appliedPimMode,
          source: sourceTag,
          hasDiscrepancy: isRealDiscrepancy
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

      // Handle Text properties:
      // 1. Cấu hình pimMode === 'text'
      // 2. Thuộc tính trên CMS là dạng nhập text (cột VALUEID & VALUE trong CMS Catalog bị trống, hoặc propertyType === 0)
      const isCmsText = isCmsPropertyTextOnly(cmsCatalog, cmsCategoryId, cmsPropertyId);
      const isTextProperty = pimMode === 'text' || isCmsText;

      if (isTextProperty) {
        // Thuộc tính dạng nhập text: Lấy trực tiếp giá trị từ PIM pass vào file import thay vì tạo mới
        let textVal = String(rawValue).trim();
        if (pimMode === 'filter') {
          try {
            const parsed = JSON.parse(textVal);
            const codes = Array.isArray(parsed) ? parsed : [textVal];
            const decodedCodes = codes.map(c => {
              const optKey = `${pimAttrCode.toLowerCase()}___${String(c).trim()}`;
              const optObj = pimOptions?.get ? pimOptions.get(optKey) : null;
              return (optObj && optObj.optionValue) ? optObj.optionValue.trim() : String(c).trim();
            });
            textVal = decodedCodes.join(', ');
          } catch {
            const optKey = `${pimAttrCode.toLowerCase()}___${textVal}`;
            const optObj = pimOptions?.get ? pimOptions.get(optKey) : null;
            if (optObj && optObj.optionValue) textVal = optObj.optionValue.trim();
          }
        }

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

        // BƯỚC 1: Kiểm tra xem người dùng đã từng xác nhận dùng giá trị gợi ý này chưa (User Accepted Suggestion)
        const valMapKey = `${cmsCategoryId}___${cmsPropertyId}___${normalizeText(textToLookup)}`;
        const userAcceptedVal = valueMappings && valueMappings[valMapKey];

        if (userAcceptedVal && userAcceptedVal.valId) {
          resolvedItems.push({
            raw: item,
            decoded: textToLookup,
            valId: String(userAcceptedVal.valId).trim(),
            matchedName: userAcceptedVal.valName || textToLookup,
            isUserAcceptedSuggestion: true
          });
          continue;
        }

        // BƯỚC 2: Tra cứu chính xác trong CMS Catalog valueLookup
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
          // BƯỚC 3: Không có mã chính xác trên CMS -> Quét tìm gợi ý thông minh (AI Smart Value Matcher)
          allItemsValid = false;

          // Danh sách tất cả giá trị CMS hiện có của thuộc tính này
          const propCatalogKey = `${cmsCategoryId}___${cmsPropertyId}`;
          const availableCmsValues = cmsCatalog.properties?.get(propCatalogKey)?.values || [];

          // Nhận diện thuộc tính có phải là Bộ lọc (Filter) hay không:
          // Theo chỉ đạo người dùng: mã có filter_master hoặc _filter hoặc pimMode === 'filter'
          const isFilterAttr = pimAttrCode.includes('filter_master') || pimAttrCode.includes('_filter') || pimMode === 'filter';
          const smartSuggestion = findSmartCmsValueSuggestion(textToLookup, availableCmsValues, isFilterAttr);

          itemErrors.push(`Giá trị "${textToLookup}" chưa có trong danh mục CMS (Cần đề xuất tạo mới).`);

          // Gom vào danh sách Đề xuất tạo mới (Proposals)
          const propKey = `${cmsCategoryId}___${cmsPropertyId}___${normalizeText(textToLookup)}`;
          if (!newProposalValues.has(propKey)) {
            newProposalValues.set(propKey, {
              key: propKey,
              cmsCategoryId,
              cmsCategoryName,
              cmsPropertyId,
              cmsPropertyName,
              pimAttributeCode: pimAttrCode,
              rawText: textToLookup,
              isFilterAttribute: isFilterAttr,
              smartSuggestion,
              count: 0,
              sampleModels: [],
              associatedProductIds: [],
              associatedModelCodes: []
            });
          }
          const propItem = newProposalValues.get(propKey);
          propItem.count++;
          if (smartSuggestion && !propItem.smartSuggestion) {
            propItem.smartSuggestion = smartSuggestion;
          }
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
          isFilterAttribute: pimAttrCode.includes('filter_master') || pimAttrCode.includes('_filter') || pimMode === 'filter',
          smartSuggestion: findSmartCmsValueSuggestion(
            String(rawItems[0] || rawValue || ''), 
            cmsCatalog.properties?.get(`${cmsCategoryId}___${cmsPropertyId}`)?.values || [],
            pimAttrCode.includes('filter_master') || pimAttrCode.includes('_filter') || pimMode === 'filter'
          ),
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
  const distinctModelKeys = new Set(
    pimProducts
      .map(p => p.model_code || p.cms_product_id || p.sku)
      .filter(Boolean)
  );
  const distinctProductsCount = distinctModelKeys.size || pimProducts.length;
  const distinctCmsIdsCount = new Set(pimProducts.map(p => p.cms_product_id).filter(Boolean)).size;
  const distinctFilesCount = new Set(pimProducts.map(p => p.fileOrigin).filter(Boolean)).size;
  const singleValCount = validImportRows.filter(r => !r.trace.isMulti && r.trace.pimMode !== 'text').length;
  const multiValCount = validImportRows.filter(r => r.trace.isMulti).length;
  const textValCount = validImportRows.filter(r => r.trace.pimMode === 'text').length;

  // Detect dual-role CMS properties (mã CMS vừa dùng cho TSKT vừa dùng cho Filter)
  const propUsageModes = new Map(); // `${cmsCategoryId}___${cmsPropertyId}` => { tsktAttrs: Set, filterAttrs: Set, propName, catName }
  validImportRows.forEach(r => {
    const catId = String(r.trace.cmsCategoryId).trim();
    const propId = String(r.PROPERTYID).trim();
    const code = String(r.trace.pimAttributeCode || '').toLowerCase();

    // Ràng buộc nghiêm ngặt ngành 57 (Sạc dự phòng):
    // Mã 500 CHỈ LÀ FILTER, mã 23370 CHỈ LÀ TSKT
    if (catId === '57') {
      const key = `${catId}___${propId}`;
      if (!propUsageModes.has(key)) {
        propUsageModes.set(key, {
          tsktAttrs: new Set(),
          filterAttrs: new Set(),
          propName: r.trace.cmsPropertyName,
          catName: r.trace.cmsCategoryName
        });
      }
      if (propId === '500') {
        propUsageModes.get(key).filterAttrs.add(code);
        return;
      }
      if (propId === '23370') {
        propUsageModes.get(key).tsktAttrs.add(code);
        return;
      }
    }

    const isFilterCode = code.includes('filter_master') || code.includes('_filter_') || code.endsWith('_filter') || code.includes('_filter');
    const isTsktCode = code.includes('tskt_master') || code.includes('_tskt_') || code.endsWith('_tskt') || code.includes('_tskt');

    const isFilter = (isFilterCode || r.trace.pimMode === 'filter') && !isTsktCode;
    const isTskt = (isTsktCode || r.trace.pimMode === 'tskt') && !isFilterCode;

    const key = `${catId}___${propId}`;
    if (!propUsageModes.has(key)) {
      propUsageModes.set(key, {
        tsktAttrs: new Set(),
        filterAttrs: new Set(),
        propName: r.trace.cmsPropertyName,
        catName: r.trace.cmsCategoryName
      });
    }
    const entry = propUsageModes.get(key);
    if (isFilter) entry.filterAttrs.add(code);
    if (isTskt) entry.tsktAttrs.add(code);
  });

  const dualPurposeProperties = [];
  for (const [key, entry] of propUsageModes.entries()) {
    const [catId, propId] = key.split('___');
    // Tuyệt đối không bao giờ xếp mã 500 ngành 57 vào dual-purpose
    if (catId === '57' && propId === '500') continue;

    // Phải có ít nhất 2 thuộc tính PIM riêng biệt thực sự (1 bên TSKT, 1 bên Filter)
    const distinctTskt = Array.from(entry.tsktAttrs).filter(c => !entry.filterAttrs.has(c));
    const distinctFilter = Array.from(entry.filterAttrs).filter(c => !entry.tsktAttrs.has(c));

    if (distinctTskt.length > 0 && distinctFilter.length > 0) {
      dualPurposeProperties.push({
        cmsCategoryId: catId,
        cmsCategoryName: entry.catName,
        cmsPropertyId: propId,
        cmsPropertyName: entry.propName,
        tsktCodes: distinctTskt,
        filterCodes: distinctFilter
      });
    }
  }

  // Tag rows that use dual-purpose properties
  const dualPropKeys = new Set(dualPurposeProperties.map(dp => `${dp.cmsCategoryId}___${dp.cmsPropertyId}`));
  validImportRows.forEach(r => {
    const key = `${String(r.trace.cmsCategoryId).trim()}___${String(r.PROPERTYID).trim()}`;
    r.trace.isDualRole = dualPropKeys.has(key);
  });

  return {
    validImportRows,
    holdRows,
    proposals: Array.from(newProposalValues.values()),
    discrepancies: Array.from(discrepanciesMap.values()),
    dualPurposeProperties,
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
      smartSuggestionsCount: Array.from(newProposalValues.values()).filter(p => p.smartSuggestion).length,
      acceptedValueMappingsCount: Object.keys(valueMappings || {}).length,
      discrepanciesCount: discrepanciesMap.size,
      autoMappedCount: autoMappedMap.size,
      unmappedCount: unmappedMap.size,
      duplicateModelsCount: Array.from(duplicateModelStats.values()).filter(c => c > 1).length,
      skippedUnusedProductsCount: skippedUnusedCount
    }
  };
}
