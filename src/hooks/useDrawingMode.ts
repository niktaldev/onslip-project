import { useState, useRef } from "react";
import type Konva from "konva";
import type { Table } from "../types/table";
import { createTable } from "../types/table";
import { getNextTableId, getTableName } from "../lib/tableHelpers";
import { getRelativePointerPosition } from "../lib/stageHelpers";

interface UseDrawingModeProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  setSelectedId: React.Dispatch<React.SetStateAction<number | null>>;
}

export function useDrawingMode({
  stageRef,
  tables,
  setTables,
  setSelectedId,
}: UseDrawingModeProps) {
  const [tableDrawMode, setTableDrawMode] = useState(false);
  const isDrawingRef = useRef(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);

  // Preview ref for table drawing
  const previewRectRef = useRef<Konva.Rect | null>(null);

  // Toggle table drawing mode
  const toggleDrawMode = () => {
    setTableDrawMode(!tableDrawMode);
    isDrawingRef.current = false;
    drawStartRef.current = null;

    // Hide preview when toggling off
    if (previewRectRef.current) {
      previewRectRef.current.visible(false);
      previewRectRef.current.getLayer()?.batchDraw();
    }
  };

  // Handle stage mouse down
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();

    // Check if we're in drawing mode
    if (!tableDrawMode) {
      if (!clickedOnEmpty) {
        return;
      }
      // Deselect when clicking on empty canvas
      setSelectedId(null);
      return;
    }

    // In drawing mode, don't start drawing if clicking on tables
    if (e.target !== e.target.getStage()) {
      const targetName = e.target.name();
      const targetParent = e.target.parent;

      if (targetName === "table" || targetParent?.name?.() === "table") {
        return;
      }
    }

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = getRelativePointerPosition(stage);
    if (!pointer) return;

    isDrawingRef.current = true;
    drawStartRef.current = { x: pointer.x, y: pointer.y };
    setSelectedId(null);
  };

  // Handle stage mouse move
  const handleStageMouseMove = () => {
    if (!tableDrawMode || !isDrawingRef.current || !drawStartRef.current)
      return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = getRelativePointerPosition(stage);
    if (!pointer) return;

    // Update preview rectangle
    if (previewRectRef.current) {
      const start = drawStartRef.current;
      const width = pointer.x - start.x;
      const height = pointer.y - start.y;

      previewRectRef.current.setAttrs({
        x: width > 0 ? start.x : pointer.x,
        y: height > 0 ? start.y : pointer.y,
        width: Math.abs(width),
        height: Math.abs(height),
        visible: true,
      });
      previewRectRef.current.getLayer()?.batchDraw();
    }
  };

  // Handle stage mouse up
  const handleStageMouseUp = () => {
    if (!tableDrawMode || !isDrawingRef.current || !drawStartRef.current)
      return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = getRelativePointerPosition(stage);
    if (!pointer) return;

    const start = drawStartRef.current;
    const width = Math.round(Math.abs(pointer.x - start.x));
    const height = Math.round(Math.abs(pointer.y - start.y));

    // Only create table if it has meaningful dimensions
    if (width > 10 && height > 10) {
      const id = getNextTableId(tables);
      const newTable = createTable({
        id,
        name: getTableName(id),
        x: Math.round(Math.min(start.x, pointer.x)),
        y: Math.round(Math.min(start.y, pointer.y)),
        width,
        height,
      });

      setTables((prev) => [...prev, newTable]);
      setSelectedId(id);
    }

    isDrawingRef.current = false;
    drawStartRef.current = null;

    // Hide preview rectangle
    if (previewRectRef.current) {
      previewRectRef.current.visible(false);
      previewRectRef.current.getLayer()?.batchDraw();
    }
  };

  return {
    tableDrawMode,
    toggleDrawMode,
    previewRectRef,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
  };
}
