const fs = require('fs');
const file = 'app/src/services/mappingEngine.js';
let code = fs.readFileSync(file, 'utf8');

const target = "if ((normLabel === 'ket noi' && pNorm.includes('khoang cach')) || (pNorm === 'ket noi' && normLabel.includes('khoang cach'))) continue;";
const replacement = `const isKetNoi = (s) => s === 'ket noi' || s === 'cach ket noi' || s === 'chuan ket noi';
      if ((isKetNoi(normLabel) && pNorm.includes('khoang cach')) || (isKetNoi(pNorm) && normLabel.includes('khoang cach'))) continue;`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
console.log("Updated false positive mapping for cach ket noi");
