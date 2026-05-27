import axios from 'axios';

const API_BASE_URL = 'https://quanlysanxuat-production.up.railway.app/api';

const normalizeRoleData = (data) => {
  if (!data) return null;
  if (Array.isArray(data)) {
    return data.map(item => ({
      id: item.id || item.Id,
      roleCode: item.roleCode || item.RoleCode,
      name: item.name || item.Name,
      // Thêm các trường khác nếu roles có chúng
    }));
  }
  return {
    id: data.id || data.Id,
    roleCode: data.roleCode || data.RoleCode,
    name: data.name || data.Name,
    // Thêm các trường khác nếu roles có chúng
  };
};

export const getRoles = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/roles`);
    return normalizeRoleData(response.data.$values || response.data);
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
};

export const createRole = async (roleData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/roles`, roleData);
    return response.data;
  } catch (error) {
    console.error("Error creating role:", error);
    throw error;
  }
};

export const updateRole = async (id, roleData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/roles/${id}`, roleData);
    return response.data;
  } catch (error) {
    console.error(`Error updating role with ID ${id}:`, error);
    throw error;
  }
};

export const deleteRole = async (id) => {
  try {
    await axios.delete(`${API_BASE_URL}/roles/${id}`);
  } catch (error) {
    console.error(`Error deleting role with ID ${id}:`, error);
    throw error;
  }
};