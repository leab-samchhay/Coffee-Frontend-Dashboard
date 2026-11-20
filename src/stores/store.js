import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import AuthReducer from "./authSlice";

export const store = configureStore({
    reducer: {
        cart: cartReducer,
        auth: AuthReducer
    },
    devTools: process.env.NODE_ENV !== "production",
});

export default store;
