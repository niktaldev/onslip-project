import DrawSquareButton from "./DrawSquareButton";
import ExportImportButtons from "./ExportImportButtons";
import AddTablesForm, { type TableCreationConfig } from "./AddTablesForm";
import type { Table } from "../types/table";

interface StageControlsProps {
  tableDrawMode: boolean;
  onToggleTableDraw: () => void;
  tables: Table[];
  onImport: (canvasState: { tables: Table[] }) => void;
  selectedId: number | null;
  onDelete: () => void;
  onAddTables: (config: TableCreationConfig) => void;
}

export default function StageControls({
  tableDrawMode,
  onToggleTableDraw,
  tables,
  onImport,
  selectedId,
  onDelete,
  onAddTables,
}: StageControlsProps) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <AddTablesForm onAddTables={onAddTables} />
      <DrawSquareButton
        isDrawing={tableDrawMode}
        onToggle={onToggleTableDraw}
      />
      <button
        onClick={onDelete}
        disabled={!selectedId}
        className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        title="Delete selected item (Delete/Backspace)"
      >
        Delete
      </button>
      <span className="ml-3 text-sm text-gray-600">
        Selected: {selectedId ?? "—"}
      </span>
      <ExportImportButtons tables={tables} onImport={onImport} />
    </div>
  );
}
