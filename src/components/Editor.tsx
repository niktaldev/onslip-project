"use client";

import { useEffect, useRef } from "react";
import { Stage, Layer, Image } from "react-konva";
import { useImage } from "react-konva-utils";
import type { Table } from "../types/table";
import TableStateControls from "./TableStateControls";
import StageControls from "./StageControls";
import TableLayer from "./TableLayer";
import TableDialog from "./TableDialog";
import { useStageControls } from "../hooks/useStageControls";
import { useTableManagement } from "../hooks/useTableManagement";
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

  // Drawing mode (table drawing, mouse handlers)
  const {
    tableDrawMode,
    toggleDrawMode,
    previewRectRef,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
  } = useDrawingMode({
    stageRef,
    tables,
    setTables,
    setSelectedId,
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
      if (e.key === "Delete" && selectedId) {
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
  }, [selectedId, tables, setTables, setSelectedId]);

  // Handle import
  const handleImport = (canvasState: { tables: Table[] }) => {
    setTables(canvasState.tables);
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
        onToggleTableDraw={toggleDrawMode}
        tables={tables}
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
          draggable={!tableDrawMode}
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
            previewRectRef={previewRectRef}
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
