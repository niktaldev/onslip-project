import { useState, useEffect } from "react";
import type { Table } from "../types/table";
import {
  createOrder,
  setNextOrderState,
  setPreviousOrderState,
  getLocations,
  getOrderState,
} from "../lib/states";

interface UseTableStatesProps {
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  selectedId: string | null;
}

export function useTableStates({
  tables,
  setTables,
  selectedId,
}: UseTableStatesProps) {
  const [locationId, setLocationId] = useState<number | null>(null);
  const [isStateLoading, setIsStateLoading] = useState(false);

  // Fetch location on mount
  useEffect(() => {
    async function fetchLocation() {
      try {
        const locations = await getLocations();
        const targetLocation = locations.find(
          (loc) => loc.name === "table-states-location"
        );
        if (targetLocation) {
          setLocationId(targetLocation.id);
        }
      } catch (error) {
        console.error("Error fetching location:", error);
      }
    }
    fetchLocation();
  }, []);

  // Initialize an order for a table
  const initializeTableOrder = async (tableId: string) => {
    if (!locationId) {
      console.error("Location not available");
      return;
    }

    const table = tables.find((t) => t.id === tableId);
    if (!table || table.orderId) {
      return; // Already has an order
    }

    try {
      const orderId = await createOrder(table.label || tableId, locationId);
      setTables((prevTables) =>
        prevTables.map((t) =>
          t.id === tableId ? { ...t, orderId, currentState: "null" } : t
        )
      );
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  // Refresh table state from server
  const refreshTableState = async (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table || !table.orderId) return;

    try {
      const currentState = await getOrderState(table.orderId);
      setTables((prevTables) =>
        prevTables.map((t) =>
          t.id === tableId
            ? { ...t, currentState: currentState || undefined }
            : t
        )
      );
    } catch (error) {
      console.error("Error refreshing state:", error);
    }
  };

  // Handle state change (next or previous)
  const handleStateChange = async (direction: "next" | "prev") => {
    if (!selectedId) return;

    const table = tables.find((t) => t.id === selectedId);
    if (!table || !table.orderId) {
      // Initialize order if not exists
      await initializeTableOrder(selectedId);
      return;
    }

    setIsStateLoading(true);
    try {
      if (direction === "next") {
        await setNextOrderState(table.orderId);
      } else {
        await setPreviousOrderState(table.orderId);
      }

      // Fetch updated state from the server
      await refreshTableState(selectedId);
    } catch (error) {
      console.error("Error changing state:", error);
    } finally {
      setIsStateLoading(false);
    }
  };

  // Initialize order when a table is selected for the first time
  const selectedTable = selectedId
    ? tables.find((t) => t.id === selectedId)
    : null;

  useEffect(() => {
    if (selectedTable && !selectedTable.orderId && locationId) {
      initializeTableOrder(selectedTable.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, locationId]);

  return {
    locationId,
    isStateLoading,
    handleStateChange,
    initializeTableOrder,
    refreshTableState,
  };
}
