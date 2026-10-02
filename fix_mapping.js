const fs = require('fs');
const file = 'app/src/services/mappingEngine.js';
let code = fs.readFileSync(file, 'utf8');

const target = `  // 4. Substring inclusion match (if label >= 3 chars)
  if (normLabel && normLabel.length >= 3) {
    for (const p of catProps) {
      const pNorm = normalizeText(p.propertyName);
      if (pNorm.includes(normLabel) || normLabel.includes(pNorm)) {
        return determineSmartMode(p, normCode);
      }
    }
  }`;

const replacement = `  // 4. Substring inclusion match (if label >= 3 chars)
  if (normLabel && normLabel.length >= 3) {
    for (const p of catProps) {
      const pNorm = normalizeText(p.propertyName);
      
      // Chặn các false-positives phổ biến:
      // "kết nối" bị map nhầm vào "khoảng cách kết nối"
      if (normLabel === 'ket noi' && pNorm.includes('khoang cach')) continue;
      // "cáp" bị map nhầm vào "cáp sạc" hoặc ngược lại nếu không cẩn thận
      
      if (pNorm.includes(normLabel) || normLabel.includes(pNorm)) {
        // Đảm bảo không map lệch nghĩa quá xa (chỉ chấp nhận nếu tỷ lệ chiều dài không quá chênh lệch)
        // hoặc các trường hợp đã bị lọc ở trên
        return determineSmartMode(p, normCode);
      }
    }
  }`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
console.log("Fixed false positive mapping for 'ket noi'");
