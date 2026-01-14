import type { Table } from "../types/table";

/**
 * Return next available numeric table ID.
 */
export function getNextTableId(tables: Table[]): number {
  if (tables.length === 0) return 1;
  const maxId = Math.max(...tables.map((t) => t.id));
  return maxId + 1;
}

/**
 * Generate a table name based on the ID.
 * Example: 1 -> "T-1", 2 -> "T-2"
 */
export function getTableName(id: number, prefix: string = "T-"): string {
  return `${prefix}${id}`;
}

/**
 * Calculate the maximum number of chair positions that can fit around a table
 * based on its dimensions. Uses generous spacing to provide many position options.
 * This creates a "zone" around the table where chairs could potentially be placed,
 * including diagonal positions.
 */
export function calculateMaxChairPositions(
  width: number,
  height: number
): number {
  const chairSpacing = 45; // Space needed per chair in pixels (cm) - generous spacing

  // Calculate chairs that fit along each dimension
  const topBottomChairs = Math.max(1, Math.floor(width / chairSpacing));
  const leftRightChairs = Math.max(1, Math.floor(height / chairSpacing));

  // Calculate diagonal positions (1 per corner area, only if there's space)
  const topDiagonals = topBottomChairs > 1 ? 2 : 0; // top-left-to-top, top-to-top-right
  const rightDiagonals = leftRightChairs > 1 ? 2 : 0; // top-right-to-right, right-to-bottom-right
  const bottomDiagonals = topBottomChairs > 1 ? 2 : 0; // bottom-right-to-bottom, bottom-to-bottom-left
  const leftDiagonals = leftRightChairs > 1 ? 2 : 0; // bottom-left-to-left, left-to-top-left

  // Total positions: top + right + bottom + left + diagonal transitions
  return (
    topBottomChairs * 2 +
    leftRightChairs * 2 +
    topDiagonals +
    rightDiagonals +
    bottomDiagonals +
    leftDiagonals
  );
}

/**
 * Distribute chair positions around a table based on actual dimensions.
 * Returns the positions organized by side and transitional positions.
 */
export function distributeChairPositions(
  width: number,
  height: number
): {
  topLeftToTop: number;
  top: number;
  topToTopRight: number;
  topRightToRight: number;
  right: number;
  rightToBottomRight: number;
  bottomRightToBottom: number;
  bottom: number;
  bottomToBottomLeft: number;
  bottomLeftToLeft: number;
  left: number;
  leftToTopLeft: number;
} {
  const chairSpacing = 45; // Must match the spacing used in calculateMaxChairPositions

  // Calculate chairs for horizontal sides (top and bottom) - based on width
  const horizontalChairs = Math.max(1, Math.floor(width / chairSpacing));

  // Calculate chairs for vertical sides (left and right) - based on height
  const verticalChairs = Math.max(1, Math.floor(height / chairSpacing));

  // Only add diagonal positions if there's more than 1 position on that dimension
  const hasHorizontalDiagonals = horizontalChairs > 1;
  const hasVerticalDiagonals = verticalChairs > 1;

  return {
    topLeftToTop: hasHorizontalDiagonals && hasVerticalDiagonals ? 1 : 0,
    top: horizontalChairs,
    topToTopRight: hasHorizontalDiagonals && hasVerticalDiagonals ? 1 : 0,
    topRightToRight: hasHorizontalDiagonals && hasVerticalDiagonals ? 1 : 0,
    right: verticalChairs,
    rightToBottomRight: hasHorizontalDiagonals && hasVerticalDiagonals ? 1 : 0,
    bottomRightToBottom: hasHorizontalDiagonals && hasVerticalDiagonals ? 1 : 0,
    bottom: horizontalChairs,
    bottomToBottomLeft: hasHorizontalDiagonals && hasVerticalDiagonals ? 1 : 0,
    bottomLeftToLeft: hasHorizontalDiagonals && hasVerticalDiagonals ? 1 : 0,
    left: verticalChairs,
    leftToTopLeft: hasHorizontalDiagonals && hasVerticalDiagonals ? 1 : 0,
  };
}

/**
 * Calculate non-overlapping positions for multiple tables.
 * Places tables in a grid layout with spacing.
 */
export function calculateTablePositions(
  count: number,
  width: number,
  height: number,
  startX: number = 50,
  startY: number = 50,
  spacing: number = 20
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];

  // Calculate grid dimensions
  // Try to make roughly square layout
  const cols = Math.ceil(Math.sqrt(count));

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const x = startX + col * (width + spacing);
    const y = startY + row * (height + spacing);

    positions.push({ x, y });
  }

  return positions;
}
