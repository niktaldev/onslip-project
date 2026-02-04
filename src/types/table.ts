export interface Table {
  id: number;
  name: string; // Display name e.g. "T-1"
  capacity: number; // maximum number of seats
  minCapacity?: number; // minimum number of seats
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
  availablePositions?: number[]; // Array of position indices that can have chairs
}

export interface Chair {
  chairId: number; // Backend chair ID (tab ID)
  position: number; // Position index around the table
  orderId?: number; // Onslip 360 order ID that this chair belongs to
  name?: string; // Chair name
}

import { calculateMaxChairPositions } from "../lib/tableHelpers";

export function createTable(opts?: Partial<Table>): Table {
  const id = opts?.id ?? Date.now();
  const width = opts?.width ?? 120;
  const height = opts?.height ?? 80;

  // Calculate max positions based on table dimensions
  const maxPositions = calculateMaxChairPositions(width, height);

  // Set all positions as available by default (0 to maxPositions-1)
  const availablePositions =
    opts?.availablePositions ??
    Array.from({ length: maxPositions }, (_, i) => i);

  return {
    id,
    name: opts?.name ?? `T-${id}`,
    capacity: opts?.capacity ?? 4,
    x: opts?.x ?? 20,
    y: opts?.y ?? 20,
    width,
    height,
    rotation: opts?.rotation ?? 0,
    status: opts?.status ?? "available",
    color: opts?.color ?? "#f3f4f6",
    availablePositions,
  };
}
