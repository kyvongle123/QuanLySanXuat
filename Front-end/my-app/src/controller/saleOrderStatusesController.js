const API_URL = 'http://localhost:5000/api/SaleOrderStatuses';

export const getSaleOrderStatuses = async () => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Không thể tải danh sách trạng thái');
    return await response.json();
};