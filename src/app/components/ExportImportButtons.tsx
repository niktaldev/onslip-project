"use client";

import type { Table } from "../../types/table";
import type { Line } from "../../types/line";

interface CanvasState {
  version: string;
  tables: Table[];
  lines: Line[];
}

interface ExportImportButtonsProps {
  tables: Table[];
  lines: Line[];
  onImport: (state: CanvasState) => void;
}

export default function ExportImportButtons({
  tables,
  lines,
  onImport,
}: ExportImportButtonsProps) {
  // Export canvas state to JSON
  const handleExport = () => {
    const canvasState: CanvasState = {
      version: "1.0",
      tables,
      lines,
    };

    const jsonString = JSON.stringify(canvasState, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `canvas-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import canvas state from JSON file
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const canvasState = JSON.parse(jsonString) as CanvasState;

        // Validate structure
        if (!canvasState.tables || !canvasState.lines) {
          alert("Invalid canvas file format");
          return;
        }

        // Call parent's import handler
        onImport(canvasState);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        alert("Failed to load canvas file. Please check the file format.");
      }
    };
    reader.readAsText(file);

    // Reset the input so the same file can be selected again
    event.target.value = "";
  };

  return (
    <div className="ml-auto flex items-center gap-2">
      <button
        onClick={handleExport}
        className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Export JSON
      </button>
      <label className="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors cursor-pointer">
        Import JSON
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </label>
    </div>
  );
}
