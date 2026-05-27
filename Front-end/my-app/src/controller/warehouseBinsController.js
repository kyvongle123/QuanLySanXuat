import axios from 'axios';

const API_URL = 'https://quanlysanxuat-production.up.railway.app/api/WarehouseBins';

const normalizeBinData = (data) => {
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

export const getWarehouseBins = async () => {
    try {
        const response = await axios.get(API_URL);
        return normalizeBinData(response.data?.$values || response.data || []);
    } catch (error) {
        throw error;
    }
};

export const getWarehouseBin = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return normalizeBinData(response.data);
    } catch (error) {
        console.error(`Error fetching warehouse bin with ID ${id}:`, error);
        throw error;
    }
};

export const createWarehouseBin = async (data) => {
    try {
        const response = await axios.post(API_URL, data);
        return normalizeBinData(response.data);
    } catch (error) {
        console.error("Error creating warehouse bin:", error);
        throw error;
    }
};

export const updateWarehouseBin = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, data);
        return normalizeBinData(response.data);
    } catch (error) {
        console.error(`Error updating warehouse bin with ID ${id}:`, error);
        throw error;
    }
};

export const deleteWarehouseBin = async (id) => axios.delete(`${API_URL}/${id}`);