import { useState, useEffect, useCallback } from "react";
import { fetchTickets } from "../utils/api";

/**
 * useTickets
 * Manages fetching, caching, and prepending new tickets.
 */
export function useTickets(limit = 50) {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTickets(limit);
      setTickets(data.tickets);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  // Call this after a new ticket is analyzed to prepend without re-fetching
  const prepend = useCallback((ticket) => {
    setTickets((prev) => [ticket, ...prev]);
    setTotal((t) => t + 1);
  }, []);

  return { tickets, total, loading, error, reload: load, prepend };
}
