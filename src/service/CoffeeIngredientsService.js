import React from 'react'
import api from './api';

export const CoffeeIngredientsService = {
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

            const res = await api.get('/coffee-ingredients', { params });
            return res.data.data || null;
        }
        catch(error){
            throw error;
        }
    },

    getById : async(id) => {
        try{
            const res = await api.get(`/coffee-ingredients/${id}`);
            return res.data.data || null;
        }
        catch(error){
            throw error;
        }
    },

    create :  async(data) => {
        try{
            const res = await api.post("/coffee-ingredients",data);
            return res.data.data || null;
        }
        catch(error){
            throw error;
        }
    },

    update : async(id,data) => {
        try{
            const res = await api.put(`/coffee-ingredients/${id}`,data);
            return res.data.data || null;
        }
        catch(error){
            throw error;
        }
    },

    deletes : async(id) => {
        try{
            const res = await api.delete(`/coffee-ingredients/${id}`);
            return res.data.data || null;
        }
        catch(error){
            throw error;
        }
    }
}
