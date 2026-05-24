import axios from 'axios';

const API_URL = 'https://quanlysanxuat-back-end.onrender.com//api/WarehouseLocations'; // Đảm bảo URL này khớp với địa chỉ API của bạn

const normalizeData = (data) => {
    if (Array.isArray(data)) {
        return data.map(item => ({
            id: item.id || item.ID,
            locationCode: item.locationCode || item.LocationCode,
            bin: item.bin || item.Bin,
            // racks is an ID, not an object, so keep it as is
            racks: item.racks || item.Racks,
            level: item.level || item.Level,
            // Thêm các trường khác nếu có, xử lý cả camelCase và PascalCase
        }));
    }
    return {
        id: data.id || data.ID,
        locationCode: data.locationCode || data.LocationCode,
        bin: data.bin || data.Bin,
        // racks is an ID, not an object, so keep it as is
        racks: data.racks || data.Racks,
        level: data.level || data.Level,
        // Thêm các trường khác nếu có
    };
};

export const getWarehouseLocations = async () => {
    try {
        const response = await axios.get(API_URL);
        return normalizeData(response.data.$values || response.data);
    } catch (error) {
        console.error("Error fetching warehouse locations:", error);
        throw error;
    }
};

export const getWarehouseLocation = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return normalizeData(response.data);
    } catch (error) {
        console.error(`Error fetching warehouse location with ID ${id}:`, error);
        throw error;
    }
};

export const createWarehouseLocation = async (locationData) => { // Changed to export
    try {
        const response = await axios.post(API_URL, locationData);
        return normalizeData(response.data);
    } catch (error) {
        console.error("Error creating warehouse location:", error);
        throw error;
    }
};

export const updateWarehouseLocation = async (id, locationData) => { // Changed to export
    try {
        const response = await axios.put(`${API_URL}/${id}`, locationData);
        return normalizeData(response.data);
    } catch (error) {
        console.error(`Error updating warehouse location with ID ${id}:`, error);
        throw error;
    }
};

export const deleteWarehouseLocation = async (ids) => {
    if (!Array.isArray(ids)) {
        ids = [ids]; // Ensure it's always an array
    }
    try {
        await Promise.all(ids.map(id => axios.delete(`${API_URL}/${id}`)));
    } catch (error) {
        console.error("Error deleting warehouse locations:", error);
        throw error;
    }
};
