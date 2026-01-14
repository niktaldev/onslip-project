"use client";

import { useState, useEffect } from "react";
import { createChair, getChair, getTableChairs } from "@/lib/chairs";
import type { Chair } from "@/types/table";
import { distributeChairPositions } from "@/lib/tableHelpers";

interface ChairDetails {
  id: number;
  name: string;
  created?: string;
}

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
  availablePositions?: number[];
}

export default function TableChairs({
  name,
  maxCapacity,
  width,
  height,
  orderId,
  currentState,
  availablePositions,
}: TableChairsProps) {
  const [chairs, setChairs] = useState<Map<number, Chair>>(new Map());
  const [chairDetails, setChairDetails] = useState<Map<number, ChairDetails>>(
    new Map()
  );
  const [selectedChair, setSelectedChair] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use availablePositions if provided, otherwise allow all positions up to maxCapacity
  const allowedPositions = availablePositions
    ? new Set(availablePositions)
    : new Set(Array.from({ length: maxCapacity }, (_, i) => i));

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

    // Check if this position is allowed
    if (!allowedPositions.has(position)) {
      alert("This chair position is not available for this table");
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

        // Set selected chair to show details below
        setSelectedChair(position);
      } else {
        // Check if we've reached max capacity before creating new chair
        if (chairs.size >= maxCapacity) {
          alert(
            `Maximum capacity reached (${maxCapacity} chairs). Remove an existing chair to add a new one.`
          );
          return;
        }

        // Chair doesn't exist - create new one
        const chairName = `${name}-Chair-${position + 1}`;
        await createChair(chairName, orderId, position);

        // Reload chairs to get the new chair with its ID
        await loadExistingChairs();
      }
    } catch (error) {
      console.error("Failed to handle chair click:", error);
      alert("Failed to handle chair action. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate chair positions around the table
  // Use maxPossiblePositions to show all possible positions
  const getChairPositions = () => {
    const positions = [];
    const distribution = distributeChairPositions(width, height);

    let chairIndex = 0;

    // Top-left to top diagonal
    for (let i = 0; i < distribution.topLeftToTop; i++) {
      positions.push({
        index: chairIndex++,
        side: "top-left-to-top",
        position: i,
        total: distribution.topLeftToTop,
      });
    }

    // Top chairs
    for (let i = 0; i < distribution.top; i++) {
      positions.push({
        index: chairIndex++,
        side: "top",
        position: i,
        total: distribution.top,
      });
    }

    // Top to top-right diagonal
    for (let i = 0; i < distribution.topToTopRight; i++) {
      positions.push({
        index: chairIndex++,
        side: "top-to-top-right",
        position: i,
        total: distribution.topToTopRight,
      });
    }

    // Top-right to right diagonal
    for (let i = 0; i < distribution.topRightToRight; i++) {
      positions.push({
        index: chairIndex++,
        side: "top-right-to-right",
        position: i,
        total: distribution.topRightToRight,
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

    // Right to bottom-right diagonal
    for (let i = 0; i < distribution.rightToBottomRight; i++) {
      positions.push({
        index: chairIndex++,
        side: "right-to-bottom-right",
        position: i,
        total: distribution.rightToBottomRight,
      });
    }

    // Bottom-right to bottom diagonal
    for (let i = 0; i < distribution.bottomRightToBottom; i++) {
      positions.push({
        index: chairIndex++,
        side: "bottom-right-to-bottom",
        position: i,
        total: distribution.bottomRightToBottom,
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

    // Bottom to bottom-left diagonal
    for (let i = 0; i < distribution.bottomToBottomLeft; i++) {
      positions.push({
        index: chairIndex++,
        side: "bottom-to-bottom-left",
        position: i,
        total: distribution.bottomToBottomLeft,
      });
    }

    // Bottom-left to left diagonal
    for (let i = 0; i < distribution.bottomLeftToLeft; i++) {
      positions.push({
        index: chairIndex++,
        side: "bottom-left-to-left",
        position: i,
        total: distribution.bottomLeftToLeft,
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

    // Left to top-left diagonal
    for (let i = 0; i < distribution.leftToTopLeft; i++) {
      positions.push({
        index: chairIndex++,
        side: "left-to-top-left",
        position: i,
        total: distribution.leftToTopLeft,
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
    const hasDetails = chairDetails.has(chairData.index);
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
      colorClasses = hasDetails
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
        onClick={() => handleChairClick(chairData.index)}
        disabled={isLoading || !isAvailable || (capacityReached && !isOccupied)}
        className={`${baseClasses} ${colorClasses} disabled:cursor-not-allowed`}
        title={titleText}
      >
        {displayText}
      </button>
    );
  };

  const chairPositions = getChairPositions();

  const topLeftToTop = chairPositions.filter(
    (c) => c.side === "top-left-to-top"
  );
  const topChairs = chairPositions.filter((c) => c.side === "top");
  const topToTopRight = chairPositions.filter(
    (c) => c.side === "top-to-top-right"
  );
  const topRightToRight = chairPositions.filter(
    (c) => c.side === "top-right-to-right"
  );
  const rightChairs = chairPositions.filter((c) => c.side === "right");
  const rightToBottomRight = chairPositions.filter(
    (c) => c.side === "right-to-bottom-right"
  );
  const bottomRightToBottom = chairPositions.filter(
    (c) => c.side === "bottom-right-to-bottom"
  );
  const bottomChairs = chairPositions.filter((c) => c.side === "bottom");
  const bottomToBottomLeft = chairPositions.filter(
    (c) => c.side === "bottom-to-bottom-left"
  );
  const bottomLeftToLeft = chairPositions.filter(
    (c) => c.side === "bottom-left-to-left"
  );
  const leftChairs = chairPositions.filter((c) => c.side === "left");
  const leftToTopLeft = chairPositions.filter(
    (c) => c.side === "left-to-top-left"
  );

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[300px] p-8 border border-gray-500 rounded-lg">
      {/* Top row: diagonal, top chairs, diagonal */}
      <div className="flex gap-2 mb-2">
        {topLeftToTop.map((chair) => renderChair(chair))}
        {topChairs.map((chair) => renderChair(chair))}
        {topToTopRight.map((chair) => renderChair(chair))}
      </div>

      {/* Middle section with left chairs, table, and right chairs */}
      <div className="flex items-center gap-2">
        {/* Left chairs */}
        <div className="flex flex-col gap-2">
          {leftToTopLeft.map((chair) => renderChair(chair))}
          {leftChairs.map((chair) => renderChair(chair))}
          {bottomLeftToLeft.map((chair) => renderChair(chair))}
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
          {topRightToRight.map((chair) => renderChair(chair))}
          {rightChairs.map((chair) => renderChair(chair))}
          {rightToBottomRight.map((chair) => renderChair(chair))}
        </div>
      </div>

      {/* Bottom row: diagonal, bottom chairs, diagonal */}
      <div className="flex gap-2 mt-2">
        {bottomToBottomLeft.map((chair) => renderChair(chair))}
        {bottomChairs.map((chair) => renderChair(chair))}
        {bottomRightToBottom.map((chair) => renderChair(chair))}
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
      {isLoading && (
        <div className="mt-2 text-sm text-blue-600">Loading...</div>
      )}

      {/* Chair Details Section */}
      {selectedChair !== null && chairDetails.has(selectedChair) && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg w-full max-w-md">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg text-gray-800">
              Chair Details
            </h3>
            <button
              onClick={() => setSelectedChair(null)}
              className="text-gray-500 hover:text-gray-700 text-xl leading-none"
              title="Close details"
            >
              ×
            </button>
          </div>
          {(() => {
            const details = chairDetails.get(selectedChair);
            if (!details) return null;
            return (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name: </span>
                  <span className="text-gray-600">{details.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">ID: </span>
                  <span className="text-gray-600">{details.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created: </span>
                  <span className="text-gray-600">
                    {details.created
                      ? new Date(details.created).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
