import axios from 'axios';

// Sử dụng port 49851 thống nhất với các controller khác trong dự án
const API_URL = 'http://quanlysanxuat-back-end.onrender.com/api/MachineTypes';

export const getMachineTypes = async () => {
    try {
        const response = await axios.get(API_URL);
        // Xử lý trường hợp API trả về đối tượng bọc trong $values (EF Core PreserveReferences)
        return response.data.$values || response.data;
    } catch (error) {
        console.error("Error fetching machine types:", error);
        throw error;
    }
};

export const createMachineType = async (data) => {
    try {
        const response = await axios.post(API_URL, data);
        return response.data;
    } catch (error) {
        console.error("Error creating machine type:", error);
        throw error;
    }
};

export const updateMachineType = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating machine type with ID ${id}:`, error);
        throw error;
    }
};

export const deleteMachineType = async (id) => {
    try {
        await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
        console.error(`Error deleting machine type with ID ${id}:`, error);
        throw error;
    }
};