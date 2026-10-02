const fs = require('fs');
const file = 'app/src/services/mappingEngine.js';
let code = fs.readFileSync(file, 'utf8');

// Hoàn tác các thay đổi
code = code.replace(
  "const isUsingP2 = !isUserConfirmedP1; // Auto-use P2 on discrepancy unless user explicitly forces P1",
  "const isUsingP2 = isUserConfirmedP2;"
);
code = code.replace(
  "if (isRealDiscrepancy && !isUserConfirmedP1) {",
  "if (isRealDiscrepancy && isUserConfirmedP2) {"
);
code = code.replace(
  "resolvedChoice: !isUserConfirmedP1 ? 'priority2' : 'priority1'",
  "resolvedChoice: isUserConfirmedP2 ? 'priority2' : (isUserConfirmedP1 ? 'priority1' : 'priority1')"
);

fs.writeFileSync(file, code);
console.log('Reverted mappingEngine.js');
