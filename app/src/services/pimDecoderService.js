import * as XLSX from 'xlsx';

/**
 * Helper to normalize string for comparison
 */
function normalizeText(text) {
  if (!text) return '';
  return String(text).trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Decode option codes in a cell value using PIM Options dictionary
 * @param {string|any} rawValue - Cell value like '["3"]' or '["140", "6"]' or '25'
 * @param {string} attrCode - Column name like 'charging_port_filter_master'
 * @param {Map} optionsMap - Key: `${code.toLowerCase()}___${optCode}` -> optItem
 * @returns {{ decodedText: string, isDecoded: boolean, original: string }}
 */
export function decodeOptionCell(rawValue, attrCode, optionsMap) {
  if (rawValue === undefined || rawValue === null) {
    return { decodedText: '', isDecoded: false, original: '' };
  }

  const strVal = String(rawValue).trim();
  if (!strVal || !optionsMap || optionsMap.size === 0) {
    return { decodedText: strVal, isDecoded: false, original: strVal };
  }

  const colKey = attrCode ? attrCode.toLowerCase() : '';

  // 1. Case: JSON array string like '["140", "6"]' or '["3"]'
  if (strVal.startsWith('[') && strVal.endsWith(']')) {
    try {
      const parsed = JSON.parse(strVal);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let anyDecoded = false;
        const decodedList = parsed.map(code => {
          const sCode = String(code).trim();
          const lookupKey = `${colKey}___${sCode}`;
          const opt = optionsMap.get(lookupKey);
          if (opt && opt.optionValue) {
            anyDecoded = true;
            return opt.optionValue.trim();
          }
          return sCode;
        });

        if (anyDecoded) {
          return {
            decodedText: decodedList.join(', '),
            isDecoded: true,
            original: strVal
          };
        }
      }
    } catch {
      // Fall through to text handling if not valid JSON
    }
  }

  // 2. Case: Pipe-delimited codes like '140|6'
  if (strVal.includes('|')) {
    const parts = strVal.split('|').map(p => p.trim()).filter(Boolean);
    let anyDecoded = false;
    const decodedList = parts.map(code => {
      const lookupKey = `${colKey}___${code}`;
      const opt = optionsMap.get(lookupKey);
      if (opt && opt.optionValue) {
        anyDecoded = true;
        return opt.optionValue.trim();
      }
      return code;
    });

    if (anyDecoded) {
      return {
        decodedText: decodedList.join(', '),
        isDecoded: true,
        original: strVal
      };
    }
  }

  // 3. Case: Single numeric or alphanumeric option code like '3'
  const singleKey = `${colKey}___${strVal}`;
  const singleOpt = optionsMap.get(singleKey);
  if (singleOpt && singleOpt.optionValue) {
    return {
      decodedText: singleOpt.optionValue.trim(),
      isDecoded: true,
      original: strVal
    };
  }

  // Value is already plain text or non-option column
  return {
    decodedText: strVal,
    isDecoded: false,
    original: strVal
  };
}

/**
 * Decode an entire PIM Excel worksheet (2D array format)
 * @param {Array<Array<any>>} rawRows - All rows from Excel sheet (row 0: tech headers, row 1: vn labels, row 2+: data)
 * @param {Map} optionsMap - PIM Options map
 * @param {string} fileName - File name
 */
export function decodePimSheetRows(rawRows, optionsMap, fileName = 'sp_pim.xlsx') {
  if (!rawRows || rawRows.length < 2) {
    throw new Error('File PIM không đủ dữ liệu (tối thiểu 2 dòng header).');
  }

  const headers = (rawRows[0] || []).map(h => (h !== undefined && h !== null ? String(h).trim() : ''));
  const labels = (rawRows[1] || []).map(l => (l !== undefined && l !== null ? String(l).trim() : ''));

  const decodedRows = [];
  const decodedColIndices = new Set();
  let totalDecodedCells = 0;

  for (let r = 2; r < rawRows.length; r++) {
    const originalRow = rawRows[r] || [];
    const newRow = [];

    for (let c = 0; c < headers.length; c++) {
      const val = originalRow[c];
      const attrCode = headers[c];
      const res = decodeOptionCell(val, attrCode, optionsMap);

      if (res.isDecoded) {
        decodedColIndices.add(c);
        totalDecodedCells++;
        newRow.push(res.decodedText);
      } else {
        newRow.push(val !== undefined && val !== null ? val : '');
      }
    }
    decodedRows.push(newRow);
  }

  const decodedColNames = Array.from(decodedColIndices).map(idx => ({
    index: idx,
    header: headers[idx],
    label: labels[idx] || headers[idx]
  }));

  return {
    fileName,
    headers,
    labels,
    decodedRows,
    rawRows: rawRows.slice(2),
    decodedColIndices,
    decodedColNames,
    stats: {
      totalRows: decodedRows.length,
      totalCols: headers.length,
      decodedColsCount: decodedColIndices.size,
      totalDecodedCells
    }
  };
}

/**
 * Decode from parsed PIM products list (when reading from App state)
 * @param {Array<object>} products - Products list with rawAttributes
 * @param {Array<string>} headers - Headers list
 * @param {Array<string>} labels - Labels list
 * @param {Map} optionsMap - PIM Options map
 * @param {string} fileName - File name
 */
export function decodePimProductsList(products = [], headers = [], labels = [], optionsMap, fileName = 'sp_pim.xlsx') {
  if (!products || products.length === 0) {
    return {
      fileName,
      headers: headers || [],
      labels: labels || [],
      decodedRows: [],
      rawRows: [],
      decodedColIndices: new Set(),
      decodedColNames: [],
      stats: { totalRows: 0, totalCols: headers.length, decodedColsCount: 0, totalDecodedCells: 0 }
    };
  }

  // Ensure standard columns are present in headers
  const baseCols = ['model_id_cms', 'model_code', 'sku', 'category_code', 'family_code'];
  const allHeadersSet = new Set(headers);
  baseCols.forEach(c => allHeadersSet.add(c));
  
  // Collect all attribute keys found in products
  products.forEach(p => {
    if (p.rawAttributes) {
      Object.keys(p.rawAttributes).forEach(k => allHeadersSet.add(k));
    }
  });

  const finalHeaders = Array.from(allHeadersSet);
  const finalLabels = finalHeaders.map((h, i) => labels[i] || h);

  const decodedRows = [];
  const rawRows = [];
  const decodedColIndices = new Set();
  let totalDecodedCells = 0;

  products.forEach(p => {
    const decRow = [];
    const origRow = [];

    finalHeaders.forEach((h, cIdx) => {
      let rawVal = '';
      if (h === 'model_id_cms') rawVal = p.cms_product_id || '';
      else if (h === 'model_code') rawVal = p.model_code || '';
      else if (h === 'sku') rawVal = p.sku || '';
      else if (h === 'category_code') rawVal = p.category_code || '';
      else if (h === 'family_code') rawVal = p.family_code || '';
      else if (p.rawAttributes && p.rawAttributes[h] !== undefined) {
        rawVal = p.rawAttributes[h];
      }

      origRow.push(rawVal);

      const res = decodeOptionCell(rawVal, h, optionsMap);
      if (res.isDecoded) {
        decodedColIndices.add(cIdx);
        totalDecodedCells++;
        decRow.push(res.decodedText);
      } else {
        decRow.push(rawVal);
      }
    });

    decodedRows.push(decRow);
    rawRows.push(origRow);
  });

  const decodedColNames = Array.from(decodedColIndices).map(idx => ({
    index: idx,
    header: finalHeaders[idx],
    label: finalLabels[idx] || finalHeaders[idx]
  }));

  return {
    fileName,
    headers: finalHeaders,
    labels: finalLabels,
    decodedRows,
    rawRows,
    decodedColIndices,
    decodedColNames,
    stats: {
      totalRows: decodedRows.length,
      totalCols: finalHeaders.length,
      decodedColsCount: decodedColIndices.size,
      totalDecodedCells
    }
  };
}

/**
 * Export decoded PIM dataset to Excel (.xlsx) file
 * @param {Array<string>} headers - Technical headers (Row 1)
 * @param {Array<string>} labels - Vietnamese labels (Row 2)
 * @param {Array<Array<any>>} rows - Decoded data rows (Row 3+)
 * @param {string} originalFileName - Base name for exported file
 */
export function exportDecodedPimToExcel(headers, labels, rows, originalFileName = 'sp_pim.xlsx') {
  const wb = XLSX.utils.book_new();
  const sheetData = [headers, labels, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Auto width for columns
  const colWidths = headers.map((h, i) => {
    const headerLen = Math.max(String(h).length, String(labels[i] || '').length);
    // Sample first 20 rows to determine content width
    let maxContentLen = 0;
    for (let r = 0; r < Math.min(rows.length, 30); r++) {
      const cellVal = rows[r] ? String(rows[r][i] || '') : '';
      if (cellVal.length > maxContentLen) {
        maxContentLen = cellVal.length;
      }
    }
    return { wch: Math.min(Math.max(headerLen + 2, maxContentLen + 2, 12), 50) };
  });

  ws['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, ws, 'PIM_Da_Giai_Ma_Chu');

  const baseName = originalFileName.replace(/\.[^/.]+$/, '');
  const exportFileName = `${baseName}_da_dich_option_chu.xlsx`;

  XLSX.writeFile(wb, exportFileName);
  return exportFileName;
}
