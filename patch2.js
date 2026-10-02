const fs = require('fs');
const file = 'app/src/services/mappingEngine.js';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `      if (p1Rule) {
        // Determine which ID to apply:
        // MẶC ĐỊNH ÁP DỤNG ƯU TIÊN 1 (p1FileId)
        // Chỉ khi có chênh lệch thực tế VÀ người dùng đã duyệt chọn Ưu tiên 2 thì mới áp dụng p2CmsId
        let sourceTag = 'priority1';`;

const replaceStr = `      if (p1Rule) {
        if (isRealDiscrepancy && !isUserConfirmedP1 && !isUserConfirmedP2) {
          // KHÔNG TỰ QUYẾT: Đưa vào holdRows để cảnh báo và chờ người dùng xác nhận
          holdRows.push({
            id: \`hold_disc_\${rowIndex}_\${pimAttrCode}_\${Math.random().toString(36).substring(2, 7)}\`,
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
            cmsPropertyName: '(Có chênh lệch - Chờ xác nhận)',
            pimMode: 'unknown',
            rawItems: [String(rawValue)],
            resolvedItems: [],
            conflictList: [{
              type: 'discrepancy',
              message: \`Chênh lệch ID: File Excel (Ưu tiên 1) dùng \${p1FileId}, nhưng CMS (Ưu tiên 2) gợi ý \${p2CmsId}. Vui lòng vào tab Quy Tắc Ánh Xạ để chọn.\`
            }],
            hasMultipleValueIds: false,
            reason: 'Chênh lệch ID chưa xác nhận',
            detail: \`Thuộc tính "\${pimAttrLabel || pimAttrCode}" có sự chênh lệch giữa File tham chiếu (Ưu tiên 1) và CMS (Ưu tiên 2). Hệ thống đang chờ bạn xác nhận sẽ áp dụng ID nào ở tab Quy Tắc Ánh Xạ.\`
          });
          continue; // Bỏ qua không xuất dòng này cho đến khi được chọn
        }

        // Determine which ID to apply:
        let sourceTag = 'priority1';`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync(file, code);
console.log('Patched mappingEngine.js for holdRows');
