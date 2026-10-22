import React from "react";
import { Printer, X } from "lucide-react";

export function BarcodeModal({ product, onClose }) {
  if (!product) return null;

  // Simple pseudo-barcode generator (Code 39 pattern emulator) in SVG
  const generateBarcodeLines = (sku) => {
    const chars = sku.toUpperCase();
    const bars = [];
    let x = 10;

    for (let i = 0; i < chars.length; i++) {
      const code = chars.charCodeAt(i);
      // Alternate bar widths based on char code
      const w1 = (code % 3) + 2;
      const w2 = ((code * 2) % 3) + 2;
      const w3 = (code % 2) + 2;

      bars.push(<rect key={`${i}-1`} x={x} y="0" width={w1} height="60" fill="#000000" />);
      x += w1 + 3;
      bars.push(<rect key={`${i}-2`} x={x} y="0" width={w2} height="60" fill="#000000" />);
      x += w2 + 2;
      bars.push(<rect key={`${i}-3`} x={x} y="0" width={w3} height="60" fill="#000000" />);
      x += w3 + 3;
    }
    return { bars, totalWidth: x + 10 };
  };

  const { bars, totalWidth } = generateBarcodeLines(product.sku);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "420px" }}>
        <div className="modal-header">
          <h3 className="modal-title">Product Barcode Label</h3>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: "center", padding: "30px 20px" }}>
          <div
            id="printable-barcode"
            style={{
              border: "2px dashed var(--border)",
              padding: "24px 16px",
              borderRadius: "8px",
              background: "#ffffff",
              display: "inline-block",
              minWidth: "260px",
            }}
          >
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
              StockLite Warehouse
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
              {product.name}
            </div>

            <svg
              width={Math.min(totalWidth, 280)}
              height="60"
              viewBox={`0 0 ${totalWidth} 60`}
              style={{ display: "block", margin: "0 auto" }}
            >
              {bars}
            </svg>

            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "2px", marginTop: "8px" }}>
              *{product.sku}*
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Price: ₹{Number(product.price).toFixed(2)} | Min: {product.reorder_level}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close
          </button>
          <button type="button" onClick={handlePrint} className="btn btn-primary">
            <Printer size={16} /> Print Sticker
          </button>
        </div>
      </div>
    </div>
  );
}
