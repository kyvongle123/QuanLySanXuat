import axios from 'axios';

const API_URL = 'https://quanlysanxuat-production.up.railway.app/api/Warehouses';

const normalizeWarehouseData = (data) => {
    if (!data) return null;
    if (Array.isArray(data)) {
        return data.map(item => ({
            id: item.id || item.Id,
            name: item.name || item.Name,
            warehouseCode: item.warehouseCode || item.WarehouseCode,
            type: item.type || item.Type,
            status: item.status || item.Status,
            location: item.location || item.Location,
            available: item.available || item.Available || 0,
            // Thêm các trường khác nếu có
        }));
    }
    return {
        id: data.id || data.Id,
        name: data.name || data.Name,
        warehouseCode: data.warehouseCode || data.WarehouseCode,
        type: data.type || data.Type,
        status: data.status || data.Status,
        location: data.location || data.Location,
        available: data.available || data.Available || 0,
        // Thêm các trường khác nếu có
    };
};

export const getWarehouses = async () => {
    try {
        const response = await axios.get(API_URL);
        // Normalize data for consistency
        return normalizeWarehouseData(response.data.$values || response.data);
    } catch (error) {
        console.error("Error fetching warehouses:", error);
        throw error;
    }
};

export const createWarehouse = async (data) => {
    try {
        const response = await axios.post(API_URL, data);
        return normalizeWarehouseData(response.data);
    } catch (error) {
        console.error("Error creating warehouse:", error);
        throw error;
    }
};

export const getWarehouse = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return normalizeWarehouseData(response.data);
    } catch (error) {
        console.error(`Error fetching warehouse with ID ${id}:`, error);
        throw error;
    }
};

export const updateWarehouse = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, data);
        return normalizeWarehouseData(response.data);
    } catch (error) {
        console.error("Error updating warehouse:", error);
        throw error;
    }
};

export const deleteWarehouse = async (id) => {
    // If id is an array, perform bulk delete
    if (Array.isArray(id)) {
        try {
            await Promise.all(id.map(singleId => axios.delete(`${API_URL}/${singleId}`)));
        } catch (error) {
            console.error("Error deleting multiple warehouses:", error);
            throw error;
        }
    } else {
        try {
            await axios.delete(`${API_URL}/${id}`);
        } catch (error) {
            console.error("Error deleting warehouse:", error);
            throw error;
        }
    }
};