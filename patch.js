const fs = require('fs');
const file = 'app/src/services/mappingEngine.js';
let code = fs.readFileSync(file, 'utf8');

// Thay đổi mặc định dùng Priority 2 khi có discrepancy
code = code.replace(
  "const isUsingP2 = isUserConfirmedP2;",
  "const isUsingP2 = !isUserConfirmedP1; // Auto-use P2 on discrepancy unless user explicitly forces P1"
);
code = code.replace(
  "let sourceTag = 'priority1';",
  "let sourceTag = 'priority1';"
);
code = code.replace(
  "if (isRealDiscrepancy && isUserConfirmedP2) {",
  "if (isRealDiscrepancy && !isUserConfirmedP1) {"
);

fs.writeFileSync(file, code);
console.log('Patched mappingEngine.js');
