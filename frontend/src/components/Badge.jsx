import React from "react";

export function Badge({ status, text }) {
  const label = text || status?.replace(/_/g, " ");
  return <span className={`badge badge-${status}`}>{label}</span>;
}
