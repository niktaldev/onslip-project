"use client";

import { useState } from "react";

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
  id,
  name,
  maxCapacity,
  minCapacity,
  width,
  height,
  orderId,
  currentState,
  locked,
}: TableChairsProps) {
  const [occupiedChairs, setOccupiedChairs] = useState<Set<number>>(new Set());

  const toggleChair = (position: number) => {
    setOccupiedChairs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(position)) {
        newSet.delete(position);
      } else {
        newSet.add(position);
      }
      return newSet;
    });
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
    const isOccupied = occupiedChairs.has(chairData.index);
    const baseClasses = `w-8 h-8 flex items-center justify-center border-2 rounded cursor-pointer transition-colors select-none`;
    const colorClasses = isOccupied
      ? "bg-green-500 border-green-700 text-white"
      : "bg-gray-200 border-gray-400 text-gray-600 hover:bg-gray-300";

    return (
      <button
        key={chairData.index}
        onClick={() => toggleChair(chairData.index)}
        className={`${baseClasses} ${colorClasses}`}
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
          className="flex justify-center items-center border-2 border-amber-400 rounded bg-amber-50"
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          <span className="font-semibold text-lg">{name}</span>
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
        Occupied: {occupiedChairs.size} / {maxCapacity}
      </div>
    </div>
  );
}
