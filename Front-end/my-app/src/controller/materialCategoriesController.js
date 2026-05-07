import axios from 'axios';

const API_URL = 'https://localhost:49851/api/materialcategories';

export const getMaterialCategories = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching material categories:", error);
        throw error;
    }
};

export const createMaterialCategory = async (category) => {
    try {
        const response = await axios.post(API_URL, category);
        return response.data;
    } catch (error) {
        console.error("Error creating material category:", error);
        throw error;
    }
};

export const updateMaterialCategory = async (id, category) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, category);
        return response.data;
    } catch (error) {
        console.error("Error updating material category:", error);
        throw error;
    }
};

export const deleteMaterialCategory = async (id) => {
    try {
        await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
        console.error("Error deleting material category:", error);
        throw error;
    }
};