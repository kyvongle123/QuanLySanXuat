import axios from 'axios';

const API_BASE_URL = 'http://localhost:10000/api';

const normalizeStatusData = (data) => {
  if (!data) return null;
  if (Array.isArray(data)) {
    return data.map(item => ({
      id: item.id || item.Id || item.ID,
      name: item.name || item.Name,
    }));
  }
  return {
    id: data.id || data.Id || data.ID,
    name: data.name || data.Name,
  };
};

export const getStatuses = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/statuses`);
    return normalizeStatusData(response.data.$values || response.data);
  } catch (error) {
    console.error("Error fetching statuses:", error);
    throw error;
  }
};

export const createStatus = async (statusData) => {
  const response = await axios.post(`${API_BASE_URL}/statuses`, statusData);
  return response.data;
};

export const updateStatus = async (id, statusData) => {
  const response = await axios.put(`${API_BASE_URL}/statuses/${id}`, statusData);
  return response.data;
};

export const deleteStatus = async (id) => {
  await axios.delete(`${API_BASE_URL}/statuses/${id}`);
};