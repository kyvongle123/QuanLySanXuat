import axios from 'axios';

const API_URL = 'http://localhost:10000/api/bom';

export const getBOMs = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const createBOM = async (data) => {
    const response = await axios.post(API_URL, data);
    return response.data;
};

export const updateBOM = async (id, data) => {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
};

export const deleteBOM = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
};