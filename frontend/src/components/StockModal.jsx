import React, { useState } from "react";
import api from "../api/client";
import { AlertCircle, CheckCircle, X } from "lucide-react";

export function StockModal({ product, initialMode = "stock_in", onClose, onSuccess, isAdmin }) {
  const [mode, setMode] = useState(initialMode); // 'stock_in' | 'stock_out' | 'adjust'
  const [quantity, setQuantity] = useState(1);
  const [newQuantity, setNewQuantity] = useState(product?.quantity || 0);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("Damaged Goods");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "stock_in") {
        await api.post(`/products/${product.id}/stock-in`, {
          quantity: Number(quantity),
          note: note.trim() || undefined,
        });
      } else if (mode === "stock_out") {
        await api.post(`/products/${product.id}/stock-out`, {
          quantity: Number(quantity),
          note: note.trim() || undefined,
        });
      } else if (mode === "adjust") {
        await api.post(`/products/${product.id}/adjust`, {
          new_quantity: Number(newQuantity),
          reason: `${reason}${note ? ` - ${note.trim()}` : ""}`,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        "Operation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Manage Stock</h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {product.name} ({product.sku})
            </span>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Mode Selector Tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => { setMode("stock_in"); setError(""); }}
                className={`btn btn-sm ${mode === "stock_in" ? "btn-primary" : "btn-secondary"}`}
                style={{ flex: 1 }}
              >
                + Stock In
              </button>
              <button
                type="button"
                onClick={() => { setMode("stock_out"); setError(""); }}
                className={`btn btn-sm ${mode === "stock_out" ? "btn-primary" : "btn-secondary"}`}
                style={{ flex: 1 }}
              >
                - Stock Out
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => { setMode("adjust"); setError(""); }}
                  className={`btn btn-sm ${mode === "adjust" ? "btn-primary" : "btn-secondary"}`}
                  style={{ flex: 1 }}
                >
                  Adjust (Audit)
                </button>
              )}
            </div>

            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Current Available:</span>
              <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{product.quantity} units</span>
            </div>

            {mode !== "adjust" ? (
              <div className="form-group">
                <label className="form-label">
                  Quantity to {mode === "stock_in" ? "Receive" : "Issue"}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="form-input"
                  placeholder="Enter quantity"
                />
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">New Corrected Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="form-input"
                    placeholder="Enter physical count"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Adjustment Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="form-select"
                  >
                    <option value="Physical Count Discrepancy">Physical Count Discrepancy</option>
                    <option value="Damaged Goods">Damaged Goods</option>
                    <option value="Expired / Obsolete">Expired / Obsolete</option>
                    <option value="Customer Return">Customer Return</option>
                    <option value="Supplier Return">Supplier Return</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">
                {mode === "adjust" ? "Additional Notes" : "Note / Invoice Reference (Optional)"}
              </label>
              <textarea
                rows="2"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="form-textarea"
                placeholder={mode === "adjust" ? "Details for audit log..." : "e.g., PO #492, Sales Invoice #8012"}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Processing..." : mode === "stock_in" ? "Receive Stock" : mode === "stock_out" ? "Issue Stock" : "Apply Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
