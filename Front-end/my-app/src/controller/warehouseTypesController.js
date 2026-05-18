import axios from 'axios';

const API_URL = 'http://localhost:10000/api/WarehouseTypes';

const normalizeWarehouseTypeData = (data) => {
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

export const getWarehouseTypes = async () => {
    try {
        const response = await axios.get(API_URL);
        return normalizeWarehouseTypeData(response.data.$values || response.data);
    } catch (error) {
        console.error("Error fetching warehouse types:", error);
        throw error;
    }
};

export const getWarehouseType = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return normalizeWarehouseTypeData(response.data);
    } catch (error) {
        throw error;
    }
};

export const createWarehouseType = async (data) => {
    try {
        const response = await axios.post(API_URL, data);
        return normalizeWarehouseTypeData(response.data);
    } catch (error) {
        throw error;
    }
};

export const updateWarehouseType = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, data);
        return normalizeWarehouseTypeData(response.data);
    } catch (error) {
        throw error;
    }
};

export const deleteWarehouseType = async (id) => {
    try {
        await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
        throw error;
    }
};