import axios from 'axios';

// Sử dụng port 49851 thống nhất với các controller khác trong dự án
const API_URL = 'http://localhost:10000/api/Customers';

// Hàm chuẩn hóa dữ liệu để xử lý sự khác biệt giữa camelCase và PascalCase từ API
const normalizeCustomerData = (data) => {
    if (Array.isArray(data)) {
        return data.map(item => ({
            id: item.id || item.Id || item.ID,
            name: item.name || item.Name,
            email: item.email || item.Email,
            phone: item.phone || item.Phone,
            address: item.address || item.Address,
        }));
    }
    return {
        id: data.id || data.Id || data.ID,
        name: data.name || data.Name,
        email: data.email || data.Email, // Fixed: item.Email should be data.Email
        phone: data.phone || data.Phone,
        address: data.address || data.Address,
    };
};

export const getCustomers = async () => {
    try {
        const response = await axios.get(API_URL);
        // Xử lý trường hợp API trả về đối tượng bọc trong $values (OData/EF Core)
        return normalizeCustomerData(response.data.$values || response.data);
    } catch (error) {
        console.error("Error fetching customers:", error);
        throw error;
    }
};

export const getCustomer = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return normalizeCustomerData(response.data);
};

export const createCustomer = async (customer) => {
    const response = await axios.post(API_URL, customer);
    return normalizeCustomerData(response.data);
};

export const updateCustomer = async (id, customer) => {
    const response = await axios.put(`${API_URL}/${id}`, customer);
    return normalizeCustomerData(response.data);
};

export const deleteCustomer = async (ids) => {
    if (!Array.isArray(ids)) {
        ids = [ids]; // Đảm bảo luôn là một mảng
    }
    try {
        await Promise.all(ids.map(id => axios.delete(`${API_URL}/${id}`)));
    } catch (error) {
        console.error("Error deleting customers:", error);
        throw error;
    }
};