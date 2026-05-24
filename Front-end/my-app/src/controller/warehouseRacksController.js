import axios from 'axios';

const API_URL = 'https://quanlysanxuat-back-end.onrender.com/api/WarehouseRacks';

const normalizeRackData = (data) => {
    if (Array.isArray(data)) {
        return data.map(item => ({
            id: item.id || item.ID,
            name: item.name || item.Name,
        }));
    }
    return {
        id: data.id || data.ID,
        name: data.name || data.Name,
    };
};

export const getWarehouseRacks = async () => {
    try {
        const response = await axios.get(API_URL);
        return normalizeRackData(response.data?.$values || response.data || []);
    } catch (error) {
        throw error;
    }
};

export const getWarehouseRack = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return normalizeRackData(response.data);
    } catch (error) {
        console.error(`Error fetching warehouse rack with ID ${id}:`, error);
        throw error;
    }
};

export const createWarehouseRack = async (data) => {
    try {
        const response = await axios.post(API_URL, data);
        return normalizeRackData(response.data);
    } catch (error) {
        console.error("Error creating warehouse rack:", error);
        throw error;
    }
};

export const updateWarehouseRack = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, data);
        return normalizeRackData(response.data);
    } catch (error) {
        console.error(`Error updating warehouse rack with ID ${id}:`, error);
        throw error;
    }
};

export const deleteWarehouseRack = async (id) => axios.delete(`${API_URL}/${id}`);