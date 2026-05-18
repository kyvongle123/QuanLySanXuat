import axios from 'axios';

const API_URL = 'http://localhost:10000/api/ProductionOrders';

export const getProductionOrders = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching production orders:", error);
        throw error;
    }
};

export const createProductionOrder = async (data) => {
    try {
        const response = await axios.post(API_URL, data);
        return response.data;
    } catch (error) {
        console.error("Error creating production order:", error);
        throw error;
    }
};

export const updateProductionOrder = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating production order:", error);
        throw error;
    }
};

export const deleteProductionOrder = async (id) => {
    try {
        await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
        console.error("Error deleting production order:", error);
        throw error;
    }
};