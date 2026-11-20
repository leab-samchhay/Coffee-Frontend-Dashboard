import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { logout } from '../stores/authSlice';

const ProtectedRoute = ({ children }) => {
    const dispatch = useDispatch();
    const reduxToken = useSelector((state) => state.auth?.token);
    const sessionToken = sessionStorage.getItem('token');

    // Both sessionStorage and redux should have the token.
    // If the user cleared token from sessionStorage, clear Redux and redirect.
    useEffect(() => {
        if (!sessionToken && reduxToken) {
            dispatch(logout());
        }
    }, [sessionToken, reduxToken, dispatch]);

    if (!sessionToken) {
        return <Navigate to="/" replace />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
