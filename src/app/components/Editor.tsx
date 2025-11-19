"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Line, Circle } from "react-konva";
import Konva from "konva";
import type { Table } from "../../types/table";
import { createTable } from "../../types/table";
import { getNextTableId } from "../../lib/tableHelpers";
import TableRect from "./TableRect";
import DrawSquareButton from "./DrawSquareButton";
import DrawLineButton from "./DrawLineButton";

export default function Editor() {
  // Ref to the container div to measure size, for dynamic Stage sizing
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Ref to the Konva Stage instance
  const stageRef = useRef<Konva.Stage | null>(null);

  // Sets the size of the Stage based on container size
  const [stageSize, setStageSize] = useState({ width: 300, height: 150 });

  // Holds the list of tables in the editor
  const [tables, setTables] = useState<Table[]>(() => [
    // Default tables for testing
    createTable({ id: "T1", label: "T1", x: 20, y: 20, capacity: 4 }),
    createTable({ id: "T2", label: "T2", x: 200, y: 40, capacity: 2 }),
  ]);

  // Holds the ID of the currently selected table
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Holds the list of lines drawn in the editor
  type DrawnLine = { id: string; points: number[] };
  const [lines, setLines] = useState<DrawnLine[]>([]);

  // Drawing state
  const [tableDrawMode, setTableDrawMode] = useState(false);
  const [lineDrawMode, setLineDrawMode] = useState(false);
  const isDrawingRef = useRef(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);

  // Preview: imperative Konva rect + layer for batchDraw
  const layerRef = useRef<Konva.Layer | null>(null);
  const previewRectRef = useRef<Konva.Rect | null>(null);
  const previewLineRef = useRef<Konva.Line | null>(null);

  // Snap indicators for line endpoints
  const snapIndicatorStartRef = useRef<Konva.Circle | null>(null);
  const snapIndicatorEndRef = useRef<Konva.Circle | null>(null);

  // Snap threshold in pixels
  const SNAP_THRESHOLD = 15;

  // Update and observe parent size. Works in modern browsers; falls back to window resize.
  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    const updateStageSize = () => {
      const rect = containerEl.getBoundingClientRect();
      const width = Math.max(0, Math.round(rect.width));
      const height = Math.max(0, Math.round(rect.height));
      setStageSize((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height }
      );
    };

    updateStageSize();

    // Observe size changes of the container to dynamically adjust the Stage size.
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => updateStageSize());
      resizeObserver.observe(containerEl);
    } else {
      window.addEventListener("resize", updateStageSize);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener("resize", updateStageSize);
    };
  }, []);

  // Set the position of a table after drag end
  const handleDragEnd = (id: string, x: number, y: number) => {
    setTables((prevTables) =>
      prevTables.map((t) => (t.id === id ? { ...t, x, y } : t))
    );
  };

  // Helper function to find the nearest line endpoint within snap threshold
  const findNearestEndpoint = (
    x: number,
    y: number
  ): { x: number; y: number } | null => {
    let nearestPoint: { x: number; y: number } | null = null;
    let minDistance = SNAP_THRESHOLD;

    lines.forEach((line) => {
      const points = line.points;
      // Check start point (first two values)
      if (points.length >= 2) {
        const startX = points[0];
        const startY = points[1];
        const distStart = Math.sqrt((x - startX) ** 2 + (y - startY) ** 2);
        if (distStart < minDistance) {
          minDistance = distStart;
          nearestPoint = { x: startX, y: startY };
        }
      }
      // Check end point (last two values)
      if (points.length >= 4) {
        const endX = points[points.length - 2];
        const endY = points[points.length - 1];
        const distEnd = Math.sqrt((x - endX) ** 2 + (y - endY) ** 2);
        if (distEnd < minDistance) {
          minDistance = distEnd;
          nearestPoint = { x: endX, y: endY };
        }
      }
    });

    return nearestPoint;
  };

  // Toggle drawing mode on/off
  const toggleDrawMode = () => {
    const newDrawMode = !tableDrawMode;
    setTableDrawMode(newDrawMode);
    if (newDrawMode) {
      setLineDrawMode(false);
    }
    isDrawingRef.current = false;
    drawStartRef.current = null;

    // hide preview imperatively
    if (previewRectRef.current) {
      previewRectRef.current.visible(false);
      previewRectRef.current.getLayer()?.batchDraw();
    }
    if (previewLineRef.current) {
      previewLineRef.current.visible(false);
      previewLineRef.current.getLayer()?.batchDraw();
    }
    // hide snap indicators
    if (snapIndicatorStartRef.current) {
      snapIndicatorStartRef.current.visible(false);
      snapIndicatorStartRef.current.getLayer()?.batchDraw();
    }
    if (snapIndicatorEndRef.current) {
      snapIndicatorEndRef.current.visible(false);
      snapIndicatorEndRef.current.getLayer()?.batchDraw();
    }
  };

  // Toggle line drawing mode on/off
  const toggleLineDrawMode = () => {
    const newLineDrawMode = !lineDrawMode;
    setLineDrawMode(newLineDrawMode);
    if (newLineDrawMode) {
      setTableDrawMode(false);
    }
    isDrawingRef.current = false;
    drawStartRef.current = null;

    // hide preview imperatively
    if (previewRectRef.current) {
      previewRectRef.current.visible(false);
      previewRectRef.current.getLayer()?.batchDraw();
    }
    if (previewLineRef.current) {
      previewLineRef.current.visible(false);
      previewLineRef.current.getLayer()?.batchDraw();
    }
    // hide snap indicators
    if (snapIndicatorStartRef.current) {
      snapIndicatorStartRef.current.visible(false);
      snapIndicatorStartRef.current.getLayer()?.batchDraw();
    }
    if (snapIndicatorEndRef.current) {
      snapIndicatorEndRef.current.visible(false);
      snapIndicatorEndRef.current.getLayer()?.batchDraw();
    }
  };

  // Handlers for stage mouse events to implement drawing new tables
  const handleStageMouseDown = () => {
    if (!tableDrawMode && !lineDrawMode) return;

    const pointer = stageRef.current?.getPointerPosition?.();
    if (!pointer) return;

    isDrawingRef.current = true;

    // For line mode, snap to nearest endpoint if close enough
    let startPoint = { x: pointer.x, y: pointer.y };
    if (lineDrawMode) {
      const snapPoint = findNearestEndpoint(pointer.x, pointer.y);
      if (snapPoint) {
        startPoint = snapPoint;
        // Show snap indicator at start point
        if (snapIndicatorStartRef.current) {
          snapIndicatorStartRef.current.setAttrs({
            x: snapPoint.x,
            y: snapPoint.y,
            visible: true,
          });
          snapIndicatorStartRef.current.getLayer()?.batchDraw();
        }
      }
    }

    drawStartRef.current = startPoint;

    if (tableDrawMode && previewRectRef.current) {
      previewRectRef.current.setAttrs({
        x: pointer.x,
        y: pointer.y,
        width: 0,
        height: 0,
        visible: true,
      });
      previewRectRef.current.getLayer()?.batchDraw();
    }

    if (lineDrawMode && previewLineRef.current) {
      previewLineRef.current.setAttrs({
        points: [startPoint.x, startPoint.y, startPoint.x, startPoint.y],
        visible: true,
      });
      previewLineRef.current.getLayer()?.batchDraw();
    }
  };

  const handleStageMouseMove = () => {
    if ((!tableDrawMode && !lineDrawMode) || !isDrawingRef.current) return;

    const pointer = stageRef.current?.getPointerPosition?.();
    if (!pointer || !drawStartRef.current) return;

    if (tableDrawMode) {
      const startX = drawStartRef.current.x;
      const startY = drawStartRef.current.y;
      const x = Math.min(startX, pointer.x);
      const y = Math.min(startY, pointer.y);
      const width = Math.max(1, Math.abs(pointer.x - startX));
      const height = Math.max(1, Math.abs(pointer.y - startY));

      if (previewRectRef.current) {
        previewRectRef.current.setAttrs({
          x,
          y,
          width,
          height,
          visible: true,
        });
        previewRectRef.current.getLayer()?.batchDraw();
      }
    }

    if (lineDrawMode) {
      const startX = drawStartRef.current.x;
      const startY = drawStartRef.current.y;

      // Check for snap to endpoint
      let endPoint = { x: pointer.x, y: pointer.y };
      const snapPoint = findNearestEndpoint(pointer.x, pointer.y);

      if (snapPoint) {
        endPoint = snapPoint;
        // Show snap indicator at end point
        if (snapIndicatorEndRef.current) {
          snapIndicatorEndRef.current.setAttrs({
            x: snapPoint.x,
            y: snapPoint.y,
            visible: true,
          });
          snapIndicatorEndRef.current.getLayer()?.batchDraw();
        }
      } else {
        // Hide snap indicator when not snapping
        if (snapIndicatorEndRef.current) {
          snapIndicatorEndRef.current.visible(false);
          snapIndicatorEndRef.current.getLayer()?.batchDraw();
        }
      }

      if (previewLineRef.current) {
        previewLineRef.current.setAttrs({
          points: [startX, startY, endPoint.x, endPoint.y],
          visible: true,
        });
        previewLineRef.current.getLayer()?.batchDraw();
      }
    }
  };

  const handleStageMouseUp = () => {
    if ((!tableDrawMode && !lineDrawMode) || !isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (tableDrawMode) {
      const previewRect = previewRectRef.current;
      if (!previewRect) return;

      const width = previewRect.width();
      const height = previewRect.height();
      const x = previewRect.x();
      const y = previewRect.y();

      if (width < 4 || height < 4) {
        previewRect.visible(false);
        previewRect.getLayer()?.batchDraw();
        return;
      }

      const id = getNextTableId(tables);
      const newTable = createTable({
        id,
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
        capacity: 4,
      });
      setTables((prevTables) => [...prevTables, newTable]);

      previewRect.visible(false);
      previewRect.getLayer()?.batchDraw();
    }

    if (lineDrawMode) {
      const previewLine = previewLineRef.current;
      if (!previewLine || !drawStartRef.current) return;

      const points = previewLine.points();
      if (points.length < 4) {
        previewLine.visible(false);
        previewLine.getLayer()?.batchDraw();
        // Hide snap indicators
        if (snapIndicatorStartRef.current) {
          snapIndicatorStartRef.current.visible(false);
          snapIndicatorStartRef.current.getLayer()?.batchDraw();
        }
        if (snapIndicatorEndRef.current) {
          snapIndicatorEndRef.current.visible(false);
          snapIndicatorEndRef.current.getLayer()?.batchDraw();
        }
        return;
      }

      // Check minimum line length
      const dx = points[2] - points[0];
      const dy = points[3] - points[1];
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length < 10) {
        previewLine.visible(false);
        previewLine.getLayer()?.batchDraw();
        // Hide snap indicators
        if (snapIndicatorStartRef.current) {
          snapIndicatorStartRef.current.visible(false);
          snapIndicatorStartRef.current.getLayer()?.batchDraw();
        }
        if (snapIndicatorEndRef.current) {
          snapIndicatorEndRef.current.visible(false);
          snapIndicatorEndRef.current.getLayer()?.batchDraw();
        }
        return;
      }

      const newLine: DrawnLine = {
        id: `line-${Date.now()}`,
        points: points.map(Math.round),
      };
      setLines((prevLines) => [...prevLines, newLine]);

      previewLine.visible(false);
      previewLine.getLayer()?.batchDraw();

      // Hide snap indicators
      if (snapIndicatorStartRef.current) {
        snapIndicatorStartRef.current.visible(false);
        snapIndicatorStartRef.current.getLayer()?.batchDraw();
      }
      if (snapIndicatorEndRef.current) {
        snapIndicatorEndRef.current.visible(false);
        snapIndicatorEndRef.current.getLayer()?.batchDraw();
      }
    }
  };

  return (
    <div className="p-4">
      <div className="mb-2 flex items-center gap-3">
        <DrawSquareButton isDrawing={tableDrawMode} onToggle={toggleDrawMode} />
        <DrawLineButton
          isDrawing={lineDrawMode}
          onToggle={toggleLineDrawMode}
        />
        <span className="ml-3 text-sm text-gray-600">
          Selected: {selectedId ?? "—"}
        </span>
      </div>

      <div
        ref={containerRef}
        className="w-full h-[420px] border border-gray-300"
      >
        {/* Stage requires explicit pixel width/height; we compute them from parent */}
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          style={{ display: "block" }}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
        >
          <Layer ref={layerRef}>
            {tables.map((table) => (
              <TableRect
                key={table.id}
                table={table}
                isSelected={selectedId === table.id}
                onSelect={(id) => setSelectedId(id)}
                onDragEnd={handleDragEnd}
              />
            ))}

            {/* Render completed lines */}
            {lines.map((line) => (
              <Line
                key={line.id}
                points={line.points}
                stroke="grey"
                strokeWidth={3}
                lineCap="round"
                lineJoin="round"
              />
            ))}

            {/* Preview rectangle: always rendered but hidden until used. */}
            <Rect
              ref={(node) => {
                previewRectRef.current = node;
              }}
              x={0}
              y={0}
              width={0}
              height={0}
              visible={false}
              stroke="#2563eb"
              dash={[6, 4]}
              strokeWidth={1}
              listening={false}
            />

            {/* Preview line: always rendered but hidden until used. */}
            <Line
              ref={(node) => {
                previewLineRef.current = node;
              }}
              points={[0, 0, 0, 0]}
              visible={false}
              stroke="grey"
              strokeWidth={3}
              dash={[6, 4]}
              lineCap="round"
              lineJoin="round"
              listening={false}
            />

            {/* Snap indicators for line endpoints */}
            <Circle
              ref={(node) => {
                snapIndicatorStartRef.current = node;
              }}
              x={0}
              y={0}
              radius={6}
              fill="#10b981"
              stroke="white"
              strokeWidth={2}
              visible={false}
              listening={false}
            />
            <Circle
              ref={(node) => {
                snapIndicatorEndRef.current = node;
              }}
              x={0}
              y={0}
              radius={6}
              fill="#10b981"
              stroke="white"
              strokeWidth={2}
              visible={false}
              listening={false}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
