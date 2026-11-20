import api from "./api"

export const CategoryService = {
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

            const res = await api.get('/categories', { params });
            return res.data.data;
        } catch (error) {
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const res = await api.get(`/categories/${id}`)
            return res.data.data || null
        } catch (error) {
            throw error;
        }
    },

    create: async (data) => {
        try {
            const res = await api.post("/categories", data)
            return res.data.data || null;
        } catch (error) {
            throw error;
        }
    },

    update: async (id, data) => {
        try {
            let res;
            if (data instanceof FormData) {
                if (!data.has('_method')) {
                    data.append('_method', 'PUT');
                }
                res = await api.post(`/categories/${id}`, data);
            } else {
                res = await api.put(`/categories/${id}`, data);
            }
            return res.data.data || null;
        } catch (error) {
            throw error;
        }
    },

    deletes: async (id) => {
        try {
            const res = await api.delete(`/categories/${id}`);
            return res.data.data || null;
        } catch (error) {
            throw error;
        }
    },
};