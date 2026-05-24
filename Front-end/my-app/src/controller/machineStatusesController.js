import axios from 'axios';

// Sử dụng port 49851 thống nhất với các controller khác trong dự án
const API_URL = 'https://quanlysanxuat-back-end.onrender.com//api/MachineStatuses';

export const getMachineStatuses = async () => {
    try {
        const response = await axios.get(API_URL);
        // Xử lý trường hợp API trả về đối tượng bọc trong $values (EF Core PreserveReferences)
        return response.data.$values || response.data;
    } catch (error) {
        console.error("Error fetching machine statuses:", error);
        throw error;
    }
};

export const createMachineStatus = async (data) => {
    try {
        const response = await axios.post(API_URL, data);
        return response.data;
    } catch (error) {
        console.error("Error creating machine status:", error);
        throw error;
    }
};

export const updateMachineStatus = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating machine status with ID ${id}:`, error);
        throw error;
    }
};

export const deleteMachineStatus = async (id) => {
    try {
        await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
        console.error(`Error deleting machine status with ID ${id}:`, error);
        throw error;
    }
};