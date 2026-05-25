# App quản lý sản xuất

Ứng dụng hỗ trợ quản lý sản xuất cho nhà máy

## 🌐 Truy cập website

Link demo:

```text
https://quanlysanxuat.onrender.com
```

## 🔐 Tài khoản đăng nhập demo

| Username | Password | Vai trò |
|---|---|---|
| admin | 123456 | Nhân viên mua hàng |

> Tài khoản này dùng để trải nghiệm chức năng demo của hệ thống.

## 🧭 Luồng sử dụng cơ bản

Người dùng có thể tiếp cận hệ thống theo luồng sau:
### Nhập nguyên liệu và Lên kế hoạch sản xuất

```text
Đăng nhập
→ Tạo nhân viên và chức vụ
→ Khai báo thành phẩm
→ Khai báo nguyên vật liệu
→ Tạo BOM / định mức sản xuất
→ Tạo phiếu nhập nguyên liệu
→ Nhận nguyên liệu
→ Tính toán khả năng sản xuất
→ Tạo kế hoạch sản xuất
→ Tạo lệnh sản xuất
```

---

### Bước 1: Tạo nhân viên và chức vụ

Vào mục:

```text
Nhân sự → Nhân viên / Chức vụ
```

Người dùng có thể tạo nhân viên và chức vụ, nhưng bắt buộc phải có những nhân viên với những chức vụ sau:

- Nhân viên mua hàng
- Nhân viên kho
- Trưởng ban kiểm nghiệm
- Ủy ban kiểm nghiệm

---

### Bước 2: Khai báo thành phẩm

Tạo các thành phẩm cần sản xuất, ví dụ:

- Nón bảo hộ
- Quần áo bảo hộ
- Giày bảo hộ

---

### Bước 3: Khai báo nguyên vật liệu

Khai báo các nguyên liệu cần thiết để sản xuất thành phẩm:

Ví dụ:

- Nhựa ABS
- Vải kaki
- Cao su
- Chỉ may
- Khóa kéo

---

### Bước 4: Tạo BOM / Định mức sản xuất

Khai báo định mức nguyên vật liệu cho từng thành phẩm.

Ví dụ:

```text
1 nón bảo hộ = 1.5kg nhựa + 1 dây cài + 1 khóa
```

---

### Bước 5: Tạo phiếu nhập nguyên vật liệu

#### Nhân viên mua hàng

- Đăng nhập bằng tài khoản nhân viên mua hàng
- Tạo phiếu mua nguyên vật liệu cần thiết

> Tài khoản admin hiện tại đang là chức vụ nhân viên mua hàng

---

#### Nhân viên kho nhận nguyên liệu

## 🔐 Tài khoản của nhân viên kho
| Username | Password | Vai trò |
|---|---|---|
| lekyvong | 123456 | Nhân viên kho |

Vào mục:

```text
Đơn hàng → Phiếu nhập nguyên liệu
```

Thực hiện:

- Nhận nguyên liệu
- Kiểm tra số lượng
- Kiểm tra thông tin nguyên liệu
- Đánh dấu báo lỗi nếu có sai sót
- Điền số nguyên liệu đã nhận
---

#### Chỉnh sửa phiếu nhập nguyên liệu

Nếu phiếu có sai sót:

- Nhân viên mua hàng chỉnh sửa lại thông tin
- Sau đó tiến hành nhận nguyên liệu lại

---

### Bước 6: Tính toán khả năng sản xuất

Vào mục:

```text
Tiến hành sản xuất → Khả năng sản xuất
```

Người dùng có thể:

- Chọn thành phẩm
- Xem số lượng có thể sản xuất
- Kiểm tra nguyên liệu còn thiếu

---

### Bước 7: Tạo kế hoạch sản xuất

Sau khi kiểm tra nguyên liệu:

- Lập kế hoạch sản xuất
- Chọn thành phẩm cần sản xuất
- Nhập số lượng dự kiến

---

### Lên kế hoạch sản xuất, tạo đơn hàng, đơn sản xuất và thực hiện lệnh sản xuất:
```
(Chức năng đang xây dựng và chưa được hoàn thiện)
```

---

## 📌 Chức năng cơ bản
- Quản lý nguyên vật liệu, thành phẩm, định mức nguyên vật liệu
- Quản lý nhà cung cấp, khách hàng
- Quản lý kho
- Quản lý Tổ sản xuất, nhân viên, chức vụ, máy móc
- Quản lý Xe hàng, tài xế, giao hàng
- Chức năng Thêm, Sửa, Xóa, Xuất excel, Nhập excel, Hiện thông báo, Thực hiện validation cho hầu hết các màn hình
- Toàn bộ các màn hình đều đã được thiết kế để xem được trên điện thoại

## 🗄️ Chức năng chính
- Tạo phiếu nhập nguyên liệu
- Nhận nguyên liệu
- Tính toán khả năng sản xuất
- Lập kế hoạch sản xuất
- Lệnh sản xuất
- Sản xuất theo đơn hàng
- Vận chuyển hàng hóa
---

## 🚀 Công nghệ sử dụng

### Front-end
- ReactJS
- Tailwind CSS
- Axios
- React Router

### Back-end
- ASP.NET Core Web API
- Entity Framework Core
- JWT Authentication

### Database
- SQL Server TiDB

### Storage
- Firebase Storage
---

## 👤 Tác giả

**Lê Kỳ Vọng**

Project được xây dựng nhằm phát triển hệ thống quản lý sản xuất cho nhà máy
Đây là web cá nhân, do chưa dành nhiều thời gian xây dựng nên giao diện và nghiệp vụ của web còn rất nhiều thiếu sót, mong người dùng thông cảm




