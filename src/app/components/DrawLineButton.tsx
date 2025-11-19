import { Button } from "@/components/ui/button";

type Props = {
  isDrawing: boolean;
  onToggle: () => void;
};

export default function DrawLineButton({ isDrawing, onToggle }: Props) {
  return (
    <Button
      aria-pressed={isDrawing}
      onClick={onToggle}
      className={isDrawing ? "bg-blue-600" : ""}
    >
      {isDrawing ? "Drawing: Click & drag to draw line" : "Draw Line"}
    </Button>
  );
}
