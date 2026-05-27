import axios from 'axios';

const API_URL_PLANS = 'https://quanlysanxuat-production.up.railway.app/api/ProductionPlans';
const API_URL_PLAN_ITEMS = 'https://quanlysanxuat-production.up.railway.app/api/ProductionPlanItems'; // Giả định có một Controller riêng cho ProductionPlanItems

const normalizePlanData = (data) => {
    if (Array.isArray(data)) {
        return data.map(item => ({
            id: item.id || item.Id,
            planCode: item.planCode || item.PlanCode,
            startDate: item.startDate || item.StartDate,
            endDate: item.endDate || item.EndDate,
            status: item.status || item.Status,
            warehouse: item.warehouse || item.Warehouse,
            note: item.note || item.Note,
            // Thêm các trường khác nếu có
        }));
    }
    return {
        id: data.id || data.Id,
        planCode: data.planCode || data.PlanCode,
        startDate: data.startDate || data.StartDate,
        endDate: data.endDate || data.EndDate,
        status: data.status || data.Status,
        warehouse: data.warehouse || data.Warehouse,
        note: data.note || data.Note,
        // Thêm các trường khác nếu có
    };
};

const normalizePlanItemData = (data) => {
    if (Array.isArray(data)) {
        return data.map(item => ({
            id: item.id || item.Id,
            productionPlan: item.productionPlan || item.ProductionPlan,
            item: item.item || item.Item,
            quantity: item.quantity || item.Quantity,
            // Thêm các trường khác nếu có
        }));
    }
    return {
        id: data.id || data.Id,
        productionPlan: data.productionPlan || data.ProductionPlan,
        item: data.item || data.Item,
        quantity: data.quantity || data.Quantity,
        // Thêm các trường khác nếu có
    };
};

// Production Plans
export const getProductionPlans = async () => {
    try {
        const response = await axios.get(API_URL_PLANS);
        return normalizePlanData(response.data.$values || response.data);
    } catch (error) {
        console.error("Error fetching production plans:", error);
        throw error;
    }
};
export const createProductionPlan = async (plan) => axios.post(API_URL_PLANS, plan);
export const updateProductionPlan = async (id, plan) => axios.put(`${API_URL_PLANS}/${id}`, plan);
export const deleteProductionPlan = async (id) => axios.delete(`${API_URL_PLANS}/${id}`);

// Production Plan Items (Giả định có một ProductionPlanItemsController riêng ở Backend)
export const getProductionPlanItems = async (planId) => {
    try {
        // Giả định endpoint để lấy các item của một kế hoạch cụ thể
        const response = await axios.get(`${API_URL_PLAN_ITEMS}?productionPlanId=${planId}`);
        return normalizePlanItemData(response.data.$values || response.data);
    } catch (error) {
        console.error(`Error fetching production plan items for plan ID ${planId}:`, error);
        throw error;
    }
};
export const createProductionPlanItem = async (item) => axios.post(API_URL_PLAN_ITEMS, item);
export const updateProductionPlanItem = async (id, item) => axios.put(`${API_URL_PLAN_ITEMS}/${id}`, item);
export const deleteProductionPlanItem = async (id) => axios.delete(`${API_URL_PLAN_ITEMS}/${id}`);