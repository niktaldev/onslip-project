"use client";

import { Group, Rect, Text } from "react-konva";
import Konva from "konva";
import type { Table } from "../types/table";

type Props = {
  table: Table;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onDragEnd?: (id: string, x: number, y: number) => void;
  onTransformEnd?: (id: string) => void;
  shapeRef?: (node: Konva.Group | null) => void;
};

// Map state names to colors
function getStateColor(state?: string): string {
  if (!state) return "#f3f4f6"; // default gray

  const stateKey = state.split(":")[1]?.toLowerCase();

  const colorMap: Record<string, string> = {
    ready: "#86efac", // green-300
    guest_arrived: "#fde047", // yellow-300
    drinks_ordered: "#fbbf24", // amber-400
    drinks_served: "#fb923c", // orange-400
    food_ordered: "#f97316", // orange-500
    food_served: "#f59e0b", // amber-500
    bill_requested: "#fca5a5", // red-300
    paid: "#c084fc", // purple-400
    uncleaned: "#f87171", // red-400
    cleaned: "#60a5fa", // blue-400
  };

  return colorMap[stateKey] ?? "#f3f4f6";
}

export default function TableRect({
  table,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
  shapeRef,
}: Props) {
  const stroke = isSelected ? "#2563eb" : "#9ca3af";
  const strokeWidth = isSelected ? 3 : 1;
  const fill = getStateColor(table.currentState);

  // Format state text for display
  const stateText = table.currentState
    ? table.currentState.split(":")[1]?.replace(/_/g, " ")
    : "";

  return (
    <Group
      name="table"
      ref={shapeRef}
      x={table.x}
      y={table.y}
      width={table.width}
      height={table.height}
      rotation={table.rotation || 0}
      draggable={!table.locked}
      onDragEnd={(e) => onDragEnd?.(table.id, e.target.x(), e.target.y())}
      onTransformEnd={() => onTransformEnd?.(table.id)}
    >
      <Rect
        id={table.id}
        x={0}
        y={0}
        width={table.width}
        height={table.height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        onClick={() => onSelect?.(table.id)}
      />
      <Text
        text={table.label ?? `Table ${table.id}`}
        fontSize={14}
        fontStyle="bold"
        fill="#111827"
        x={8}
        y={8}
      />
      {stateText && (
        <Text
          text={stateText}
          fontSize={11}
          fill="#374151"
          x={8}
          y={28}
          width={table.width - 16}
          ellipsis={true}
        />
      )}
    </Group>
  );
}
