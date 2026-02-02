"use client";

import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Image } from "react-konva";
import { useImage } from "react-konva-utils";
import type { Table } from "../types/table";
import type { Line as LineType } from "../types/line";
import TableStateControls from "./TableStateControls";
import StageControls from "./StageControls";
import TableLayer from "./TableLayer";
import LineLayer from "./LineLayer";
import TableDialog from "./TableDialog";
import { useStageControls } from "../hooks/useStageControls";
import { useTableManagement } from "../hooks/useTableManagement";
import { useLineManagement } from "../hooks/useLineManagement";
import { useDrawingMode } from "../hooks/useDrawingMode";
import { useTableStates } from "../hooks/useTableStates";
import { deleteOrder } from "../lib/states";
import { type TableCreationConfig } from "./AddTablesForm";
import {
  getNextTableId,
  getTableName,
  calculateTablePositions,
} from "../lib/tableHelpers";
import { createTable } from "../types/table";

export default function Editor() {
  const [backgroundImage] = useImage("/demo-floorplan.svg");
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Stage controls (size, position, scale, zoom)
  const {
    stageRef,
    stageSize,
    stagePos,
    stageScale,
    setStagePos,
    handleWheel,
  } = useStageControls(containerRef);

  // Table management (tables, selection, drag, transform, lock)
  const {
    tables,
    setTables,
    selectedId,
    setSelectedId,
    selectedTable,
    tableRefs,
    transformerRef,
    dialogOpen,
    setDialogOpen,
    handleTableClick,
    handleDragEnd,
    handleTransformEnd,
    handleToggleLock,
    handleCapacityChange,
    handleAvailablePositionsUpdate,
  } = useTableManagement([]);

  // Line management (lines, snap indicators)
  const {
    lines,
    setLines,
    snapIndicatorStartRef,
    snapIndicatorEndRef,
    SNAP_THRESHOLD,
    handleLineUpdate,
    handleSnapIndicator,
    hideSnapIndicators,
  } = useLineManagement();

  // Separate state for line selection (lines use string IDs)
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  // Wrapper to handle both table (number) and line (string) IDs
  const handleSetSelectedId = (id: string | number | null) => {
    if (typeof id === "number") {
      setSelectedId(id);
    } else if (typeof id === "string") {
      // Lines use string IDs, but we're tracking tables separately
      // For now, just clear selection when selecting a line
      setSelectedId(null);
    } else {
      setSelectedId(null);
    }
  };

  // Drawing mode (table/line drawing, mouse handlers)
  const {
    tableDrawMode,
    lineDrawMode,
    previewRectRef,
    previewLineRef,
    toggleDrawMode,
    toggleLineDrawMode,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
  } = useDrawingMode({
    stageRef,
    tables,
    setTables,
    lines,
    setLines,
    setSelectedId: handleSetSelectedId,
    snapIndicatorStartRef,
    snapIndicatorEndRef,
    SNAP_THRESHOLD,
    hideSnapIndicators,
  });

  // Table states (API integration)
  const { isStateLoading, handleStateChange } = useTableStates({
    tables,
    setTables,
    selectedId,
  });

  // Handle keyboard delete
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();

        // Find the table to get its orderId
        const table = tables.find((t) => t.id === selectedId);

        // Delete order from backend if it exists
        if (table?.orderId) {
          try {
            await deleteOrder(table.orderId);
          } catch (error) {
            console.error("Error deleting order from backend:", error);
          }
        }

        // Remove table from frontend
        setTables((prevTables) =>
          prevTables.filter((t) => t.id !== selectedId),
        );
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedId, tables, lines, setTables, setLines, setSelectedId]);

  // Handle import
  const handleImport = (canvasState: {
    tables: Table[];
    lines: LineType[];
  }) => {
    setTables(canvasState.tables);
    setLines(canvasState.lines);
    setSelectedId(null);
  };

  // Handle delete button
  const handleDelete = async () => {
    if (!selectedId) return;

    // Find the table to get its orderId
    const table = tables.find((t) => t.id === selectedId);

    // Delete order from backend if it exists
    if (table?.orderId) {
      try {
        await deleteOrder(table.orderId);
      } catch (error) {
        console.error("Error deleting order from backend:", error);
      }
    }

    // Remove table from frontend
    setTables((prevTables) => prevTables.filter((t) => t.id !== selectedId));
    setSelectedId(null);
  };

  // Handle bulk table creation
  const handleAddTables = (config: TableCreationConfig) => {
    const { width, height, maxCapacity, minCapacity, count } = config;

    // Calculate positions for all tables
    const positions = calculateTablePositions(count, width, height);

    // Create new tables
    const newTables = positions.map((pos, index) => {
      const id = getNextTableId(tables) + index;
      return createTable({
        id,
        name: getTableName(id),
        capacity: maxCapacity,
        minCapacity: minCapacity,
        width,
        height,
        x: pos.x,
        y: pos.y,
      });
    });

    // Add all new tables to state
    setTables((prevTables) => [...prevTables, ...newTables]);
  };

  // Handle copy table
  const handleCopyTable = () => {
    if (!selectedId) return;

    const tableToCopy = tables.find((t) => t.id === selectedId);
    if (!tableToCopy) return;

    const id = getNextTableId(tables);
    const newTable = createTable({
      id,
      name: getTableName(id),
      capacity: tableToCopy.capacity,
      minCapacity: tableToCopy.minCapacity,
      width: tableToCopy.width,
      height: tableToCopy.height,
      x: tableToCopy.x + 30, // Offset to avoid overlap
      y: tableToCopy.y + 30,
      rotation: tableToCopy.rotation,
    });

    setTables((prevTables) => [...prevTables, newTable]);
    setSelectedId(id); // Select the new copy
  };

  return (
    <div className="p-4">
      <StageControls
        tableDrawMode={tableDrawMode}
        lineDrawMode={lineDrawMode}
        onToggleTableDraw={toggleDrawMode}
        onToggleLineDraw={toggleLineDrawMode}
        tables={tables}
        lines={lines}
        onImport={handleImport}
        selectedId={selectedId}
        onDelete={handleDelete}
        onAddTables={handleAddTables}
      />

      <div
        ref={containerRef}
        className="w-[1200px] h-[600px] border border-gray-300"
      >
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          x={stagePos.x}
          y={stagePos.y}
          scaleX={stageScale}
          scaleY={stageScale}
          draggable={!tableDrawMode && !lineDrawMode}
          onWheel={handleWheel}
          onDragMove={(e) => {
            const isDraggingShape = e.target !== e.target.getStage();
            if (isDraggingShape) {
              const stage = e.target.getStage();
              if (stage) {
                stage.position(stagePos);
              }
            }
          }}
          onDragEnd={(e) => {
            if (e.target === e.target.getStage()) {
              setStagePos({ x: e.target.x(), y: e.target.y() });
            }
          }}
          style={{ display: "block" }}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
        >
          {/* Background Layer */}
          <Layer listening={false}>
            {backgroundImage && (
              <Image
                image={backgroundImage}
                alt="image not found"
                width={backgroundImage.width}
                height={backgroundImage.height}
              />
            )}
          </Layer>

          {/* Tables Layer */}
          <TableLayer
            tables={tables}
            selectedId={selectedId}
            setSelectedId={handleTableClick}
            handleDragEnd={handleDragEnd}
            handleTransformEnd={handleTransformEnd}
            tableRefs={tableRefs}
            transformerRef={transformerRef}
          />

          {/* Lines Layer */}
          <LineLayer
            lines={lines}
            selectedId={selectedLineId}
            setSelectedId={setSelectedLineId}
            handleLineUpdate={handleLineUpdate}
            handleSnapIndicator={handleSnapIndicator}
            snapIndicatorStartRef={snapIndicatorStartRef}
            snapIndicatorEndRef={snapIndicatorEndRef}
            previewRectRef={previewRectRef}
            previewLineRef={previewLineRef}
            snapThreshold={SNAP_THRESHOLD}
          />
        </Stage>
      </div>

      {/* State controls for selected table */}
      {selectedTable && (
        <TableStateControls
          tableName={selectedTable.name}
          currentState={selectedTable.currentState || null}
          isLocked={selectedTable.locked}
          capacity={selectedTable.capacity}
          minCapacity={selectedTable.minCapacity}
          onToggleLock={handleToggleLock}
          onPreviousState={() => handleStateChange("prev")}
          onNextState={() => handleStateChange("next")}
          onCapacityChange={handleCapacityChange}
          onCopyTable={handleCopyTable}
          isStateLoading={isStateLoading}
        />
      )}

      {/* Table details dialog */}
      <TableDialog
        table={selectedTable || null}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onPreviousState={() => handleStateChange("prev")}
        onNextState={() => handleStateChange("next")}
        isLoading={isStateLoading}
        onUpdateAvailablePositions={handleAvailablePositionsUpdate}
      />
    </div>
  );
}
