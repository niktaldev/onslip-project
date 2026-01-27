"use client";

import type { Chair } from "@/types/table";
import { distributeChairPositions } from "@/lib/tableHelpers";

interface ChairGridProps {
  name: string;
  width: number;
  height: number;
  maxCapacity: number;
  chairs: Map<number, Chair>;
  selectedChairs: Set<number>;
  allowedPositions: Set<number>;
  currentState?: string;
  isLoading: boolean;
  onChairClick: (position: number) => void;
}

export default function ChairGrid({
  name,
  width,
  height,
  maxCapacity,
  chairs,
  selectedChairs,
  allowedPositions,
  currentState,
  isLoading,
  onChairClick,
}: ChairGridProps) {
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

  // Calculate chair positions around the table
  const getChairPositions = () => {
    const positions = [];
    const distribution = distributeChairPositions(width, height);

    let chairIndex = 0;

    // Top chairs
    for (let i = 0; i < distribution.top; i++) {
      positions.push({
        index: chairIndex++,
        side: "top",
        position: i,
        total: distribution.top,
      });
    }

    // Right chairs
    for (let i = 0; i < distribution.right; i++) {
      positions.push({
        index: chairIndex++,
        side: "right",
        position: i,
        total: distribution.right,
      });
    }

    // Bottom chairs
    for (let i = 0; i < distribution.bottom; i++) {
      positions.push({
        index: chairIndex++,
        side: "bottom",
        position: i,
        total: distribution.bottom,
      });
    }

    // Left chairs
    for (let i = 0; i < distribution.left; i++) {
      positions.push({
        index: chairIndex++,
        side: "left",
        position: i,
        total: distribution.left,
      });
    }

    return positions;
  };

  const renderChair = (chairData: {
    index: number;
    side: string;
    position: number;
    total: number;
  }) => {
    const chair = chairs.get(chairData.index);
    const isSelected = selectedChairs.has(chairData.index);
    const isOccupied = chair !== undefined;
    const isAvailable = allowedPositions.has(chairData.index);
    const capacityReached = chairs.size >= maxCapacity;

    // Different styling based on availability and occupancy
    const baseClasses = `w-8 h-8 flex items-center justify-center border-2 rounded cursor-pointer transition-colors select-none`;

    let colorClasses = "";
    let displayText = "";
    let titleText = "";

    if (!isAvailable) {
      // Position not available - grayed out and disabled
      colorClasses =
        "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-50";
      displayText = "–";
      titleText = "Position not available";
    } else if (isOccupied) {
      // Occupied position - green or blue
      colorClasses = isSelected
        ? "bg-blue-500 border-blue-700 text-white"
        : "bg-green-500 border-green-700 text-white";
      displayText = "O";
      titleText = chair
        ? `Chair: ${chair.name} (click to view details)`
        : "Occupied";
    } else if (capacityReached) {
      // Available position but capacity is full - yellowish warning
      colorClasses =
        "bg-yellow-100 border-yellow-400 text-yellow-700 cursor-not-allowed opacity-60";
      displayText = "X";
      titleText = `Capacity full (${chairs.size}/${maxCapacity}). Remove a chair to add here.`;
    } else {
      // Available and can be occupied
      colorClasses =
        "bg-gray-200 border-gray-400 text-gray-600 hover:bg-gray-300";
      displayText = "X";
      titleText = "Click to add chair";
    }

    return (
      <button
        key={chairData.index}
        onClick={() => onChairClick(chairData.index)}
        disabled={isLoading || !isAvailable || (capacityReached && !isOccupied)}
        className={`${baseClasses} ${colorClasses} disabled:cursor-not-allowed`}
        title={titleText}
      >
        {displayText}
      </button>
    );
  };

  const chairPositions = getChairPositions();

  const topChairs = chairPositions.filter((c) => c.side === "top");
  const rightChairs = chairPositions.filter((c) => c.side === "right");
  const bottomChairs = chairPositions.filter((c) => c.side === "bottom");
  const leftChairs = chairPositions.filter((c) => c.side === "left");

  return (
    <div className="flex flex-col items-center justify-center w-full">
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

      {/* Status info and legend */}
      <div className="mt-4 space-y-2">
        <div className="text-sm text-gray-600 font-semibold">
          Occupied: {chairs.size} / {maxCapacity} max capacity (
          {allowedPositions.size} positions available)
        </div>
        <div className="flex gap-4 text-xs text-gray-600 flex-wrap justify-center">
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 bg-green-500 border border-green-700 rounded"></span>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 bg-gray-200 border border-gray-400 rounded"></span>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 bg-yellow-100 border border-yellow-400 rounded"></span>
            <span>Full capacity</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 bg-gray-100 border border-gray-300 rounded opacity-50"></span>
            <span>Disabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
