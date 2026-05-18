import axios from 'axios';

const API_URL = 'http://quanlysanxuat-back-end.onrender.com/api/transportRoutes';

export const getTransportRoutes = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const createTransportRoute = async (data) => {
    const response = await axios.post(API_URL, data);
    return response.data;
};

export const updateTransportRoute = async (id, data) => {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
};

export const deleteTransportRoute = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
};