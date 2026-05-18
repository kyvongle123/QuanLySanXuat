import axios from 'axios';

// Sử dụng port 49851 thống nhất với các controller khác trong dự án
const API_URL = 'http://localhost:10000/api/Machines';

export const getMachines = async () => {
    try {
        const response = await axios.get(API_URL);
        // Xử lý trường hợp API trả về đối tượng bọc trong $values (thường gặp khi dùng EF Core PreserveReferences)
        return response.data.$values || response.data;
    } catch (error) {
        console.error("Error fetching machines:", error);
        throw error;
    }
};

export const getMachine = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching machine with ID ${id}:`, error);
        throw error;
    }
};

export const createMachine = async (machineData) => {
    try {
        const response = await axios.post(API_URL, machineData);
        return response.data;
    } catch (error) {
        console.error("Error creating machine:", error);
        throw error;
    }
};

export const updateMachine = async (id, machineData) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, machineData);
        return response.data;
    } catch (error) {
        console.error(`Error updating machine with ID ${id}:`, error);
        throw error;
    }
};

export const deleteMachine = async (id) => {
    try {
        await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
        console.error(`Error deleting machine with ID ${id}:`, error);
        throw error;
    }
};