"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Item {
  product?: number;
  "product-name": string;
  quantity: number;
  price?: number;
  type?: string;
}

interface ChairItemsListProps {
  items: Item[];
  onItemClick?: (item: Item, index: number) => void;
}

export default function ChairItemsList({
  items,
  onItemClick,
}: ChairItemsListProps) {
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0,
  );

  return (
    <div className="pt-2 border-t border-blue-300">
      <h4 className="font-semibold text-gray-800 mb-2">
        Items Timeline ({items.length})
      </h4>
      {items.length === 0 ? (
        <p className="text-gray-500 italic text-xs">
          No items added yet. Click a product below to add.
        </p>
      ) : (
        <>
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2 mb-3">
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => onItemClick?.(item, index)}
                  disabled={!onItemClick}
                  className={`shrink-0 w-32 bg-white p-3 rounded-lg border-2 border-blue-200 transition-all relative ${
                    onItemClick
                      ? "hover:border-blue-400 hover:shadow-md cursor-pointer"
                      : "cursor-default opacity-80"
                  }`}
                >
                  <div className="text-sm font-medium text-gray-800 truncate mb-1">
                    {item["product-name"]}
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    Qty: {item.quantity}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {((item.price || 0) * item.quantity).toFixed(2)} kr
                  </div>
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <div className="flex justify-between items-center pt-2 border-t border-blue-300 font-bold text-gray-900">
            <span>Total:</span>
            <span>{totalPrice.toFixed(2)} kr</span>
          </div>
        </>
      )}
    </div>
  );
}
