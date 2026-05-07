import axios from 'axios';

const API_URL = 'https://localhost:49851/api/Stages';

const normalizeStageData = (data) => {
    if (Array.isArray(data)) {
        return data.map(item => ({
            id: item.id || item.Id || item.ID,
            name: item.name || item.Name,
            stageCode: item.stageCode || item.StageCode,
            sequence: item.sequence || item.Sequence,
            productionSection: item.productionSection || item.ProductionSection
        }));
    }
    return {
        id: data.id || data.Id || data.ID,
        name: data.name || data.Name,
        stageCode: data.stageCode || data.StageCode,
        sequence: data.sequence || data.Sequence,
        productionSection: data.productionSection || data.ProductionSection
    };
};

export const getStages = async () => {
    try {
        const response = await axios.get(API_URL);
        // Xử lý trường hợp API trả về đối tượng bọc trong $values (thường thấy khi dùng EF Core PreserveReferences)
        return normalizeStageData(response.data.$values || response.data);
    } catch (error) {
        console.error("Error fetching stages:", error);
        throw error;
    }
};

export const createStage = async (stage) => {
    const response = await axios.post(API_URL, stage);
    return normalizeStageData(response.data);
};

export const updateStage = async (id, stage) => {
    const response = await axios.put(`${API_URL}/${id}`, stage);
    return normalizeStageData(response.data);
};

export const deleteStage = async (id) => {
    return await axios.delete(`${API_URL}/${id}`);
};