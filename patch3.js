const fs = require('fs');
const file = 'app/src/components/MappingRulesTab.jsx';
let code = fs.readFileSync(file, 'utf8');

const target1 = `              const isUsingPriority2 = currentAttr ? currentAttr.source === 'priority2_accepted' : false;
              const currentCode = isUsingPriority2 ? p2Code : p1Code;`;
const replace1 = `              const isUsingPriority2 = currentAttr ? currentAttr.source === 'priority2_accepted' : false;
              const isUsingPriority1 = currentAttr ? currentAttr.source === 'priority1_accepted' : false;
              const isConfirmed = isUsingPriority1 || isUsingPriority2;
              const currentCode = isUsingPriority2 ? p2Code : p1Code;`;
code = code.replace(target1, replace1);

const target2 = `                    {/* Active State Badge */}
                    {isUsingPriority2 ? (`;
const replace2 = `                    {/* Active State Badge */}
                    {!isConfirmed ? (
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
                        <AlertTriangle size={12} strokeWidth={3} />
                        <span>Chưa xác nhận (Đang bị tạm giữ)</span>
                      </span>
                    ) : isUsingPriority2 ? (`;
code = code.replace(target2, replace2);

const target3 = `                    {/* Priority 1 Button */}
                    <button
                      type="button"
                      onClick={() => handleSelectDiscrepancyCode(disc, p1Code, false)}
                      style={{
                        fontSize: '0.76rem',
                        padding: '6px 14px',
                        borderRadius: '7px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                        ...(!isUsingPriority2 ? {`;
const replace3 = `                    {/* Priority 1 Button */}
                    <button
                      type="button"
                      onClick={() => handleSelectDiscrepancyCode(disc, p1Code, false)}
                      style={{
                        fontSize: '0.76rem',
                        padding: '6px 14px',
                        borderRadius: '7px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                        ...(isUsingPriority1 ? {`;
code = code.replace(target3, replace3);

const target4 = `                      title={!isUsingPriority2 ? 'Đang áp dụng theo File tham chiếu (Ưu tiên 1)' : 'Chuyển sang áp dụng theo File tham chiếu (Ưu tiên 1)'}
                    >
                      {!isUsingPriority2 ? (
                        <>
                          <Check size={13} strokeWidth={3} />
                          <span>✔ Đang chọn: Ưu tiên 1 (File: {p1Code})</span>
                        </>
                      ) : (
                        <span>📁 Chuyển sang Ưu tiên 1 (File: {p1Code})</span>
                      )}
                    </button>`;
const replace4 = `                      title={isUsingPriority1 ? 'Đang áp dụng theo File tham chiếu (Ưu tiên 1)' : 'Chuyển sang áp dụng theo File tham chiếu (Ưu tiên 1)'}
                    >
                      {isUsingPriority1 ? (
                        <>
                          <Check size={13} strokeWidth={3} />
                          <span>✔ Đã chọn: Ưu tiên 1 (File: {p1Code})</span>
                        </>
                      ) : (
                        <span>📁 Chọn Ưu tiên 1 (File: {p1Code})</span>
                      )}
                    </button>`;
code = code.replace(target4, replace4);

const target5 = `                    {/* Priority 2 Button */}
                    <button
                      type="button"
                      onClick={() => handleSelectDiscrepancyCode(disc, p2Code, true)}
                      style={{
                        fontSize: '0.76rem',
                        padding: '6px 14px',
                        borderRadius: '7px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                        ...(isUsingPriority2 ? {`;
const replace5 = `                    {/* Priority 2 Button */}
                    <button
                      type="button"
                      onClick={() => handleSelectDiscrepancyCode(disc, p2Code, true)}
                      style={{
                        fontSize: '0.76rem',
                        padding: '6px 14px',
                        borderRadius: '7px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                        ...(isUsingPriority2 ? {`;
code = code.replace(target5, replace5); // No change needed here, just want to check if it's there

const target6 = `                      title={isUsingPriority2 ? 'Đang áp dụng theo CMS thông minh (Ưu tiên 2)' : 'Chuyển sang áp dụng theo CMS thông minh (Ưu tiên 2)'}
                    >
                      {isUsingPriority2 ? (
                        <>
                          <Check size={13} strokeWidth={3} />
                          <span>✔ Đang chọn: Ưu tiên 2 (CMS: {p2Code})</span>
                        </>
                      ) : (
                        <span>⚡ Chuyển sang Ưu tiên 2 (CMS: {p2Code})</span>
                      )}
                    </button>`;
const replace6 = `                      title={isUsingPriority2 ? 'Đang áp dụng theo CMS thông minh (Ưu tiên 2)' : 'Chuyển sang áp dụng theo CMS thông minh (Ưu tiên 2)'}
                    >
                      {isUsingPriority2 ? (
                        <>
                          <Check size={13} strokeWidth={3} />
                          <span>✔ Đã chọn: Ưu tiên 2 (CMS: {p2Code})</span>
                        </>
                      ) : (
                        <span>⚡ Chọn Ưu tiên 2 (CMS: {p2Code})</span>
                      )}
                    </button>`;
code = code.replace(target6, replace6);

// Note: I also need to make sure AlertTriangle is imported if not already. Let's assume it is or just use a generic icon.
// I will just change <AlertTriangle .../> to <span style={{fontSize:'12px'}}>⚠️</span> to be safe.
code = code.replace("<AlertTriangle size={12} strokeWidth={3} />", "<span style={{fontSize:'12px'}}>⚠️</span>");

fs.writeFileSync(file, code);
console.log('Patched MappingRulesTab.jsx');
