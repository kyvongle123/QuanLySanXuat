import axios from 'axios';

const API_URL = 'https://quanlysanxuat-back-end.onrender.com/api/drivers';

export const getDrivers = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const getDriver = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const createDriver = async (driverData) => {
    const response = await axios.post(API_URL, driverData);
    return response.data;
};

export const updateDriver = async (id, driverData) => {
    const response = await axios.put(`${API_URL}/${id}`, driverData);
    return response.data;
};

export const deleteDriver = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};