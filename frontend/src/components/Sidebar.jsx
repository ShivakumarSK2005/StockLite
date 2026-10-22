import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  History,
  Users,
  LogOut,
  Boxes,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Sidebar() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Boxes size={28} color="#3b82f6" />
        <span className="sidebar-logo">StockLite</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/products"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <Package size={18} />
          <span>Products & Stock</span>
        </NavLink>

        <NavLink
          to="/categories"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <Tags size={18} />
          <span>Categories</span>
        </NavLink>

        <NavLink
          to="/movements"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <History size={18} />
          <span>Movement History</span>
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/users"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Users size={18} />
            <span>User Management</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <span className="user-name">{user?.name}</span>
          <span className="user-role-badge">{user?.role}</span>
        </div>
        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          title="Sign out"
          style={{ padding: "6px" }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
