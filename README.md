# QuanLySanXuat

Ứng dụng quản lý sản xuất cho nhà máy, hỗ trợ quản lý nguyên vật liệu, kho, quản lý nhập nguyên liệu, nhận đơn hàng, tạo đơn sản xuất, lập kế hoạch sản xuất, quản lý tổ sản xuất, máy móc,...

## 🌐 Truy cập website

Link demo:

```text
https://quanlysanxuat.onrender.com
```

## 🔐 Tài khoản đăng nhập demo

| Username | Password | Vai trò |
|---|---|---|
| admin | 123456 | Quản trị viên |

> Tài khoản này dùng để trải nghiệm chức năng demo của hệ thống.

## 🧭 Luồng sử dụng cơ bản

Người dùng có thể tiếp cận hệ thống theo luồng sau:
### Nhập nguyên liệu và Lên kế hoạch sản xuất:

```text
Đăng nhập
→ Tạo nhân viên và chức vụ: 
- Vào mục nhân viên, chức vụ để tạo, phải đảm bảo phải có những nhân viên với chức vụ:
+ Nhân viên mua hàng
+ Nhân viên kho
+ Trưởng ban kiểm nghiệm
+ Ủy ban kiểm nghiệm

→ Khai báo thành phẩm
→ Khai báo nguyên vật liệu cần thiết để sản xuất các thành phẩm trên
→ Tạo BOM / định mức sản xuất

→ Tạo phiếu nhập nguyên vật liệu: 
- Đăng nhập vào tài khoản Nhân viên mua hàng (tài khoản tên admin), tạo phiếu mua các nguyên vật liệu cần thiết.
- Đăng nhập vào tài khoản nhân viên kho, vào mục Đơn hàng -> Phiếu nhập nguyên liệu, chọn Nhận nguyên liệu, nếu có sai sót thông tin hoặc số nguyên liệu thì đánh dấu báo lỗi cho Phiếu nhập nguyên liệu đó.
- Nếu có Phiếu nhập nguyên liệu bị sai thông tin thì Nhân viên mua hàng vào chỉnh sửa lại thông tin

→ Tính toán khả năng sản xuất:
- Vào mục Tiến hành sản xuất -> Khả năng sản xuất, chọn các thành phẩm để xem 

→ Tạo kế hoạch sản xuất
→ Tạo lệnh sản xuất
```

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
- Chức năng Thêm, Sửa, Xóa, Xuất excel, Thực hiện validation cho tất cả menu
- Toàn bộ các màn hình đều đã được thiết kế để xem được trên điện thoại

## 🧩 Chức năng chính
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

## 👤 Tác giả

**Lê Kỳ Vọng**

Project được xây dựng nhằm phát triển hệ thống quản lý sản xuất cho nhà máy

---



