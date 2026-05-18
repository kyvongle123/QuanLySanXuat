import axios from 'axios';

const API_URL = 'http://quanlysanxuat-back-end.onrender.com/api/ProductionOrderStatuses'; // Giả định tên Controller là ProductionOrderStatuses

const normalizeData = (data) => {
    if (Array.isArray(data)) {
        return data.map(item => ({
            id: item.id || item.Id,
            name: item.name || item.Name,
            // Thêm các trường khác nếu có
        }));
    }
    return {
        id: data.id || data.Id,
        name: data.name || data.Name,
        // Thêm các trường khác nếu có
    };
};

export const getProductionOrderStatuses = async () => {
    try {
        const response = await axios.get(API_URL);
        return normalizeData(response.data.$values || response.data);
    } catch (error) {
        console.error("Error fetching production order statuses:", error);
        throw error;
    }
};

export const getProductionOrderStatus = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return normalizeData(response.data);
    } catch (error) {
        console.error(`Error fetching production order status with ID ${id}:`, error);
        throw error;
    }
};

export const createProductionOrderStatus = async (status) => axios.post(API_URL, status);
export const updateProductionOrderStatus = async (id, status) => axios.put(`${API_URL}/${id}`, status);
export const deleteProductionOrderStatus = async (id) => axios.delete(`${API_URL}/${id}`);