import axios from 'axios';

// Định nghĩa URL cơ sở cho API của bạn
// Bạn có thể thay thế bằng process.env.REACT_APP_API_BASE_URL nếu bạn cấu hình biến môi trường
const API_BASE_URL = 'https://quanlysanxuat-production.up.railway.app/api';

export const getItems = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/items`);
    return response.data;
  } catch (error) {
    console.error("Error fetching items:", error);
    throw error;
  }
};

export const getItem = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/items/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching item with ID ${id}:`, error);
    throw error;
  }
};

export const createItem = async (itemData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/items`, itemData);
    if (!response) throw new Error("Error creating item");
    return response.data;
  } catch (error) {
    console.error("Error creating item:", error);
    throw error;
  }
};

export const updateItem = async (id, itemData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/items/${id}`, itemData);
    return response.data;
  } catch (error) {
    console.error(`Error updating item with ID ${id}:`, error);
    throw error;
  }
};

export const deleteItem = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/items/${id}`);
    return response.data; // Thường trả về 204 No Content, nên data có thể rỗng
  } catch (error) {
    console.error(`Error deleting item with ID ${id}:`, error);
    throw error;
  }
};