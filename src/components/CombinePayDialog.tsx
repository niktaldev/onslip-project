"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  distributeChairPositions,
  calculateMaxChairPositions,
} from "@/lib/tableHelpers";
import type { Chair } from "@/types/table";

interface CombinePayDialogProps {
  isOpen: boolean;
  occupiedChairs: Map<number, Chair>;
  tableName: string;
  tableWidth: number;
  tableHeight: number;
  currentState?: string;
  allowedPositions: Set<number>;
  onClose: () => void;
  onConfirm: (chairIds: number[]) => void;
}

export default function CombinePayDialog({
  isOpen,
  occupiedChairs,
  tableName,
  tableWidth,
  tableHeight,
  currentState,
  allowedPositions,
  onClose,
  onConfirm,
}: CombinePayDialogProps) {
  const [selectedChairs, setSelectedChairs] = useState<Set<number>>(new Set());
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);

  // Map state names to colors
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

  const stateColor = getStateColor(currentState);

  const toggleChair = (position: number) => {
    const chair = occupiedChairs.get(position);
    if (!chair) return;

    setSelectedChairs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chair.chairId)) {
        newSet.delete(chair.chairId);
      } else {
        newSet.add(chair.chairId);
      }
      return newSet;
    });
  };

  const selectAllChairs = () => {
    const allChairIds = new Set<number>();
    occupiedChairs.forEach((chair) => {
      allChairIds.add(chair.chairId);
    });
    setSelectedChairs(allChairIds);
  };

  const clearSelection = () => {
    setSelectedChairs(new Set());
  };

  // Calculate chair positions around the table
  const getChairPositions = () => {
    const positions = [];
    const distribution = distributeChairPositions(tableWidth, tableHeight);
    const maxPositions = calculateMaxChairPositions(tableWidth, tableHeight);

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

    return positions.slice(0, maxPositions);
  };

  const chairPositions = getChairPositions();

  const topChairs = chairPositions.filter((c) => c.side === "top");
  const rightChairs = chairPositions.filter((c) => c.side === "right");
  const bottomChairs = chairPositions.filter((c) => c.side === "bottom");
  const leftChairs = chairPositions.filter((c) => c.side === "left");

  const renderChair = (chairInfo: {
    index: number;
    side: string;
    position: number;
    total: number;
  }) => {
    const chair = occupiedChairs.get(chairInfo.index);
    const isOccupied = chair !== undefined;
    const isSelected = chair ? selectedChairs.has(chair.chairId) : false;
    const isAvailable = allowedPositions.has(chairInfo.index);
    const isPaid = chair?.name?.startsWith("[PAID-") || false;
    const canSelect = isOccupied && isAvailable && !isPaid;

    const baseClasses =
      "w-8 h-8 flex items-center justify-center border-2 rounded transition-colors select-none text-xs font-semibold";

    let colorClasses = "";
    let cursorClass = "";

    if (!isAvailable) {
      colorClasses = "bg-gray-100 border-gray-300 text-gray-400";
      cursorClass = "cursor-not-allowed";
    } else if (isPaid) {
      colorClasses = "bg-purple-400 border-purple-600 text-white";
      cursorClass = "cursor-not-allowed";
    } else if (isSelected) {
      colorClasses =
        "bg-green-500 border-green-700 text-white hover:bg-green-600";
      cursorClass = "cursor-pointer";
    } else if (isOccupied) {
      colorClasses = "bg-blue-400 border-blue-600 text-white hover:bg-blue-500";
      cursorClass = "cursor-pointer";
    } else {
      colorClasses = "bg-gray-200 border-gray-400 text-gray-600";
      cursorClass = "cursor-not-allowed";
    }

    return (
      <button
        key={chairInfo.index}
        onClick={() => canSelect && toggleChair(chairInfo.index)}
        disabled={!canSelect}
        className={`${baseClasses} ${colorClasses} ${cursorClass} ${!canSelect ? "opacity-60" : ""}`}
        title={
          !isAvailable
            ? `Position ${chairInfo.index + 1} - Not available`
            : isPaid
              ? `Chair ${chairInfo.index + 1} - Already paid`
              : isOccupied
                ? `Chair ${chairInfo.index + 1}${isSelected ? " - Selected" : " - Click to select"}`
                : `Position ${chairInfo.index + 1} - Empty`
        }
      >
        {!isAvailable
          ? "–"
          : isPaid
            ? "✓"
            : isOccupied
              ? chairInfo.index + 1
              : "–"}
      </button>
    );
  };

  const handlePayClick = () => {
    if (selectedChairs.size < 1) {
      alert("Please select at least 1 chair to process payment");
      return;
    }
    setShowConfirmAlert(true);
  };

  const handleConfirmPay = () => {
    onConfirm(Array.from(selectedChairs));
    setShowConfirmAlert(false);
    setSelectedChairs(new Set());
    onClose();
  };

  const handleClose = () => {
    setSelectedChairs(new Set());
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Select one or more chairs to process payment. Multiple chairs will
              be combined into one tab.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={selectAllChairs}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Select All
              </Button>
              <Button
                onClick={clearSelection}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Clear Selection
              </Button>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Select chairs to combine
              </label>

              {occupiedChairs.size === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8 border rounded-md bg-gray-50">
                  No occupied chairs available
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full p-6 border border-purple-300 rounded-lg bg-purple-50">
                  {/* Visual Table Layout */}
                  <div className="flex flex-col items-center">
                    {/* Top chairs */}
                    <div className="flex gap-2 mb-2">
                      {topChairs.map((chairInfo) => renderChair(chairInfo))}
                    </div>

                    {/* Middle row with left chairs, table, and right chairs */}
                    <div className="flex items-center gap-2">
                      {/* Left chairs */}
                      <div className="flex flex-col gap-2">
                        {leftChairs.map((chairInfo) => renderChair(chairInfo))}
                      </div>

                      {/* Table */}
                      <div
                        className={`flex flex-col justify-center items-center border-2 border-gray-400 rounded ${stateColor} shadow-sm`}
                        style={{
                          width: `${tableWidth}px`,
                          height: `${tableHeight}px`,
                          minWidth: "100px",
                          minHeight: "60px",
                        }}
                      >
                        <span className="font-semibold text-lg text-gray-800">
                          {tableName}
                        </span>
                      </div>

                      {/* Right chairs */}
                      <div className="flex flex-col gap-2">
                        {rightChairs.map((chairInfo) => renderChair(chairInfo))}
                      </div>
                    </div>

                    {/* Bottom chairs */}
                    <div className="flex gap-2 mt-2">
                      {bottomChairs.map((chairInfo) => renderChair(chairInfo))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="mt-4 pt-3 border-t border-purple-400 flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 border-2 rounded bg-blue-400 border-blue-600"></div>
                      <span className="font-medium">Available</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 border-2 rounded bg-green-500 border-green-700"></div>
                      <span className="font-medium">Selected</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 border-2 rounded bg-gray-200 border-gray-400"></div>
                      <span className="font-medium">Empty</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedChairs.size > 0 && (
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">
                    {selectedChairs.size} chair
                    {selectedChairs.size !== 1 ? "s" : ""} selected
                  </span>
                  {selectedChairs.size >= 1 && (
                    <span className="ml-2 text-green-700">
                      ✓ Ready to{" "}
                      {selectedChairs.size > 1 ? "combine and pay" : "pay"}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handlePayClick}
              disabled={selectedChairs.size < 1}
              className="bg-green-600 hover:bg-green-700"
            >
              {selectedChairs.size > 1 ? "Pay & Combine" : "Pay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Alert */}
      <AlertDialog open={showConfirmAlert} onOpenChange={setShowConfirmAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedChairs.size > 1
                ? "Confirm Payment & Combination"
                : "Confirm Payment"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedChairs.size > 1
                ? `You are about to combine ${selectedChairs.size} chairs and process payment. All items will be merged into one tab and the other tabs will be closed. This action cannot be undone.`
                : "You are about to process payment for this chair. The tab will be marked as paid and closed. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmAlert(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPay}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm & Pay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
