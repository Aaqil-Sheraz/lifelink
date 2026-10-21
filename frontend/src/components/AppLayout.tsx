import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { Brand, Icon, type IconName } from "./UI";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const items: { to: string; label: string; short: string; icon: IconName }[] = [
    { to: "/sos-board", label: "SOS Board", short: "SOS", icon: "home" },
    { to: "/donors", label: "Find Donors", short: "Donors", icon: "users" },
    { to: "/post-sos", label: "Post SOS", short: "Post", icon: "plus" },
    { to: "/dashboard", label: "Dashboard", short: "Me", icon: "dashboard" },
  ];
  if (user?.role === "admin") items.push({ to: "/admin", label: "Admin", short: "Admin", icon: "shield" });

  function signOut() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/sos-board" aria-label="LifeLink home"><Brand /></NavLink>
        <nav className="desktop-nav" aria-label="Main navigation">
          {items.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? "active" : ""}><Icon name={item.icon} className="size-4" />{item.label}</NavLink>)}
        </nav>
        <div className="topbar-actions">
          <span className={`live-indicator ${connected ? "connected" : ""}`}><i />{connected ? "Live" : "Offline"}</span>
          <span className="user-chip"><b>{user?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2)}</b><span>{user?.name}<small>{user?.bloodGroup ? `${user.bloodGroup} donor` : user?.role}</small></span></span>
          <button className="icon-button" onClick={signOut} aria-label="Log out" title="Log out"><Icon name="logout" /></button>
        </div>
      </header>
      <main className="page"><Outlet /></main>
      <footer className="footer">This platform helps find donors faster; it does not replace certified blood banks or hospitals. Donors must be screened at the hospital.</footer>
      <nav className={`bottom-nav ${items.length === 5 ? "five" : ""}`} aria-label="Mobile navigation">
        {items.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? "active" : ""}><Icon name={item.icon} /><span>{item.short}</span></NavLink>)}
      </nav>
    </div>
  );
}
