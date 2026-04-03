const BASE = import.meta.env.VITE_API_URL || "/tickets";

export async function analyzeTicket(message) {
  const res = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors?.[0] || data.error || "Request failed");
  return data.data;
}

export async function fetchTickets(limit = 50) {
  const res = await fetch(`${BASE}?limit=${limit}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load tickets");
  return data;
}
