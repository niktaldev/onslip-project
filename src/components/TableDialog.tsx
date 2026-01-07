"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Table } from "../types/table";
import TableChairs from "./TableChairs";

interface TableDialogProps {
  table: Table | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPreviousState: () => void;
  onNextState: () => void;
  isLoading?: boolean;
}

export default function TableDialog({
  table,
  open,
  onOpenChange,
  onPreviousState,
  onNextState,
  isLoading,
}: TableDialogProps) {
  if (!table) return null;

  const displayState = table.currentState
    ? table.currentState.split(":")[1]?.replace(/_/g, " ")
    : "No state";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Table {table.name}</DialogTitle>
          <DialogDescription>Table information and details</DialogDescription>
        </DialogHeader>
        <TableChairs
          id={table.id}
          name={table.name}
          maxCapacity={table.capacity}
          width={table.width}
          height={table.height}
          orderId={table.orderId}
          currentState={table.currentState}
          locked={table.locked}
        />
        {/* State change controls */}

        <h3 className="font-semibold mb-3">Change State</h3>
        <div className="flex gap-2">
          <button
            onClick={onPreviousState}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Previous state"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            onClick={onNextState}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Next state"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">ID:</h3>
            <p>{table.id}</p>
          </div>
          <div>
            <h3 className="font-semibold">Name:</h3>
            <p>{table.name}</p>
          </div>
          <div>
            <h3 className="font-semibold">Position:</h3>
            <p>
              X: {Math.round(table.x)}, Y: {Math.round(table.y)}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Size:</h3>
            <p>
              Width: {Math.round(table.width)}, Height:{" "}
              {Math.round(table.height)}
            </p>
          </div>
          {table.rotation !== undefined && table.rotation !== 0 && (
            <div>
              <h3 className="font-semibold">Rotation:</h3>
              <p>{Math.round(table.rotation)}°</p>
            </div>
          )}
          <div>
            <h3 className="font-semibold">Capacity:</h3>
            <p>{table.capacity || "—"}</p>
          </div>
          <div>
            <h3 className="font-semibold">Current State:</h3>
            <p className="capitalize">{displayState}</p>
          </div>
          <div>
            <h3 className="font-semibold">Locked:</h3>
            <p>{table.locked ? "Yes" : "No"}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
