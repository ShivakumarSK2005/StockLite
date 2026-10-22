import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function Layout() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
