import axios from 'axios';

// Sử dụng port 49851 thống nhất với các controller khác trong dự án
const API_URL = 'https://quanlysanxuat-back-end.onrender.com/api/MaterialReceipts';

// Hàm chuẩn hóa dữ liệu để xử lý sự khác biệt giữa camelCase và PascalCase từ API
const normalizeReceiptData = (data) => {
    if (!data) return null;
    if (Array.isArray(data)) {
        return data.map(item => ({
            id: item.id || item.Id || item.ID,
            materialReceiptCode: item.materialReceiptCode || item.MaterialReceiptCode,
            deliveryNoteNumber: item.deliveryNoteNumber || item.DeliveryNoteNumber,
            receivingDate: item.receivingDate || item.ReceivingDate,
            expiredDate: item.expiredDate || item.ExpiredDate,
            qualityStatus: item.qualityStatus || item.QualityStatus,
            warehouse: item.warehouse || item.Warehouse,
            supplier: item.supplier || item.Supplier,
            specialStorageCondition: item.specialStorageCondition || item.SpecialStorageCondition,
            inspectationReport: item.inspectationReport || item.InspectationReport,
            receiver: item.receiver || item.Receiver,
            certificateOfOrigin: item.certificateOfOrigin || item.CertificateOfOrigin,
            certificateOfQuality: item.certificateOfQuality || item.CertificateOfQuality,
            createdAt: item.createdAt || item.CreatedAt,
            updatedAt: item.updatedAt || item.UpdatedAt,
            createdBy: item.createdBy || item.CreatedBy,
            materialReceiptBatchList: (item.materialReceiptBatchList || item.MaterialReceiptBatchList || []).map(batch => ({
                materialId: batch.materialId || batch.MaterialId,
                shippedQuantity: batch.shippedQuantity || batch.ShippedQuantity,
                deliveredQuantity: batch.deliveredQuantity || batch.DeliveredQuantity,
                batchCode: batch.batchCode || batch.BatchCode,
                mfgDate: batch.mfgDate || batch.MFGDate || batch.mfgdate,
                expiredDate: batch.expiredDate || batch.ExpiredDate || batch.expireddate
            })),
            inspectorPanel: item.inspectorPanel || item.InspectorPanel || []
        }));
    }
    return {
        id: data.id || data.Id || data.ID,
        materialReceiptCode: data.materialReceiptCode || data.MaterialReceiptCode,
        deliveryNoteNumber: data.deliveryNoteNumber || data.DeliveryNoteNumber,
        receivingDate: data.receivingDate || data.ReceivingDate,
        expiredDate: data.expiredDate || data.ExpiredDate,
        qualityStatus: data.qualityStatus || data.QualityStatus,
        warehouse: data.warehouse || data.Warehouse,
        supplier: data.supplier || data.Supplier,
        specialStorageCondition: data.specialStorageCondition || data.SpecialStorageCondition,
        inspectationReport: data.inspectationReport || data.InspectationReport,
        receiver: data.receiver || data.Receiver,
        certificateOfOrigin: data.certificateOfOrigin || data.CertificateOfOrigin,
        certificateOfQuality: data.certificateOfQuality || data.CertificateOfQuality,
        createdAt: data.createdAt || data.CreatedAt,
        updatedAt: data.updatedAt || data.UpdatedAt,
        createdBy: data.createdBy || data.CreatedBy,
        materialReceiptBatchList: (data.materialReceiptBatchList || data.MaterialReceiptBatchList || []).map(batch => ({
            materialId: batch.materialId || batch.MaterialId,
            shippedQuantity: batch.shippedQuantity || batch.ShippedQuantity,
            deliveredQuantity: batch.deliveredQuantity || batch.DeliveredQuantity,
            batchCode: batch.batchCode || batch.BatchCode,
            mfgDate: batch.mfgDate || batch.MFGDate || batch.mfgdate,
            expiredDate: batch.expiredDate || batch.ExpiredDate || batch.expireddate
        })),
        inspectorPanel: data.inspectorPanel || data.InspectorPanel || []
    };
};

export const getMaterialReceipts = async () => {
    try {
        const response = await axios.get(API_URL);
        // Xử lý trường hợp API trả về đối tượng bọc trong $values (thường gặp khi dùng EF Core với PreserveReferences)
        const data = response.data.$values || response.data;
        return normalizeReceiptData(data);
    } catch (error) {
        console.error("Error fetching material receipts:", error);
        throw error;
    }
};

export const getMaterialReceipt = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return normalizeReceiptData(response.data);
};

const createFormData = (receipt) => {
    const formData = new FormData();
    Object.keys(receipt).forEach(key => {
        const value = receipt[key];
        if (key === 'materialReceiptBatchList' && Array.isArray(value)) {
            value.forEach((item, index) => {
                Object.keys(item).forEach(itemKey => {
                    if (item[itemKey] !== null && item[itemKey] !== undefined) {
                        formData.append(`MaterialReceiptBatchList[${index}].${itemKey}`, item[itemKey]);
                    }
                });
            });
        } else if (Array.isArray(value)) {
            // Xử lý các mảng giá trị đơn giản (như InspectorPanel) cho FromForm
            value.forEach(item => {
                formData.append(key, item);
            });
        } else if (value instanceof File) {
            // Tên key này phải khớp với thuộc tính kiểu IFormFile trong DTO ở Back-end
            formData.append(`${key}File`, value);
        } else if (value !== null && value !== undefined) {
            formData.append(key, value);
        }
    });
    return formData;
};

export const createMaterialReceipt = async (receipt) => {
    try {
        const formData = createFormData(receipt);
        const response = await axios.post(API_URL, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (!response)
            throw "có lỗi xảy ra khi đang tạo phiếu nhập nguyên liệu";
        return normalizeReceiptData(response.data);
    }
    catch (e) {
        console.error("Error creating material receipt:", e);
        throw e; // Re-throw the error
    }

};

export const updateMaterialReceipt = async (id, receipt) => {
    try {
        const formData = createFormData(receipt);
        console.log("receipt la", receipt);
        const response = await axios.put(`${API_URL}/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (!response)
            throw "có lỗi xảy ra khi đang cập nhật phiếu nhập nguyên liệu"
        console.log("response la", response);
        return normalizeReceiptData(response.data);
    }
    catch (e) {
        console.error(`Error updating material receipt ${id}:`, e);
        throw e; // Re-throw the error
    }

};

export const deleteMaterialReceipt = async (id) => {
    try {
        await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
        console.error(`Error deleting material receipt ${id}:`, error);
        throw error;
    }
};

export const exportInspectionReport = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}/export-inspection-report`, {
            responseType: 'blob', // Quan trọng để nhận dữ liệu tệp nhị phân
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Bien_ban_kiem_nghiem_${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        console.error(`Error exporting inspection report ${id}:`, error);
        throw error;
    }
};