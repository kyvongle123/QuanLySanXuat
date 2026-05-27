import axios from 'axios';

const API_URL = 'https://quanlysanxuat-production.up.railway.app/api/Auth';

export const login = async (credentials) => {
    try {
        const response = await axios.post(`${API_URL}/login`, credentials);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Lỗi kết nối máy chủ" };
    }
};