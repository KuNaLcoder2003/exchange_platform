// auth/ProtectedRoute.jsx

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
    const { loading, isLoggedIn } = useAuth();

    if (loading) {
        console.log('Loading')
        return <h2>Loading...</h2>;
    }

    return isLoggedIn ? <Outlet /> : <Navigate to="/auth" replace />;
}
