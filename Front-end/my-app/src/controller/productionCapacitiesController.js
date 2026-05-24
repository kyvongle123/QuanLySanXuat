import axios from 'axios';

const API_URL = 'https://quanlysanxuat-back-end.onrender.com/api/productioncapacities';

export const getProductionCapacities = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const createProductionCapacity = async (data) => {
    const response = await axios.post(API_URL, data);
    return response.data;
};

export const updateProductionCapacity = async (id, data) => {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
};

export const deleteProductionCapacity = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
};