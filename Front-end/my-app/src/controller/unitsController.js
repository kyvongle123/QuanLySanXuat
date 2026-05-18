import axios from 'axios';

const API_URL = 'http://quanlysanxuat-back-end.onrender.com/api/Units'; // Đảm bảo URL này khớp với địa chỉ API của bạn

const normalizeData = (data) => {
    if (Array.isArray(data)) {
        return data.map(item => ({
            id: item.id || item.ID,
            name: item.name || item.Name,
            // Thêm các trường khác nếu có, xử lý cả camelCase và PascalCase
        }));
    }
    return {
        id: data.id || data.ID,
        name: data.name || data.Name,
        // Thêm các trường khác nếu có
    };
};

export const getUnits = async () => {
    try {
        const response = await axios.get(API_URL);
        return normalizeData(response.data.$values || response.data);
    } catch (error) {
        console.error("Error fetching units:", error);
        throw error;
    }
};

export const createUnit = async (unitData) => {
    try {
        const response = await axios.post(API_URL, unitData);
        return normalizeData(response.data);
    } catch (error) {
        console.error("Error creating unit:", error);
        throw error;
    }
};

export const updateUnit = async (id, unitData) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, unitData);
        return normalizeData(response.data);
    } catch (error) {
        console.error(`Error updating unit with ID ${id}:`, error);
        throw error;
    }
};

export const deleteUnit = async (id) => {
    try {
        await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
        console.error(`Error deleting unit with ID ${id}:`, error);
        throw error;
    }
};