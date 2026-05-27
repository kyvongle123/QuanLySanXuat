import axios from 'axios';

const API_URL = 'https://quanlysanxuat-production.up.railway.app/api/transportVehicles';

export const getTransportVehicles = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const getTransportVehicle = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const createTransportVehicle = async (data) => {
    const response = await axios.post(API_URL, data);
    return response.data;
};

export const updateTransportVehicle = async (id, data) => {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
};

export const deleteTransportVehicle = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};