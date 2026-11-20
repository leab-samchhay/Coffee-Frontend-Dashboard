import api from './api';

export const TranSactionCoffee = {
    Create: async (data) => {
        try {
            const res = await api.post("/transaction-coffee", data,{
                headers: {
                    'Content-Type':'multipart/form-data',
                },
            });
            return res.data.data || null;
        } catch (error) {
            throw error;
        }
    }
};
