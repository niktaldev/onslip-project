"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Item {
  product?: number;
  "product-name": string;
  quantity: number;
  price?: number;
  type?: string;
}

interface Product {
  id: number;
  name: string;
  price?: number;
  description?: string;
  productGroup?: string;
  "product-group"?: number;
}

interface ItemDetailsDialogProps {
  item: Item | null;
  productDetails: Product | null;
  onClose: () => void;
}

export default function ItemDetailsDialog({
  item,
  productDetails,
  onClose,
}: ItemDetailsDialogProps) {
  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Item Details</DialogTitle>
          <DialogDescription>{item?.["product-name"]}</DialogDescription>
        </DialogHeader>

        {item && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Quantity
                </label>
                <p className="text-gray-900">{item.quantity}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Unit Price
                </label>
                <p className="text-gray-900">
                  {(item.price || 0).toFixed(2)} kr
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Total Price
              </label>
              <p className="text-gray-900 font-bold text-lg">
                {((item.price || 0) * item.quantity).toFixed(2)} kr
              </p>
            </div>

            {productDetails?.description && (
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Description
                </label>
                <p className="text-gray-700 text-sm mt-1">
                  {productDetails.description}
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
