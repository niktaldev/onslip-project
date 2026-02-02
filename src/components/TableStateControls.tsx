"use client";

import { useState } from "react";
import {
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  tableName: string;
  currentState: string | null;
  isLocked?: boolean;
  capacity: number;
  minCapacity?: number;
  onToggleLock?: () => void;
  onPreviousState: () => void;
  onNextState: () => void;
  onCapacityChange: (maxCapacity: number, minCapacity: number) => void;
  onCopyTable: () => void;
  isStateLoading?: boolean;
};

export default function TableStateControls({
  tableName,
  currentState,
  isLocked = false,
  capacity,
  minCapacity = 2,
  onToggleLock,
  onPreviousState,
  onNextState,
  onCapacityChange,
  onCopyTable,
  isStateLoading = false,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [maxCapacityInput, setMaxCapacityInput] = useState(capacity.toString());
  const [minCapacityInput, setMinCapacityInput] = useState(
    minCapacity.toString(),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const maxCapacityNum = Number(maxCapacityInput);
    const minCapacityNum = Number(minCapacityInput);

    if (
      maxCapacityNum <= 0 ||
      minCapacityNum <= 0 ||
      isNaN(maxCapacityNum) ||
      isNaN(minCapacityNum)
    ) {
      alert("All values must be greater than 0");
      return;
    }

    if (minCapacityNum > maxCapacityNum) {
      alert("Min capacity cannot be greater than max capacity");
      return;
    }

    onCapacityChange(maxCapacityNum, minCapacityNum);
    setDialogOpen(false);
  };
  const displayState = currentState
    ? currentState.split(":")[1]?.replace(/_/g, " ")
    : "No state";

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg p-4 border border-gray-200 flex items-center gap-6">
      <div className="text-sm">
        <div className="font-semibold text-gray-700">{tableName}</div>
        <div className="text-gray-500 capitalize">{displayState}</div>
      </div>

      {/* State navigation buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onPreviousState}
          disabled={isStateLoading}
          className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Previous state"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onNextState}
          disabled={isStateLoading}
          className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Next state"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Capacity editor */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-600">Capacity:</span>
        <span className="text-sm font-medium text-gray-700">
          {minCapacity}-{capacity}
        </span>
        <button
          onClick={() => {
            setMaxCapacityInput(capacity.toString());
            setMinCapacityInput(minCapacity.toString());
            setDialogOpen(true);
          }}
          className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          title="Edit capacity"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>

      {/* Copy and Lock buttons */}
      <div className="flex gap-2">
        <button
          onClick={onCopyTable}
          className="p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          title="Copy table"
        >
          <Copy className="w-4 h-4" />
        </button>
        {onToggleLock && (
          <button
            onClick={onToggleLock}
            className={`p-2 rounded-md transition-colors ${
              isLocked
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            title={isLocked ? "Unlock table" : "Lock table"}
          >
            {isLocked ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Edit Capacity Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Capacity</DialogTitle>
            <DialogDescription>
              Set the minimum and maximum capacity for {tableName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Min Guests
                </label>
                <input
                  type="number"
                  value={minCapacityInput}
                  onChange={(e) => setMinCapacityInput(e.target.value)}
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Max Guests
                </label>
                <input
                  type="number"
                  value={maxCapacityInput}
                  onChange={(e) => setMaxCapacityInput(e.target.value)}
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-purple-500 hover:bg-purple-600"
              >
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
