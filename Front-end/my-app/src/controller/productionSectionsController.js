import axios from 'axios';

const API_URL = 'https://localhost:49851/api/ProductionSections';

export const getProductionSections = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching production sections:", error);
        throw error;
    }
};

export const getProductionSection = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching production section with ID ${id}:`, error);
        throw error;
    }
};

export const createProductionSection = async (data) => {
    try {
        const response = await axios.post(API_URL, data);
        return response.data;
    } catch (error) {
        console.error("Error creating production section:", error);
        throw error;
    }
};

export const updateProductionSection = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating production section:", error);
        throw error;
    }
};

export const deleteProductionSection = async (id) => {
    try {
        await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
        console.error("Error deleting production section:", error);
        throw error;
    }
};