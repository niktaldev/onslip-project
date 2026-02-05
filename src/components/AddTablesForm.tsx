"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AddTablesFormProps {
  onAddTables: (config: TableCreationConfig) => void;
}

export interface TableCreationConfig {
  width: number;
  height: number;
  maxCapacity: number;
  minCapacity: number;
  count: number;
}

export default function AddTablesForm({ onAddTables }: AddTablesFormProps) {
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState("120");
  const [height, setHeight] = useState("80");
  const [maxCapacity, setMaxCapacity] = useState("4");
  const [minCapacity, setMinCapacity] = useState("2");
  const [count, setCount] = useState("1");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert to numbers
    const widthNum = Number(width);
    const heightNum = Number(height);
    const maxCapacityNum = Number(maxCapacity);
    const minCapacityNum = Number(minCapacity);
    const countNum = Number(count);

    // Validate inputs
    if (
      widthNum <= 0 ||
      heightNum <= 0 ||
      maxCapacityNum <= 0 ||
      minCapacityNum <= 0 ||
      countNum <= 0 ||
      isNaN(widthNum) ||
      isNaN(heightNum) ||
      isNaN(maxCapacityNum) ||
      isNaN(minCapacityNum) ||
      isNaN(countNum)
    ) {
      setValidationError("All values must be greater than 0");
      return;
    }

    if (minCapacityNum > maxCapacityNum) {
      setValidationError("Min capacity cannot be greater than max capacity");
      return;
    }

    onAddTables({
      width: widthNum,
      height: heightNum,
      maxCapacity: maxCapacityNum,
      minCapacity: minCapacityNum,
      count: countNum,
    });

    // Reset form and close
    setValidationError(null);
    setWidth("120");
    setHeight("80");
    setMaxCapacity("4");
    setMinCapacity("2");
    setCount("1");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-purple-500 hover:bg-purple-600">
          Add Tables
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Tables</DialogTitle>
          <DialogDescription>
            Create multiple tables with the same specifications
          </DialogDescription>
        </DialogHeader>

        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Width (cm)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                min="30"
                max="500"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                min="30"
                max="500"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Min Guests
              </label>
              <input
                type="number"
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
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
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                min="1"
                max="20"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Number of Tables
            </label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              min="1"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-purple-500 hover:bg-purple-600">
              Create Tables
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
