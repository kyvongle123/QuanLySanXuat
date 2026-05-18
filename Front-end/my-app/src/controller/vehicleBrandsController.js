import axios from 'axios';

const API_URL = 'http://quanlysanxuat-back-end.onrender.com/api/vehicleBrands';

export const getVehicleBrands = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching vehicle brands:", error);
        throw error;
    }
};