import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/client";
import { Badge } from "../components/Badge";
import { StockModal } from "../components/StockModal";
import { BarcodeModal } from "../components/BarcodeModal";
import { useAuth } from "../context/AuthContext";
import {
  PackagePlus,
  Search,
  Filter,
  Download,
  Barcode,
  ArrowUpDown,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  AlertCircle,
} from "lucide-react";

export function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("category_id") || "";
  const stockStatus = searchParams.get("stock_status") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Modals state
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Product form state
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category_id: "",
    price: "",
    reorder_level: "5",
    initial_quantity: "0",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const { isAdmin } = useAuth();

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data.data.categories);
    } catch {
      // Ignore
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", 10);
      if (search) params.set("search", search);
      if (categoryId) params.set("category_id", categoryId);
      if (stockStatus) params.set("stock_status", stockStatus);

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data.data.products);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError("Failed to load products list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, categoryId, stockStatus, page]);

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

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      sku: "",
      name: "",
      category_id: categories[0]?.id || "",
      price: "",
      reorder_level: "5",
      initial_quantity: "0",
    });
    setFormError("");
    setShowProductModal(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      name: p.name,
      category_id: p.category_id,
      price: p.price,
      reorder_level: p.reorder_level,
      initial_quantity: "0",
    });
    setFormError("");
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, {
          name: formData.name,
          category_id: Number(formData.category_id),
          price: Number(formData.price),
          reorder_level: Number(formData.reorder_level),
        });
      } else {
        await api.post("/products", {
          sku: formData.sku,
          name: formData.name,
          category_id: Number(formData.category_id),
          price: Number(formData.price),
          reorder_level: Number(formData.reorder_level),
          initial_quantity: Number(formData.initial_quantity),
        });
      }

      setShowProductModal(false);
      fetchProducts();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        "Failed to save product"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get("/reports/inventory-export");
      const items = res.data.data.items;

      const headers = ["SKU", "Product Name", "Category", "Price", "Quantity", "Reorder Level", "Inventory Value", "Status"];
      const rows = items.map((i) => [
        `"${i.sku}"`,
        `"${i.product_name}"`,
        `"${i.category_name}"`,
        i.price,
        i.quantity,
        i.reorder_level,
        i.inventory_value,
        i.stock_status,
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `StockLite_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("Failed to export inventory CSV");
    }
  };

  return (
    <div>
      <div className="sticky-header-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Products & Inventory</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              Manage catalog items, monitor reorder levels, and adjust stock quantities.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleExportCSV} className="btn btn-secondary btn-sm">
              <Download size={15} /> Export CSV
            </button>
            {isAdmin && (
              <button onClick={openCreateModal} className="btn btn-primary btn-sm">
                <Plus size={15} /> Add Product
              </button>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="card" style={{ padding: "16px", marginBottom: "0" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
              <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => updateFilters("search", e.target.value)}
                className="form-input"
                style={{ paddingLeft: "36px" }}
              />
            </div>

            <select
              value={categoryId}
              onChange={(e) => updateFilters("category_id", e.target.value)}
              className="form-select"
              style={{ width: "auto", minWidth: "160px" }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={stockStatus}
              onChange={(e) => updateFilters("stock_status", e.target.value)}
              className="form-select"
              style={{ width: "auto", minWidth: "160px" }}
            >
              <option value="">All Stock Statuses</option>
              <option value="in_stock">In Stock (Healthy)</option>
              <option value="low_stock">Low Stock (At/Below Min)</option>
              <option value="out_of_stock">Out of Stock (Zero)</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Product Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>SKU / Barcode</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>Stock Status</th>
              <th>Available Qty</th>
              <th>Reorder Min</th>
              <th>Total Value</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                  Loading products...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                  No matching products found.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{p.sku}</span>
                      <button
                        onClick={() => setBarcodeProduct(p)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "3px 6px" }}
                        title="Print Barcode Label"
                      >
                        <Barcode size={14} />
                      </button>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.category_name}</td>
                  <td>₹{Number(p.price).toFixed(2)}</td>
                  <td>
                    <Badge status={p.stock_status} />
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: "1rem" }}>{p.quantity}</span>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{p.reorder_level}</td>
                  <td>₹{Number(p.inventory_value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      <button
                        onClick={() => setStockModalProduct(p)}
                        className="btn btn-primary btn-sm"
                        title="Stock In / Stock Out"
                      >
                        <ArrowUpDown size={13} /> Stock
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => openEditModal(p)}
                          className="btn btn-secondary btn-sm"
                          title="Edit Product Details"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Showing {products.length} of {pagination.total} products
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

      {/* Stock Movement Modal */}
      {stockModalProduct && (
        <StockModal
          product={stockModalProduct}
          onClose={() => setStockModalProduct(null)}
          onSuccess={fetchProducts}
          isAdmin={isAdmin}
        />
      )}

      {/* Printable Barcode Modal */}
      {barcodeProduct && (
        <BarcodeModal
          product={barcodeProduct}
          onClose={() => setBarcodeProduct(null)}
        />
      )}

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProduct ? "Edit Product Details" : "Create New Product"}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="btn btn-secondary btn-sm" style={{ padding: "4px" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="alert alert-danger">
                    <AlertCircle size={18} />
                    <span>{formError}</span>
                  </div>
                )}

                {!editingProduct && (
                  <div className="form-group">
                    <label className="form-label">SKU (Unique Code)</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. KB-101"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Ergonomic Bluetooth Keyboard"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    required
                    className="form-select"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="" disabled>Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label className="form-label">Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      className="form-input"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reorder Min Alert</label>
                    <input
                      type="number"
                      min="0"
                      required
                      className="form-input"
                      value={formData.reorder_level}
                      onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                    />
                  </div>
                </div>

                {!editingProduct && (
                  <div className="form-group">
                    <label className="form-label">Initial Opening Stock</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      placeholder="0"
                      value={formData.initial_quantity}
                      onChange={(e) => setFormData({ ...formData, initial_quantity: e.target.value })}
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Initial stock will automatically call the stored procedure to log opening inventory.
                    </span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowProductModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="btn btn-primary">
                  {formLoading ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
