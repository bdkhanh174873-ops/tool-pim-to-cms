const fs = require('fs');
const file = 'app/src/services/mappingEngine.js';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "if (normLabel === 'ket noi' && pNorm.includes('khoang cach')) continue;",
  "if ((normLabel === 'ket noi' && pNorm.includes('khoang cach')) || (pNorm === 'ket noi' && normLabel.includes('khoang cach'))) continue;"
);

fs.writeFileSync(file, code);
console.log("Updated false positive mapping");
