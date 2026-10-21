import { Navigate, Outlet } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { Brand } from "./UI";

export function ProtectedRoute() {
  const { user, token, loading } = useAuth();
  if (loading) return <div className="app-loading"><Brand /><span /></div>;
  return token && user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function AdminRoute() {
  const { user } = useAuth();
  return user?.role === "admin" ? <Outlet /> : <Navigate to="/sos-board" replace />;
}

export function GuestRoute() {
  const { user, token, loading } = useAuth();
  if (loading) return <div className="app-loading"><Brand /><span /></div>;
  return token && user ? <Navigate to={user.role === "admin" ? "/admin" : "/sos-board"} replace /> : <Outlet />;
}
