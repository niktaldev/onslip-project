export interface Table {
  id: string;
  label?: string; // e.g. "T1"
  capacity: number; // number of seats
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  status?: "available" | "occupied" | "reserved";
  color?: string;
  orderId?: number; // Onslip 360 order ID
  currentState?: string; // Current state from the API (e.g., "1:ready")
  locked?: boolean; // Whether the table is locked from transformations
}

export function createTable(opts?: Partial<Table>): Table {
  const id = opts?.id ?? `t-${Date.now()}`;
  return {
    id,
    label: opts?.label ?? id,
    capacity: opts?.capacity ?? 4,
    x: opts?.x ?? 20,
    y: opts?.y ?? 20,
    width: opts?.width ?? 120,
    height: opts?.height ?? 80,
    rotation: opts?.rotation ?? 0,
    status: opts?.status ?? "available",
    color: opts?.color ?? "#f3f4f6",
  };
}
