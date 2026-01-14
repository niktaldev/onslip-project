"use client";

import { useState, useEffect } from "react";
import {
  calculateMaxChairPositions,
  distributeChairPositions,
} from "@/lib/tableHelpers";

interface ChairPositionEditorProps {
  width: number;
  height: number;
  availablePositions: number[];
  onUpdate: (positions: number[]) => void;
}

export default function ChairPositionEditor({
  width,
  height,
  availablePositions,
  onUpdate,
}: ChairPositionEditorProps) {
  const [selectedPositions, setSelectedPositions] = useState<Set<number>>(
    new Set(availablePositions)
  );

  // Update local state when prop changes
  useEffect(() => {
    setSelectedPositions(new Set(availablePositions));
  }, [availablePositions]);

  // Calculate maximum possible positions based on table dimensions
  const maxPositions = calculateMaxChairPositions(width, height);
  const distribution = distributeChairPositions(width, height);

  const togglePosition = (position: number) => {
    const newPositions = new Set(selectedPositions);
    if (newPositions.has(position)) {
      newPositions.delete(position);
    } else {
      newPositions.add(position);
    }
    setSelectedPositions(newPositions);
    onUpdate(Array.from(newPositions).sort((a, b) => a - b));
  };

  const selectAll = () => {
    const allPositions = Array.from({ length: maxPositions }, (_, i) => i);
    setSelectedPositions(new Set(allPositions));
    onUpdate(allPositions);
  };

  const clearAll = () => {
    setSelectedPositions(new Set());
    onUpdate([]);
  };

  // Generate position arrays for each side
  const getPositionsForSide = (startIndex: number, count: number): number[] => {
    return Array.from({ length: count }, (_, i) => startIndex + i);
  };

  let currentIndex = 0;
  const topLeftToTop = getPositionsForSide(
    currentIndex,
    distribution.topLeftToTop
  );
  currentIndex += distribution.topLeftToTop;
  const topPositions = getPositionsForSide(currentIndex, distribution.top);
  currentIndex += distribution.top;
  const topToTopRight = getPositionsForSide(
    currentIndex,
    distribution.topToTopRight
  );
  currentIndex += distribution.topToTopRight;
  const topRightToRight = getPositionsForSide(
    currentIndex,
    distribution.topRightToRight
  );
  currentIndex += distribution.topRightToRight;
  const rightPositions = getPositionsForSide(currentIndex, distribution.right);
  currentIndex += distribution.right;
  const rightToBottomRight = getPositionsForSide(
    currentIndex,
    distribution.rightToBottomRight
  );
  currentIndex += distribution.rightToBottomRight;
  const bottomRightToBottom = getPositionsForSide(
    currentIndex,
    distribution.bottomRightToBottom
  );
  currentIndex += distribution.bottomRightToBottom;
  const bottomPositions = getPositionsForSide(
    currentIndex,
    distribution.bottom
  );
  currentIndex += distribution.bottom;
  const bottomToBottomLeft = getPositionsForSide(
    currentIndex,
    distribution.bottomToBottomLeft
  );
  currentIndex += distribution.bottomToBottomLeft;
  const bottomLeftToLeft = getPositionsForSide(
    currentIndex,
    distribution.bottomLeftToLeft
  );
  currentIndex += distribution.bottomLeftToLeft;
  const leftPositions = getPositionsForSide(currentIndex, distribution.left);
  currentIndex += distribution.left;
  const leftToTopLeft = getPositionsForSide(
    currentIndex,
    distribution.leftToTopLeft
  );

  const renderPositionButton = (position: number) => {
    const isSelected = selectedPositions.has(position);
    const baseClasses = `w-8 h-8 flex items-center justify-center border-2 rounded cursor-pointer transition-colors select-none text-xs font-semibold`;
    const colorClasses = isSelected
      ? "bg-green-500 border-green-700 text-white hover:bg-green-600"
      : "bg-gray-200 border-gray-400 text-gray-600 hover:bg-gray-300";

    return (
      <button
        key={position}
        onClick={() => togglePosition(position)}
        className={`${baseClasses} ${colorClasses}`}
        title={`Position ${position + 1}: ${
          isSelected ? "Enabled" : "Disabled"
        }`}
      >
        {position + 1}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center w-full p-6 border border-purple-300 rounded-lg bg-purple-50">
      <h3 className="text-lg font-semibold mb-2 text-gray-800">
        Edit Chair Positions
      </h3>
      <p className="text-sm text-gray-600 mb-4 text-center">
        Click positions to enable/disable. Green = available, Gray = disabled.
      </p>

      {/* Control buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={selectAll}
          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
        >
          Select All
        </button>
        <button
          onClick={clearAll}
          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Position visualization */}
      <div className="flex flex-col items-center">
        {/* Top row: all top positions */}
        <div className="flex gap-2 mb-2">
          {topLeftToTop.map((pos) => renderPositionButton(pos))}
          {topPositions.map((pos) => renderPositionButton(pos))}
          {topToTopRight.map((pos) => renderPositionButton(pos))}
        </div>

        {/* Middle: Left, Table, Right */}
        <div className="flex items-center gap-2">
          {/* Left positions */}
          <div className="flex flex-col gap-2">
            {leftToTopLeft.map((pos) => renderPositionButton(pos))}
            {leftPositions.map((pos) => renderPositionButton(pos))}
            {bottomLeftToLeft.map((pos) => renderPositionButton(pos))}
          </div>

          {/* Table representation */}
          <div
            className="flex flex-col justify-center items-center border-2 border-gray-400 rounded bg-gray-100 shadow-sm"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              minWidth: "100px",
              minHeight: "60px",
            }}
          >
            <span className="text-xs text-gray-600 font-semibold">TABLE</span>
            <span className="text-xs text-gray-500 mt-1">
              {width}×{height}
            </span>
          </div>

          {/* Right positions */}
          <div className="flex flex-col gap-2">
            {topRightToRight.map((pos) => renderPositionButton(pos))}
            {rightPositions.map((pos) => renderPositionButton(pos))}
            {rightToBottomRight.map((pos) => renderPositionButton(pos))}
          </div>
        </div>

        {/* Bottom row: all bottom positions */}
        <div className="flex gap-2 mt-2">
          {bottomToBottomLeft.map((pos) => renderPositionButton(pos))}
          {bottomPositions.map((pos) => renderPositionButton(pos))}
          {bottomRightToBottom.map((pos) => renderPositionButton(pos))}
        </div>
      </div>

      {/* Status info */}
      <div className="mt-4 text-sm text-gray-700">
        <span className="font-semibold">Selected:</span>{" "}
        {selectedPositions.size} / {maxPositions} positions
      </div>
    </div>
  );
}
