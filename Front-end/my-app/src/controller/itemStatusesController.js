import axios from 'axios';

const API_URL = 'https://quanlysanxuat-back-end.onrender.com/api/itemStatuses'; // Đã đồng bộ port với các controller khác

export const getItemStatuses = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const createItemStatus = async (statusData) => {
    const response = await axios.post(API_URL, statusData);
    return response.data;
};

export const updateItemStatus = async (id, statusData) => {
    const response = await axios.put(`${API_URL}/${id}`, statusData);
    return response.data;
};

export const deleteItemStatus = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};