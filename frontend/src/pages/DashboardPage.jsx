import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { Badge } from "../components/Badge";
import { StockModal } from "../components/StockModal";
import { useAuth } from "../context/AuthContext";
import {
  Package,
  Tags,
  AlertTriangle,
  IndianRupee,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { isAdmin } = useAuth();

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/reports/summary");
      setData(res.data.data);
    } catch (err) {
      setError("Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const { summary, recentMovements = [], categoryBreakdown = [] } = data || {};

  return (
    <div>
      <div className="sticky-header-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Dashboard Overview</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              Real-time stock quantities, inventory valuation, and recent movements.
            </p>
          </div>
          <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Critical Low Stock Alert Banner */}
      {summary?.low_stock_products > 0 && (
        <div className="alert alert-warning" style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertTriangle size={20} color="#d97706" />
            <div>
              <strong>Low-Stock Warning:</strong> You have {summary.low_stock_products} product(s) at or below their reorder threshold.
            </div>
          </div>
          <Link to="/products?stock_status=low_stock" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
            View Low-Stock Items
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <Package size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Active Products</span>
            <span className="stat-value">{summary?.total_products || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Low-Stock Alerts</span>
            <span className="stat-value">{summary?.low_stock_products || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#f3e8ff", color: "#9333ea" }}>
            <Tags size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Categories</span>
            <span className="stat-value">{summary?.total_categories || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>
            <IndianRupee size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Inventory Value</span>
            <span className="stat-value">₹{Number(summary?.total_inventory_value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px" }}>
        {/* Recent Stock Movements Feed */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Recent Stock Movements</h3>
            <Link to="/movements" style={{ fontSize: "0.85rem", color: "var(--primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
              View all <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="table-container" style={{ border: "none" }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Qty Change</th>
                  <th>Balance</th>
                  <th>By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                      No recent stock movements found.
                    </td>
                  </tr>
                ) : (
                  recentMovements.map((m) => (
                    <tr key={m.movement_id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{m.product_name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          {m.sku}
                        </div>
                      </td>
                      <td>
                        <Badge status={m.movement_type} />
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {m.movement_type.includes("in") ? `+${m.quantity}` : `-${m.quantity}`}
                      </td>
                      <td>{m.quantity_after}</td>
                      <td>{m.performed_by}</td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {new Date(m.created_at).toLocaleDateString()} {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "16px" }}>
            Inventory by Category
          </h3>
          <div className="table-container" style={{ border: "none" }}>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Items</th>
                  <th>Valuation (₹)</th>
                </tr>
              </thead>
              <tbody>
                {categoryBreakdown.map((cat) => (
                  <tr key={cat.id}>
                    <td style={{ fontWeight: 600 }}>{cat.name}</td>
                    <td>{cat.product_count}</td>
                    <td>₹{Number(cat.total_value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <StockModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSuccess={fetchDashboardData}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
