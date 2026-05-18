import axios from 'axios';

const API_URL = 'https://quanlysanxuat-back-end.onrender.com/api/materials';

export const getMaterials = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching materials:", error);
        throw error;
    }
};

export const createMaterial = async (data) => {
    try {
        const response = await axios.post(API_URL, data);
        return response.data;
    } catch (error) {
        console.error("Error creating material:", error);
        throw error;
    }
};

export const updateMaterial = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating material:", error);
        throw error;
    }
};

export const deleteMaterial = async (id) => {
    try {
        await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
        console.error("Error deleting material:", error);
        throw error;
    }
};