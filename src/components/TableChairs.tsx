"use client";

import { useState, useEffect } from "react";
import { createChair, getChair, getTableChairs } from "@/lib/chairs";
import type { Chair } from "@/types/table";

interface TableChairsProps {
  id: number;
  name: string;
  maxCapacity: number;
  minCapacity?: number;
  width: number;
  height: number;
  orderId?: number;
  currentState?: string;
  locked?: boolean;
}

export default function TableChairs({
  name,
  maxCapacity,
  width,
  height,
  orderId,
  currentState,
}: TableChairsProps) {
  const [chairs, setChairs] = useState<Map<number, Chair>>(new Map());
  const [chairDetails, setChairDetails] = useState<Map<number, unknown>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(false);

  // Map state names to colors (same as canvas)
  const getStateColor = (state?: string): string => {
    if (!state) return "bg-gray-100";

    const stateKey = state.split(":")[1]?.toLowerCase();

    const colorMap: Record<string, string> = {
      ready: "bg-green-300",
      guest_arrived: "bg-yellow-300",
      drinks_ordered: "bg-amber-400",
      drinks_served: "bg-orange-400",
      food_ordered: "bg-orange-500",
      food_served: "bg-amber-500",
      bill_requested: "bg-red-300",
      paid: "bg-purple-400",
      uncleaned: "bg-red-400",
      cleaned: "bg-blue-400",
    };

    return colorMap[stateKey] ?? "bg-gray-100";
  };

  // Format state text for display
  const displayState = currentState
    ? currentState.split(":")[1]?.replace(/_/g, " ")
    : "";
  const stateColor = getStateColor(currentState);

  const loadExistingChairs = async () => {
    if (!orderId) return;

    try {
      const existingChairs = await getTableChairs(orderId);

      if (!existingChairs || existingChairs.length === 0) {
        setChairs(new Map());
        return;
      }

      const chairMap = new Map<number, Chair>();

      existingChairs.forEach(
        (chair: { id: number; name?: string; labelNames?: string[] }) => {
          if (chair && chair.id) {
            // Extract position from label names (format: "chair-position-{position}")
            let position = 0;
            if (chair.labelNames && chair.labelNames.length > 0) {
              const positionLabel = chair.labelNames.find((labelName: string) =>
                labelName.startsWith("chair-position-")
              );
              if (positionLabel) {
                position = parseInt(
                  positionLabel.replace("chair-position-", ""),
                  10
                );
              }
            }

            chairMap.set(position, {
              chairId: chair.id,
              position: position,
              orderId: orderId,
              name: chair.name,
            });
          }
        }
      );

      setChairs(chairMap);
    } catch (error) {
      console.error("Failed to load existing chairs:", error);
      setChairs(new Map());
    }
  };

  // Load existing chairs when component mounts
  useEffect(() => {
    if (orderId) {
      loadExistingChairs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleChairClick = async (position: number) => {
    if (!orderId) {
      alert("Table must have an orderId to manage chairs");
      return;
    }

    setIsLoading(true);

    try {
      const existingChair = chairs.get(position);

      if (existingChair) {
        // Chair exists - fetch and display details
        const details = await getChair(existingChair.chairId);

        if (!details) {
          alert("Chair not found. It may have been deleted.");
          await loadExistingChairs();
          return;
        }

        setChairDetails((prev) => {
          const newMap = new Map(prev);
          newMap.set(position, details);
          return newMap;
        });

        // Show chair details
        alert(
          `Chair Details:\nName: ${details.name}\nID: ${details.id}\nCreated: ${details.created}`
        );
      } else {
        // Chair doesn't exist - create new one
        const chairName = `${name}-Chair-${position + 1}`;
        await createChair(chairName, orderId, position);

        // Reload chairs to get the new chair with its ID
        await loadExistingChairs();

        alert(`Created new chair: ${chairName}`);
      }
    } catch (error) {
      console.error("Failed to handle chair click:", error);
      alert("Failed to handle chair action. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate chair positions around the table
  const getChairPositions = () => {
    const positions = [];
    const chairsPerSide = Math.ceil(maxCapacity / 4);
    const top = Math.min(chairsPerSide, Math.ceil(maxCapacity / 4));
    const right = Math.min(chairsPerSide, Math.ceil((maxCapacity - top) / 3));
    const bottom = Math.min(
      chairsPerSide,
      Math.ceil((maxCapacity - top - right) / 2)
    );
    const left = maxCapacity - top - right - bottom;

    let chairIndex = 0;

    // Top chairs
    for (let i = 0; i < top; i++) {
      positions.push({
        index: chairIndex++,
        side: "top",
        position: i,
        total: top,
      });
    }

    // Right chairs
    for (let i = 0; i < right; i++) {
      positions.push({
        index: chairIndex++,
        side: "right",
        position: i,
        total: right,
      });
    }

    // Bottom chairs
    for (let i = 0; i < bottom; i++) {
      positions.push({
        index: chairIndex++,
        side: "bottom",
        position: i,
        total: bottom,
      });
    }

    // Left chairs
    for (let i = 0; i < left; i++) {
      positions.push({
        index: chairIndex++,
        side: "left",
        position: i,
        total: left,
      });
    }

    return positions;
  };

  const chairPositions = getChairPositions();

  const renderChair = (chairData: {
    index: number;
    side: string;
    position: number;
    total: number;
  }) => {
    const chair = chairs.get(chairData.index);
    const hasDetails = chairDetails.has(chairData.index);
    const isOccupied = chair !== undefined;

    const baseClasses = `w-8 h-8 flex items-center justify-center border-2 rounded cursor-pointer transition-colors select-none`;
    const colorClasses = isOccupied
      ? hasDetails
        ? "bg-blue-500 border-blue-700 text-white"
        : "bg-green-500 border-green-700 text-white"
      : "bg-gray-200 border-gray-400 text-gray-600 hover:bg-gray-300";

    return (
      <button
        key={chairData.index}
        onClick={() => handleChairClick(chairData.index)}
        disabled={isLoading}
        className={`${baseClasses} ${colorClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
        title={chair ? `Chair: ${chair.name}` : "Create new chair"}
      >
        {isOccupied ? "O" : "X"}
      </button>
    );
  };

  const topChairs = chairPositions.filter((c) => c.side === "top");
  const rightChairs = chairPositions.filter((c) => c.side === "right");
  const bottomChairs = chairPositions.filter((c) => c.side === "bottom");
  const leftChairs = chairPositions.filter((c) => c.side === "left");

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[300px] p-8 border border-gray-500 rounded-lg">
      {/* Top chairs */}
      <div className="flex gap-2 mb-2">
        {topChairs.map((chair) => renderChair(chair))}
      </div>

      {/* Middle section with left chairs, table, and right chairs */}
      <div className="flex items-center gap-2">
        {/* Left chairs */}
        <div className="flex flex-col gap-2">
          {leftChairs.map((chair) => renderChair(chair))}
        </div>

        {/* Table */}
        <div
          className={`flex flex-col justify-center items-center border-2 border-gray-400 rounded ${stateColor} shadow-sm`}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            minHeight: "80px",
          }}
        >
          <span className="font-semibold text-lg text-gray-800">{name}</span>
          {displayState && (
            <span className="text-sm text-gray-700 mt-1 capitalize">
              {displayState}
            </span>
          )}
        </div>

        {/* Right chairs */}
        <div className="flex flex-col gap-2">
          {rightChairs.map((chair) => renderChair(chair))}
        </div>
      </div>

      {/* Bottom chairs */}
      <div className="flex gap-2 mt-2">
        {bottomChairs.map((chair) => renderChair(chair))}
      </div>

      {/* Status info */}
      <div className="mt-4 text-sm text-gray-600">
        Occupied: {chairs.size} / {maxCapacity}
      </div>
      {isLoading && (
        <div className="mt-2 text-sm text-blue-600">Loading...</div>
      )}
    </div>
  );
}
