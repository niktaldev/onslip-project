"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import type { Table } from "../types/table";
import TableChairs from "./TableChairs";
import ChairPositionEditor from "./ChairPositionEditor";
import { useState } from "react";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";

interface TableDialogProps {
  table: Table | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPreviousState: () => void;
  onNextState: () => void;
  isLoading?: boolean;
  onUpdateAvailablePositions?: (positions: number[]) => void;
  onOrderIdChange?: (newOrderId: number) => void;
}

export default function TableDialog({
  table,
  open,
  onOpenChange,
  onPreviousState,
  onNextState,
  isLoading,
  onUpdateAvailablePositions,
  onOrderIdChange,
}: TableDialogProps) {
  const [editingPositions, setEditingPositions] = useState(false);
  const [showTableInfo, setShowTableInfo] = useState(false);

  if (!table) return null;

  const displayState = table.currentState
    ? table.currentState.split(":")[1]?.replace(/_/g, " ")
    : "No state";

  const handleUpdatePositions = (positions: number[]) => {
    if (onUpdateAvailablePositions) {
      onUpdateAvailablePositions(positions);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Table {table.name}</DialogTitle>
          <DialogDescription>Table information and details</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          {/* State change controls */}

          <h3 className="font-semibold mb-3">Change State</h3>
          <div className="flex gap-2 mb-3">
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
          <Separator className="my-3" />
          {/* Toggle between chair management and position editor */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setEditingPositions(false)}
              className={`flex-1 px-4 py-2 rounded transition-colors ${
                !editingPositions
                  ? "bg-purple-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Manage Chairs
            </button>
            <button
              onClick={() => setEditingPositions(true)}
              className={`flex-1 px-4 py-2 rounded transition-colors ${
                editingPositions
                  ? "bg-purple-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Edit Positions
            </button>
          </div>

          {editingPositions ? (
            <ChairPositionEditor
              width={table.width}
              height={table.height}
              availablePositions={table.availablePositions || []}
              onUpdate={handleUpdatePositions}
            />
          ) : (
            <TableChairs
              id={table.id}
              name={table.name}
              maxCapacity={table.capacity}
              width={table.width}
              height={table.height}
              orderId={table.orderId}
              currentState={table.currentState}
              locked={table.locked}
              availablePositions={table.availablePositions}
              onOrderIdChange={onOrderIdChange}
            />
          )}

          {/* Table Information Button */}
          <Button
            onClick={() => setShowTableInfo(true)}
            variant="outline"
            className="w-full mt-4 flex items-center justify-center gap-2"
          >
            <Info className="w-4 h-4" />
            View Table Information
          </Button>
        </ScrollArea>
      </DialogContent>

      {/* Table Information Dialog */}
      <Dialog open={showTableInfo} onOpenChange={setShowTableInfo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Table Information</DialogTitle>
            <DialogDescription>
              Details for table {table.name}
            </DialogDescription>
          </DialogHeader>

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
    </Dialog>
  );
}
