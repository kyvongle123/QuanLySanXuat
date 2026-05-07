import axios from 'axios';

// Định nghĩa URL cơ sở cho API của bạn
// Bạn có thể thay thế bằng process.env.REACT_APP_API_BASE_URL nếu bạn cấu hình biến môi trường
const API_BASE_URL = 'https://localhost:49851/api'; 

export const getUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`);
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
};

export const getUser = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      throw error;
    }
};

export const createUser = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/users`, userData);
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
};

export const updateUser = async (id, userData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }
};

export const deleteUser = async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/users/${id}`);
      return response.data; // Thường trả về 204 No Content, nên data có thể rỗng
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      throw error;
    }
};
