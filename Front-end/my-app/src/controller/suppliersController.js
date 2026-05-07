import axios from 'axios';

const API_URL = 'https://localhost:49851/api/Suppliers'; // Thay đổi port nếu cần thiết và đảm bảo khớp với Back-end

// Hàm chuẩn hóa dữ liệu để đảm bảo nhất quán giữa camelCase và PascalCase từ Back-end
const normalizeSupplierData = (data) => {
    if (Array.isArray(data)) {
        return data.map(item => ({
            id: item.id || item.Id,
            name: item.name || item.Name,
            contactPerson: item.contactPerson || item.ContactPerson,
            phone: item.phone || item.Phone,
            email: item.email || item.Email,
            address: item.address || item.Address,
            taxId: item.taxId || item.TaxId,
            website: item.website || item.Website,
            notes: item.notes || item.Notes,
        }));
    }
    return {
        id: data.id || data.Id,
        name: data.name || data.Name,
        contactPerson: data.contactPerson || data.ContactPerson,
        phone: data.phone || data.Phone,
        email: data.email || data.Email,
        address: data.address || data.Address,
        taxId: data.taxId || data.TaxId,
        website: data.website || data.Website,
        notes: data.notes || data.Notes,
    };
};

export const getSuppliers = async () => {
    const response = await axios.get(API_URL);
    return normalizeSupplierData(response.data.$values || response.data);
};

export const getSupplier = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return normalizeSupplierData(response.data);
};

export const createSupplier = async (supplier) => axios.post(API_URL, supplier);

export const updateSupplier = async (id, supplier) => axios.put(`${API_URL}/${id}`, supplier);

export const deleteSupplier = async (id) => axios.delete(`${API_URL}/${id}`);