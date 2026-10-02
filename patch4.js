const fs = require('fs');
const file = 'app/src/components/MappingRulesTab.jsx';
let code = fs.readFileSync(file, 'utf8');

// target1:
code = code.replace(
  "const currentCode = isUsingPriority2 ? p2Code : p1Code;",
  "const isUsingPriority1 = currentAttr ? currentAttr.source === 'priority1_accepted' : false;\n              const isConfirmed = isUsingPriority1 || isUsingPriority2;\n              const currentCode = isUsingPriority2 ? p2Code : p1Code;"
);

// target2:
code = code.replace(
  "{/* Active State Badge */}\n                    {isUsingPriority2 ? (",
  `{/* Active State Badge */}\n                    {!isConfirmed ? (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: '6px',
                        background: '#fef3c7',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{fontSize:'12px'}}>⚠️</span>
                        <span>Chưa xác nhận (Đang bị tạm giữ)</span>
                      </span>
                    ) : isUsingPriority2 ? (`
);

// target3:
code = code.replace(
  "...(!isUsingPriority2 ? {",
  "...(isUsingPriority1 ? {"
);

fs.writeFileSync(file, code);
console.log('Patched MappingRulesTab.jsx Sub-tab loop');
