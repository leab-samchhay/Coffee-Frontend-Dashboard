import { createSlice } from '@reduxjs/toolkit'
// import { logout } from '../service/AuthService'; // បើមិនបានប្រើប្រាស់គួរលុបចេញ ដើម្បីការពារជៀសវាង Circular Dependency

const initialUser = sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')) : null;
const initialToken = sessionStorage.getItem('token') || null;

const authSlice = createSlice({
    name: 'auth',
    initialState: { // បានកែតម្រូវពី initalState មកជា initialState
        user: initialUser,
        token: initialToken,
    },

    reducers: {
        loginSuccess(state, action) {
            state.user = action.payload.user
            state.token = action.payload.token

            sessionStorage.setItem('user', JSON.stringify(action.payload.user))
            sessionStorage.setItem('token', action.payload.token)
        },

        logout(state) {
            state.user = null
            state.token = null
            // លុបចេញពី sessionStorage វិញពេល Logout
            sessionStorage.removeItem('user')
            sessionStorage.removeItem('token')
        }
    }
})

export const { loginSuccess, logout } = authSlice.actions
export default authSlice.reducer