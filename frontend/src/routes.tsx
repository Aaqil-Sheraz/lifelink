import { createBrowserRouter, Navigate } from "react-router";
import AppLayout from "./components/AppLayout";
import { AdminRoute, GuestRoute, ProtectedRoute } from "./components/RouteGuards";
import Admin from "./pages/Admin";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Donors from "./pages/Donors";
import NotFound from "./pages/NotFound";
import PostSos from "./pages/PostSos";
import SosBoard from "./pages/SosBoard";

export const router = createBrowserRouter([
  {
    Component: GuestRoute,
    children: [
      { path: "/login", element: <AuthPage mode="login" /> },
      { path: "/register", element: <AuthPage mode="register" /> },
    ],
  },
  {
    Component: ProtectedRoute,
    children: [{
      Component: AppLayout,
      children: [
        { index: true, element: <Navigate to="/sos-board" replace /> },
        { path: "/sos-board", Component: SosBoard },
        { path: "/post-sos", Component: PostSos },
        { path: "/donors", Component: Donors },
        { path: "/dashboard", Component: Dashboard },
        { Component: AdminRoute, children: [{ path: "/admin", Component: Admin }] },
      ],
    }],
  },
  { path: "*", Component: NotFound },
]);
