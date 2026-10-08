# QUY TẮC NGHIỆP VỤ & BẢN ĐẶC TẢ HỆ THỐNG (SYSTEM LOGIC SPECIFICATION)
> **TÀI LIỆU QUAN TRỌNG - SINGLE SOURCE OF TRUTH (SSOT)**
> Tất cả các phiên làm việc và nâng cấp tính năng tương lai PHẢI tuân thủ nghiêm ngặt các quy tắc logic này. Tuyệt đối không tự ý thay đổi, bỏ qua hoặc làm hồi quy (regression) các tính năng cốt lõi.

---

## 1. KIẾN TRÚC MÃ NGUỒN & PHÂN TÁCH TRÁCH NHIỆM

Toàn bộ logic nghiệp vụ được tách biệt hoàn toàn khỏi giao diện (UI) và tập trung tại thư mục `app/src/services/`:

| Tên File | Vai Trò & Trách Nhiệm Nghiệp Vụ |
| :--- | :--- |
| **`mappingEngine.js`** | **Trái tim xử lý dữ liệu**: Chạy bộ máy chuyển đổi PIM ➔ CMS, giải quyết độ ưu tiên (Priority 1 vs 2), đối soát giá trị, phát hiện chênh lệch, phân loại hàng giữ lại (Hold Rows), tạo đề xuất (Proposals), thống kê tổng hợp. |
| **`excelParser.js`** | **Xử lý nạp & bóc tách Excel**: Đọc các file PIM sản phẩm, Catalog CMS, Option PIM, File mẫu, khử trùng lặp biến thể, chuẩn hóa tiêu đề và nhãn tiếng Việt. |
| **`excelExporter.js`** | **Xuất file chuẩn CMS**: Tạo file Excel import sản phẩm (Product Import) và file import giá trị (Value Import) theo đúng định dạng mẫu của CMS, hỗ trợ 2 chế độ hiển thị (Text / Mã số) và 2 phạm vi xuất. |
| **`dbService.js`** | **Lưu trữ dữ liệu nền tảng (IndexedDB)**: Lưu trữ bền vững 6 bộ dữ liệu mẫu master (`cmsCatalog`, `pimOption`, `mappingRef`, `cmsTemplate`, `catMappingRef`, `cmsValueTemplate`). |
| **`storageService.js`** | **Lưu trữ cấu hình & quy tắc**: Tự động lưu bảng quy tắc người dùng, thông tin cá nhân (Username, Site ID...), đồng bộ và sao lưu/phục hồi file JSON. |
| **`pimDecoderService.js`** | **Tiện ích dịch Option PIM**: Tra cứu nhanh mã option PIM sang text tiếng Việt. |

---

## 2. QUY TẮC ĐỐI SOÁT & MAPPING THUỘC TÍNH (INVIOLABLE RULES)

### 2.1. Thứ Tự Ưu Tiên Xác Định Ngành Hàng (Category Mapping)
Khi quét một dòng sản phẩm PIM, ngành hàng CMS được xác định theo thứ tự ưu tiên:
1. **Cột `category_code`** của sản phẩm (ví dụ: mã 24, 65, 87...).
2. **Cột `family_code`** của sản phẩm (ví dụ: `sac_du_phong_tgdd`, `chuot_may_tinh_tgdd`...).
3. **Ngành hàng gán thủ công** theo file PIM (`assignedCmsCategory`).
4. Nếu cả 3 cấp đều không tìm thấy ánh xạ ➔ Dòng sản phẩm bị đưa vào danh sách **Hold Rows** (Lý do: Chưa map ngành hàng).

### 2.2. Thứ Tự Ưu Tiên Ánh Xạ Thuộc Tính (Attribute Mapping Priority)
Mỗi cột thuộc tính PIM trong từng ngành hàng được đối soát theo thứ bậc nghiêm ngặt:
- **Ưu tiên 1 (Priority 1 - Bắt buộc / Ground Truth)**:
  - Lấy từ file quy tắc tham chiếu chuẩn (`thuoc_tinh_pim_cms.xlsx` / `mappingRef`) hoặc quy tắc người dùng đã chủ động xác nhận.
  - **NGUYÊN TẮC BẤT DI BẤT DỊCH**: Hệ thống LUÔN LUÔN áp dụng Ưu tiên 1 làm mặc định. Tuyệt đối không tự ý thay thế bằng Ưu tiên 2.
- **Ưu tiên 2 (Priority 2 - Smart Auto-Mapping)**:
  - Thuật toán thông minh gợi ý thuộc tính CMS từ `cmsCatalog` dựa trên tên tiếng Việt và mã ngành hàng.
  - **Kiểm tra chống chiếm dụng thuộc tính (Conflict Prevention)**: Nếu một `cmsPropertyId` đã được ánh xạ qua Ưu tiên 1 cho cột PIM khác trong cùng ngành hàng, Ưu tiên 2 **KHÔNG ĐƯỢC PHÉP** gợi ý mã đó cho cột này để tránh xung đột dữ liệu.
- **Xử lý Chênh Lệch (Discrepancy Detection)**:
  - Khi Ưu tiên 1 và Ưu tiên 2 trỏ về 2 `cmsPropertyId` khác nhau, hệ thống ghi nhận vào tab "Chênh lệch".
  - Dữ liệu chuyển đổi vẫn **chạy theo Ưu tiên 1**, chỉ chuyển sang Ưu tiên 2 khi người dùng bấm nút xác nhận "Duyệt Ưu tiên 2".

---

## 3. QUY TẮC XỬ LÝ & BÓC TÁCH GIÁ TRỊ (VALUE RESOLUTION)

1. **Thuộc tính Dạng Text (`pimMode === 'text'` hoặc Thuộc tính CMS có VALUEID & VALUE trống)**:
   - Áp dụng cho:
     - Các cột cấu hình text (Tên model, kích thước `size_`, khối lượng `mass_`, dòng sản phẩm...).
     - **Thuộc tính CMS dạng nhập text**: Trong file danh mục thuộc tính & giá trị CMS (`file-tt-gt.xlsx` / `cmsCatalog`), các cột `VALUEID` và `VALUE` bị trống (hoặc `values.length === 0`). Trên hệ thống CMS, các thuộc tính này là ô nhập text tự do, không có danh mục option cố định nên khi CMS đổ dữ liệu ra file thì cột `VALUEID`/`VALUE` không có dữ liệu.
   - **Xử lý khi xuất import**: Lấy trực tiếp chuỗi văn bản từ PIM truyền thẳng vào file import sản phẩm (`import_sp_cms.xlsx`) tại cột `PROPVALUEID` và `PROPVALUETEXT`, tuyệt đối KHÔNG coi là thiếu mã VALUEID, KHÔNG tạo đề xuất tạo mới (Proposals) và KHÔNG giữ lại ở Hold Rows.
2. **Thuộc tính Dạng Bộ Lọc (`pimMode === 'filter'`)**:
   - Dữ liệu PIM thường lưu dưới dạng mảng JSON (ví dụ: `["140", "6"]`) hoặc mã số đơn.
   - Bắt buộc phải giải mã qua `option_pim.xlsx` để lấy chuỗi văn bản (ví dụ: mã `140` ➔ `10.000 mAh`).
   - Sau đó tra cứu trong CMS Catalog để lấy `VALUEID` tương ứng.
3. **Thuộc tính Dạng Thông Số Kỹ Thuật (`pimMode === 'tskt'`)**:
   - Phân tách đa giá trị bằng dấu gạch đứng `|`.
   - Tra cứu trực tiếp text với danh sách giá trị của thuộc tính đó trong Catalog CMS.
4. **Xử Lý Định Dạng Xuất Theo `PROPERTYTYPE` (QUY TẮC BẤT DI BẤT DỊCH)**:
   - **Căn cứ hệ thống**: Luôn đối chiếu theo kiểu thuộc tính trên CMS (`PROPERTYTYPE` trong `cmsCatalog`), tuyệt đối không căn cứ vào số lượng giá trị trên PIM:
     - **`PROPERTYTYPE = 0` (Nhập Text)**: Điền trực tiếp chuỗi văn bản tự do.
     - **`PROPERTYTYPE = 1` (Chọn 1 / Single-select)**: Xuất mã số đơn thuần, ví dụ: `123`.
     - **`PROPERTYTYPE = 2` (Chọn nhiều / Multi-select)**:
       - **TUYỆT ĐỐI KHÔNG TÁCH NHIỀU DÒNG**: Trên CMS, nếu tách nhiều dòng có cùng `PRODUCTID` và `PROPERTYID`, dòng import sau sẽ ghi đè làm mất dòng trước. Toàn bộ các giá trị của một thuộc tính phải nằm trên **1 dòng duy nhất**.
       - **ĐỊNH DẠNG BẮT BUỘC BỌC DẤU PHẨY TRƯỚC VÀ SAU**: Danh sách `VALUEID` phải có dấu phẩy ở cả đầu và cuối, ví dụ: `,123,` hoặc `,123,124,125,`.
       - **Lưu ý đặc biệt**: Dù trên file PIM người dùng chỉ chọn 1 giá trị (vd `123`), nhưng nếu trên CMS thuộc tính đó là `PROPERTYTYPE = 2` thì vẫn BẮT BUỘC xuất ra dạng `,123,`.
5. **Thuộc Tính Hai Vai Trò (Dual-Role Properties) & Quy Tắc Bất Biến Ngành 57**:
   - Nếu 1 mã thuộc tính CMS vừa được dùng làm TSKT vừa được dùng làm Bộ lọc, hệ thống tự động nhận diện và gắn cờ `isDualRole` để đối soát đầy đủ cả hai vai trò (áp dụng khi có 2 cột PIM riêng biệt thực sự trỏ về cùng mã CMS).
   - **QUY TẮC BẤT DI BẤT DỊCH (NGÀNH 57 - SẠC DỰ PHÒNG)**:
     - **Mã CMS `500` (`Dung lượng pin`) CHỈ DÙNG CHO FILTER** (ánh xạ từ `battery_capacity_filter_master`). Tuyệt đối không được báo là vừa TSKT vừa Filter, và không được dùng làm TSKT.
     - **Mã CMS `23370` (`Dung lượng pin`) CHỈ DÙNG CHO TSKT** (ánh xạ từ `battery_capacity_tskt_master`).
     - Hai mã này trên CMS là hai thuộc tính riêng biệt (500 chứa các giá trị filter dạng chữ `20.000 mAh`, còn 23370 chứa giá trị số `20000`). Smart Auto-Mapping và hệ thống chuyển đổi TUYỆT ĐỐI không được đánh tráo hay đề xuất mã 500 cho TSKT.
6. **Thuật Toán AI Smart Value Matcher (Gợi Ý Khớp Thông Minh Giá Trị Filter & TSKT)**:
   - Nhận diện các thuộc tính Bộ lọc qua mã `filter_master`, `_filter`, hoặc `pimMode === 'filter'`.
   - Khi giá trị PIM không khớp chính xác với CMS Catalog do khác cách biểu diễn (vd: `20000mAh` vs `20.000 mAh` vs `20000`, `Type-C` vs `Type C`, `65W` vs `65 W`):
     - Thuật toán `findSmartCmsValueSuggestion` phân rã canonical number, unit, spacing.
     - **3 RÀNG BUỘC AN TOÀN CHỐNG GỢI Ý SAI**:
       1. Bất biến số lượng: Các con số phải trùng khớp tuyệt đối (10.000 mAh KHÔNG BAO GIỜ gợi ý 20.000 mAh).
       2. Tính phân cực: "Có" không gợi ý "Không", "Có dây" không gợi ý "Không dây".
       3. Không trùng chéo đơn vị: W không gợi ý mAh.
     - Hệ thống đưa ra gợi ý kèm độ tin cậy và nút **"Dùng giá trị này"**.
     - Nếu người dùng xác nhận dùng ➔ Lưu vào `valueMappings`, giá trị được nạp trực tiếp vào file import CMS với `VALUEID` chuẩn của Filter.
     - Nếu người dùng không tác động gì ➔ Hệ thống vẫn giữ trong danh sách đề xuất tạo mới như bình thường.

---

## 4. QUY TẮC ĐỊNH DANH SẢN PHẨM & KHỬ TRÙNG LẶP (PRODUCT IDENTITY & DEDUPLICATION)

1. **Định Danh Sản Phẩm Trên CMS**:
   - Mã sản phẩm CMS chuẩn là **`model_id_cms`** (chính là `PRODUCTID` trên hệ thống CMS).
   - Nếu dòng PIM không có `model_id_cms` ➔ Dòng đó bị giữ lại ở **Hold Rows** vì không thể import lên CMS nếu thiếu ID sản phẩm.
2. **Khử Trùng Lặp Biến Thể**:
   - Trong file PIM nhiều dòng biến thể của cùng một model, hệ thống tự động khử trùng lặp theo `model_id_cms` (hoặc `model_code`), chỉ giữ lại 1 đại diện dữ liệu duy nhất để tránh tạo dòng rác trên CMS.
3. **Thống Kê Sản Phẩm (Stats Counting)**:
   - Số lượng sản phẩm hiển thị chuẩn xác dựa trên danh sách sản phẩm duy nhất: fallback linh hoạt `model_code || cms_product_id || sku` để đảm bảo ngay cả khi file không có cột `model_code`, số lượng vẫn luôn hiển thị chuẩn xác.

---

## 5. QUY TẮC XUẤT FILE CMS (EXPORT SPECIFICATION)

1. **Thông Tin Người Dùng & Tham Số Bắt Buộc**:
   - Các trường bắt buộc đánh dấu `*` đỏ và kiểm tra trước khi xuất:
     - `Mã nhân viên (USERNAME)*`
     - `Họ và tên (FULLNAME)*`
     - `Chọn site (SITEID)*` (mặc định: `1 - Thế Giới Di Động`)
     - `Ngôn ngữ (LANGUAGEID)` (mặc định: `vi-VN`)
2. **Hai Chế Độ Xuất File**:
   - **Chế độ Text**: Hiển thị tên thuộc tính và giá trị dạng chữ (dễ đọc, kiểm tra nội bộ).
   - **Chế độ Mã số (Chuẩn CMS Import)**: Cột `VALUEID` và `PROPERTYID` xuất mã số kỹ thuật để nạp trực tiếp vào cơ sở dữ liệu CMS.
3. **Hai Phương Án Phạm Vi Xuất**:
   - **Phương án 1**: Xuất toàn bộ dữ liệu hợp lệ đã đối soát.
   - **Phương án 2**: Xuất có chọn lọc theo danh sách ID sản phẩm / Model mục tiêu (nhập paste text hoặc nạp file Excel danh sách).
4. **Xuất File Giá Trị Đề Xuất (Value Import)**:
   - Các giá trị PIM chưa có trên CMS được xuất riêng thành file import giá trị CMS chuẩn mẫu (`import_gt_cms.xlsx`) để quản trị viên duyệt trước.

---

## 6. HƯỚNG DẪN DÀNH CHO CÁC PHIÊN PHÁT TRIỂN / NÂNG CẤP TIẾP THEO

- **Ghi nhớ toàn diện & Không hỏi lại**: Tất cả các quy tắc đã chốt trong tài liệu này (xử lý thuộc tính text khi VALUEID/VALUE trống, phân tách mã 500/23370 ngành 57, thứ tự ưu tiên 1 > 2, định danh `model_id_cms`, khử trùng lặp biến thể, đường dẫn assets GitHub Pages...) là **bất biến**. Hệ thống và các phiên AI tiếp theo PHẢI tự động tuân thủ nghiêm ngặt, tuyệt đối không hỏi lại người dùng những điều đã thống nhất.
- **Trước khi chỉnh sửa code**: Luôn đối chiếu với tài liệu này để đảm bảo không làm gãy luồng mapping.
- **Khi thêm tính năng mới**:
  - Không viết logic tính toán/mapping trực tiếp vào component React. Hãy viết hàm thuần túy (pure function) trong thư mục `services/`.
  - Luôn chạy `npm run build` để kiểm tra toàn vẹn mã nguồn và bundle trước khi bàn giao.

---

## 7. QUY TẮC TÀI NGUYÊN TĨNH & DEPLOY GITHUB PAGES (ASSETS & DEPLOYMENT)

- **Xử lý ảnh & logo**: Toàn bộ ảnh, logo, icon hiển thị trong giao diện (như `dmx-logo.png`, `dmx-icon.png`) PHẢI được lưu trong `app/src/assets/` và import trực tiếp qua JavaScript (`import logo from '../assets/...'`) để Vite đóng gói hash và tạo đường dẫn tương đối (`new URL(...)`).
- **Tuyệt đối không dùng đường dẫn tuyệt đối dạng root**: Không viết `<img src="/dmx-logo.png" />` trong JSX vì khi deploy lên GitHub Pages (`https://username.github.io/repo-name/`), trình duyệt sẽ tìm ở domain gốc dẫn đến lỗi 404 vỡ ảnh.

