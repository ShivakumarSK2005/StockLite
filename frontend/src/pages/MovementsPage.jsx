import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/client";
import { Badge } from "../components/Badge";
import { Search, ChevronLeft, ChevronRight, History } from "lucide-react";

export function MovementsPage() {
  const [movements, setMovements] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const movementType = searchParams.get("movement_type") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const fetchMovements = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", 15);
      if (search) params.set("search", search);
      if (movementType) params.set("movement_type", movementType);

      const res = await api.get(`/stock-movements?${params.toString()}`);
      setMovements(res.data.data.movements);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError("Failed to load stock movement history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [search, movementType, page]);

  const updateFilters = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  return (
    <div>
      <div className="sticky-header-container">
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Stock Movement History</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Immutable audit trail of all receipts, issues, and adjustments executed by employees and admins.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="card" style={{ padding: "16px", marginBottom: "0" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
              <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search by SKU, product name, or note..."
                value={search}
                onChange={(e) => updateFilters("search", e.target.value)}
                className="form-input"
                style={{ paddingLeft: "36px" }}
              />
            </div>

            <select
              value={movementType}
              onChange={(e) => updateFilters("movement_type", e.target.value)}
              className="form-select"
              style={{ width: "auto", minWidth: "180px" }}
            >
              <option value="">All Movement Types</option>
              <option value="stock_in">Stock In (Receipt)</option>
              <option value="stock_out">Stock Out (Issuance)</option>
              <option value="adjustment_in">Adjustment In (Correction +)</option>
              <option value="adjustment_out">Adjustment Out (Correction -)</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date & Time</th>
              <th>Product / SKU</th>
              <th>Type</th>
              <th>Quantity Moved</th>
              <th>Before</th>
              <th>After</th>
              <th>Performed By</th>
              <th>Reason / Reference Note</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                  Loading movements...
                </td>
              </tr>
            ) : movements.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                  No movement records found.
                </td>
              </tr>
            ) : (
              movements.map((m) => (
                <tr key={m.movement_id}>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
                    #{m.movement_id}
                  </td>
                  <td style={{ whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                    <div>{new Date(m.created_at).toLocaleDateString()}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{m.product_name}</div>
                    <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      {m.sku}
                    </div>
                  </td>
                  <td>
                    <Badge status={m.movement_type} />
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {m.movement_type.includes("in") ? `+${m.quantity}` : `-${m.quantity}`}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{m.quantity_before}</td>
                  <td style={{ fontWeight: 600 }}>{m.quantity_after}</td>
                  <td>
                    <span style={{ fontWeight: 500 }}>{m.performed_by}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "4px" }}>
                      ({m.user_role})
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.85rem", maxWidth: "240px" }}>
                    {m.note || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Showing {movements.length} of {pagination.total} audit movements
          </span>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              disabled={pagination.page <= 1}
              onClick={() => updateFilters("page", pagination.page - 1)}
              className="btn btn-secondary btn-sm"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => updateFilters("page", pagination.page + 1)}
              className="btn btn-secondary btn-sm"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
