import api from "./api";

export const CoffeeService = {
    getAll: async (page = 1, perPage = 10, search = "", categoryId = null) => {
        try {
            let params = {};
            if (typeof page === 'object' && page !== null) {
                params = {
                    page: page.page ?? 1,
                    per_page: page.per_page ?? page.perPage ?? page.limit ?? 10,
                    limit: page.limit ?? page.per_page ?? page.perPage ?? 10,
                    search: page.search ?? "",
                    ...(page.category_id || page.categoryId ? { category_id: page.category_id || page.categoryId } : {})
                };
            } else {
                params = {
                    page: page,
                    per_page: perPage,
                    limit: perPage,
                    search: search,
                    ...(categoryId ? { category_id: categoryId } : {})
                };
            }

            const res = await api.get('/coffees', { params });
            return res.data.data;
        } catch (error) {
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const res = await api.get(`/coffees/${id}`);
            return res.data.data || null;
        } catch (error) {
            throw error;
        }
    },

    create: async (data) => {
        try {
            const res = await api.post("/coffees", data);
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
                res = await api.post(`/coffees/${id}`, data);
            } else {
                res = await api.put(`/coffees/${id}`, data);
            }
            return res.data.data || null;
        } catch (error) {
            throw error;
        }
    },

    deletes: async (id) => {
        try {
            const res = await api.delete(`/coffees/${id}`);
            return res.data.data || null;
        } catch (error) {
            throw error;
        }
    },
};
