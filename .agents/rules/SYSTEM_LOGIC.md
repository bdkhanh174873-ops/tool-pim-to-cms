# BẢN ĐẶC TẢ QUY TẮC NGHIỆP VỤ HỆ THỐNG PIM SANG CMS
> **TÀI LIỆU CHỈ ĐẠO CỐT LÕI (CORE SYSTEM RULES)**
> File này được nạp tự động vào tất cả các phiên làm việc của AI Agent. Bất kỳ nâng cấp nào cũng phải tuân thủ nghiêm ngặt các quy tắc dưới đây.

## 1. NƠI LƯU TRỮ LOGIC TRONG CODEBASE
Toàn bộ logic chuyển đổi, phân loại và bóc tách dữ liệu KHÔNG ĐƯỢC để trong file UI mà phải nằm ở `app/src/services/`:
- `mappingEngine.js`: Động cơ chuyển đổi, thứ tự ưu tiên 1 & 2, đối soát, phát hiện chênh lệch, khử xung đột mã, phân loại hold rows, thống kê.
- `excelParser.js`: Nạp và bóc tách Excel, lọc trùng lặp biến thể theo `model_id_cms`/`model_code`.
- `excelExporter.js`: Xuất file chuẩn CMS (file import sản phẩm và file import giá trị).
- `dbService.js`: Lưu trữ IndexedDB 6 file dữ liệu nền tảng master.
- `storageService.js`: Lưu trữ cấu hình người dùng, bảng quy tắc, đồng bộ JSON.

## 2. NGUYÊN TẮC BẤT DI BẤT DỊCH
1. **Ưu tiên 1 là Tối thượng**: File tham chiếu (`thuoc_tinh_pim_cms.xlsx` / `mappingRef`) luôn là gốc. Ưu tiên 2 (gợi ý tự động thông minh) chỉ dùng để tham khảo, không tự ý đè lên Ưu tiên 1 khi chưa có xác nhận từ người dùng.
2. **Chống xung đột (Conflict check)**: Ưu tiên 2 không được phép gợi ý 1 mã `cmsPropertyId` nếu mã đó đã bị cột PIM khác chiếm qua Ưu tiên 1 trong cùng ngành hàng.
3. **Định danh sản phẩm**: Mã sản phẩm CMS là `model_id_cms` (PRODUCTID trên CMS). Khi đếm số lượng model/sản phẩm luôn fallback: `model_code || cms_product_id || sku`.
4. **Đa giá trị (Multi-value)**: Tách thành nhiều dòng độc lập trong file xuất CMS với cùng PRODUCTID.
5. **Dạng dữ liệu**:
   - `filter`: Bắt buộc giải mã qua Option PIM ra text rồi map sang VALUEID CMS.
   - `tskt`: Tách bằng `|` và map trực tiếp với danh mục CMS.
   - `text`: Giữ nguyên chuỗi, không ép buộc tìm VALUEID.
6. **Tham số xuất bắt buộc**: USERNAME*, FULLNAME*, SITEID*, LANGUAGEID.
7. **AI Smart Value Matcher (Gợi ý giá trị Filter & TSKT)**:
   - Tự động nhận diện thuộc tính Filter (`filter_master`, `_filter`).
   - Tự động tìm giá trị CMS tương ứng khi chỉ khác cách biểu diễn (số, dấu chấm hàng nghìn, đơn vị, khoảng trắng).
   - Ràng buộc an toàn: Bất biến số lượng (10000 !== 20000), không map phủ định (Có !== Không).
   - Khi người dùng xác nhận dùng ➔ Nạp thẳng vào Dòng Import Hợp Lệ với VALUEID chuẩn CMS.
