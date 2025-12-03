export function formatAddress(parts = {}) {
  const segments = [
    parts.city,
    parts.district,
    parts.neighborhood,
    parts.street,
    parts.avenue,
  ].filter(Boolean);

  const line = segments.join(", ");
  const building = parts.building_no ? `${parts.building_no}` : "";
  const postal = parts.postal_code ? parts.postal_code : "";

  return [line, building, postal].filter(Boolean).join(" • ");
}

export function summarizeLocation(parts = {}) {
  const address = formatAddress(parts);

  if (address && parts.location_name) {
    return `${parts.location_name} • ${address}`;
  }

  return parts.location_name || address || "";
}
