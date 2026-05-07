import axios from 'axios';

const API_URL = 'https://localhost:49851/api/WarehouseStatuses';

const normalizeWarehouseStatusData = (data) => {
    if (!data) return null;
    if (Array.isArray(data)) {
        return data.map(item => ({
            id: item.id || item.ID,
            name: item.name || item.Name,
            // Thêm các trường khác nếu có
        }));
    }
    return {
        id: data.id || data.ID,
        name: data.name || data.Name,
        // Thêm các trường khác nếu có
    };
};

export const getWarehouseStatuses = async () => {
    try {
        const response = await axios.get(API_URL);
        return normalizeWarehouseStatusData(response.data.$values || response.data);
    } catch (error) {
        console.error("Error fetching warehouse statuses:", error);
        throw error;
    }
};

export const getWarehouseStatus = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return normalizeWarehouseStatusData(response.data);
    } catch (error) {
        console.error("Error fetching warehouse statuses:", error);
        throw error;
    }
};

export const createWarehouseStatus = async (data) => {
    try {
        const response = await axios.post(API_URL, data);
        return normalizeWarehouseStatusData(response.data);
    } catch (error) {
        console.error("Error creating warehouse status:", error);
        throw error;
    }
};

export const updateWarehouseStatus = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, data);
        return normalizeWarehouseStatusData(response.data);
    } catch (error) {
        console.error("Error updating warehouse status:", error);
        throw error;
    }
};

export const deleteWarehouseStatus = async (id) => {
    try {
        await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
        console.error("Error deleting warehouse status:", error);
        throw error;
    }
};