import axios from 'axios';

// Định nghĩa URL cơ sở cho API của bạn
// Đảm bảo rằng endpoint này khớp với tên controller của bạn ở Back-end (ví dụ: ProductionPlanItemsController)
const API_URL = 'https://quanlysanxuat-production.up.railway.app/api/ProductionPlanItems';

/**
 * Lấy tất cả các mục chi tiết kế hoạch sản xuất, hoặc lọc theo productionPlanId nếu được cung cấp.
 * @param {number} productionPlanId - (Tùy chọn) ID của kế hoạch sản xuất để lọc các mục chi tiết.
 */
export const getProductionPlanItems = async (productionPlanId = null) => {
    try {
        // Thay đổi từ ?productionPlanId= sang /plan/
        const url = productionPlanId ? `${API_URL}/plan/${productionPlanId}` : API_URL;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error("Error fetching production plan items:", error);
        throw error;
    }
};

/**
 * Lấy một mục chi tiết kế hoạch sản xuất theo ID.
 */
export const getProductionPlanItem = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching production plan item with ID ${id}:`, error);
        throw error;
    }
};

/**
 * Tạo một mục chi tiết kế hoạch sản xuất mới.
 */
export const createProductionPlanItem = async (itemData) => {
    try {
        const response = await axios.post(API_URL, itemData);
        return response.data;
    } catch (error) {
        console.error("Error creating production plan item:", error);
        throw error;
    }
};

/**
 * Cập nhật một mục chi tiết kế hoạch sản xuất hiện có.
 */
export const updateProductionPlanItem = async (id, itemData) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, itemData);
        return response.data;
    } catch (error) {
        console.error(`Error updating production plan item with ID ${id}:`, error);
        throw error;
    }
};

/**
 * Xóa một mục chi tiết kế hoạch sản xuất theo ID.
 */
export const deleteProductionPlanItem = async (id) => {
    try {
        await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
        console.error(`Error deleting production plan item with ID ${id}:`, error);
        throw error;
    }
};