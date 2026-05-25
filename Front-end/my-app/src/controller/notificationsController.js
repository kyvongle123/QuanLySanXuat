import axios from 'axios';

const API_URL = 'https://quanlysanxuat-back-end.onrender.com/api/Notifications';

export const getNotifications = async (username) => {
    const response = await axios.get(`${API_URL}/receiver/${username}`);
    // Xử lý trường hợp trả về $values từ EF Core
    return response.data.$values || response.data;
};

export const getUnreadCount = async (username) => {
    const response = await axios.get(`${API_URL}/unread-count/${username}`);
    return response.data;
};

export const createNotification = async (notification) => {
    const response = await axios.post(API_URL, notification);
    return response.data;
};

export const markAsRead = async (id) => {
    await axios.put(`${API_URL}/mark-read/${id}`);
};

export const deleteNotification = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
};