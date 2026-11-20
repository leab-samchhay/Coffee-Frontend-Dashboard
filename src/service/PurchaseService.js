import api from './api';

export const PurchaseService = {
    getAll: async (page = 1, perPage = 10, search = "") => {
        try {
            let params = {};
            if (typeof page === 'object' && page !== null) {
                params = {
                    page: page.page ?? 1,
                    per_page: page.per_page ?? page.perPage ?? page.limit ?? 10,
                    limit: page.limit ?? page.per_page ?? page.perPage ?? 10,
                    search: page.search ?? ""
                };
            } else {
                params = {
                    page: page,
                    per_page: perPage,
                    limit: perPage,
                    search: search
                };
            }

            const res = await api.get('/purchases', { params });
            return res.data.data;
        } catch (error) {
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const res = await api.get(`/purchases/${id}`);
            return res.data.data || null;
        } catch (error) {
            throw error;
        }
    },

    create: async (data) => {
        try {
            const res = await api.post("/transaction-purchase", data);
            return res.data.data || res.data;
        } catch (error) {
            throw error;
        }
    },

    update: async (id, data) => {
        try {
            const res = await api.put(`/purchases/${id}`, data);
            return res.data.data || res.data;
        } catch (error) {
            throw error;
        }
    },

    deletes: async (id) => {
        try {
            const res = await api.delete(`/purchases/${id}`);
            return res.data.data || null;
        } catch (error) {
            throw error;
        }
    }
};

export const TransactionPurchaseService = PurchaseService;
export const PurchaseTransactionService = PurchaseService;
export default PurchaseService;
