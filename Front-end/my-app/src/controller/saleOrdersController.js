const API_URL = 'http://localhost:5000/api/SaleOrders'; // Thay đổi port nếu cần thiết

export const getSaleOrders = async () => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Không thể tải danh sách đơn hàng');
    return await response.json();
};

export const getSaleOrder = async (id) => {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('Không tìm thấy đơn hàng');
    return await response.json();
};

export const createSaleOrder = async (order) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi khi tạo đơn hàng');
    }
    return await response.json();
};

export const updateSaleOrder = async (id, order) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
    });
    if (!response.ok) {
        if (response.status === 400) throw new Error('Dữ liệu không hợp lệ');
        throw new Error('Lỗi khi cập nhật đơn hàng');
    }
    // PUT thường trả về 204 No Content hoặc đối tượng đã sửa
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) return await response.json();
    return order;
};

export const deleteSaleOrder = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Lỗi khi xóa đơn hàng');
    return true;
};