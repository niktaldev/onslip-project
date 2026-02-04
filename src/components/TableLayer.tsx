import { Layer, Transformer, Rect } from "react-konva";
import type Konva from "konva";
import type { Table } from "../types/table";
import TableRect from "./TableRect";

interface TableLayerProps {
  tables: Table[];
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  handleDragEnd: (id: number, x: number, y: number) => void;
  handleTransformEnd: (id: number) => void;
  tableRefs: React.MutableRefObject<Map<number, Konva.Group>>;
  transformerRef: React.MutableRefObject<Konva.Transformer | null>;
  previewRectRef?: React.MutableRefObject<Konva.Rect | null>;
}

export default function TableLayer({
  tables,
  selectedId,
  setSelectedId,
  handleDragEnd,
  handleTransformEnd,
  tableRefs,
  transformerRef,
  previewRectRef,
}: TableLayerProps) {
  return (
    <Layer>
      {tables.map((table) => (
        <TableRect
          key={table.id}
          table={table}
          isSelected={selectedId === table.id}
          onSelect={(id) => setSelectedId(id)}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
          shapeRef={(node) => {
            if (node) {
              tableRefs.current.set(table.id, node);
            } else {
              tableRefs.current.delete(table.id);
            }
          }}
        />
      ))}
      <Transformer
        ref={transformerRef}
        rotateEnabled={true}
        boundBoxFunc={(oldBox, newBox) => {
          // Limit resize
          if (newBox.width < 30 || newBox.height < 30) {
            return oldBox;
          }
          return newBox;
        }}
      />

      {/* Preview rectangle for table drawing */}
      <Rect
        ref={previewRectRef}
        stroke="#3b82f6"
        strokeWidth={2}
        dash={[10, 5]}
        fill="rgba(59, 130, 246, 0.1)"
        listening={false}
        visible={false}
      />
    </Layer>
  );
}
