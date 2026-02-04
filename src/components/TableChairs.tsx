"use client";

import { useState, useEffect } from "react";
import {
  createChair,
  getChair,
  getTableChairs,
  restartTable,
} from "@/lib/chairs";
import type { Chair } from "@/types/table";
import {
  getChairItems,
  listAllProducts,
  addProductToChair,
  getProduct,
  splitItemBetweenChairs,
  deleteItemFromChair,
  combineTabsAndPay,
} from "@/lib/products";
import ChairGrid from "./ChairGrid";
import ChairItemsList from "./ChairItemsList";
import ProductGroupsList from "./ProductGroupsList";
import ItemDetailsDialog from "./ItemDetailsDialog";
import SplitItemDialog from "./SplitItemDialog";
import CombinePayDialog from "./CombinePayDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ChairDetails {
  id: number;
  name: string;
  created?: string;
}

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

interface TableChairsProps {
  id: number;
  name: string;
  maxCapacity: number;
  minCapacity?: number;
  width: number;
  height: number;
  orderId?: number;
  currentState?: string;
  locked?: boolean;
  availablePositions?: number[];
}

export default function TableChairs({
  name,
  maxCapacity,
  width,
  height,
  orderId,
  currentState,
  availablePositions,
}: TableChairsProps) {
  const [chairs, setChairs] = useState<Map<number, Chair>>(new Map());
  const [chairDetails, setChairDetails] = useState<Map<number, ChairDetails>>(
    new Map(),
  );
  const [selectedChair, setSelectedChair] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chairItems, setChairItems] = useState<Map<number, Item[]>>(new Map());
  const [products, setProducts] = useState<Product[]>([]);
  const [addingProduct, setAddingProduct] = useState<number | null>(null);
  const [dialogState, setDialogState] = useState<{
    mode: "view" | "add";
    item: Item | null;
    product: Product | null;
  }>({ mode: "view", item: null, product: null });
  const [splitDialogState, setSplitDialogState] = useState<{
    item: Item | null;
    sourceChairId: number | null;
    itemIndex: number;
  }>({ item: null, sourceChairId: null, itemIndex: -1 });
  const [itemContext, setItemContext] = useState<{
    item: Item | null;
    sourceChairId: number | null;
    itemIndex: number;
  }>({ item: null, sourceChairId: null, itemIndex: -1 });
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    type: "delete" | "alreadySplit" | null;
    onConfirm?: () => void;
  }>({ isOpen: false, type: null });
  const [combinePayDialogOpen, setCombinePayDialogOpen] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  // Use availablePositions if provided, otherwise allow all positions up to maxCapacity
  const allowedPositions = availablePositions
    ? new Set(availablePositions)
    : new Set(Array.from({ length: maxCapacity }, (_, i) => i));

  const loadExistingChairs = async () => {
    if (!orderId) return;

    try {
      const existingChairs = await getTableChairs(orderId);

      if (!existingChairs || existingChairs.length === 0) {
        setChairs(new Map());
        return;
      }

      const chairMap = new Map<number, Chair>();

      existingChairs.forEach(
        (chair: { id: number; name?: string; labelNames?: string[] }) => {
          if (chair && chair.id) {
            // Extract position from label names (format: "chair-position-{position}")
            let position = 0;
            if (chair.labelNames && chair.labelNames.length > 0) {
              const positionLabel = chair.labelNames.find((labelName: string) =>
                labelName.startsWith("chair-position-"),
              );
              if (positionLabel) {
                position = parseInt(
                  positionLabel.replace("chair-position-", ""),
                  10,
                );
              }
            }

            chairMap.set(position, {
              chairId: chair.id,
              position: position,
              orderId: orderId,
              name: chair.name,
            });
          }
        },
      );

      setChairs(chairMap);
    } catch (error) {
      console.error("Failed to load existing chairs:", error);
      setChairs(new Map());
    }
  };

  // Load existing chairs when component mounts
  useEffect(() => {
    if (orderId) {
      loadExistingChairs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Load products once on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const allProducts = await listAllProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  const loadChairItems = async (chairId: number, position: number) => {
    try {
      const items = await getChairItems(chairId);
      setChairItems((prev) => {
        const newMap = new Map(prev);
        newMap.set(position, items);
        return newMap;
      });
    } catch (error) {
      console.error("Failed to load chair items:", error);
    }
  };

  const handleItemClick = async (item: Item, itemIndex?: number) => {
    if (!item.product) {
      setDialogState({ mode: "view", item, product: null });
      return;
    }

    try {
      const productDetails = await getProduct(item.product);
      setDialogState({ mode: "view", item, product: productDetails });

      // Store item context for potential split operation
      if (itemIndex !== undefined && selectedChair !== null) {
        const chair = chairs.get(selectedChair);
        if (chair) {
          setItemContext({
            item,
            sourceChairId: chair.chairId,
            itemIndex,
          });
        }
      }
    } catch (error) {
      console.error("Failed to load product details:", error);
      setDialogState({ mode: "view", item, product: null });
    }
  };

  const handleChairClick = async (position: number) => {
    if (!orderId) {
      alert("Table must have an orderId to manage chairs");
      return;
    }

    // Check if this position is allowed
    if (!allowedPositions.has(position)) {
      alert("This chair position is not available for this table");
      return;
    }

    setIsLoading(true);

    try {
      const existingChair = chairs.get(position);

      if (existingChair) {
        // Chair exists - toggle selection if already selected, otherwise select it
        if (selectedChair === position) {
          // Deselect if clicking the same chair
          setSelectedChair(null);
          return;
        }

        // Show product selector
        const details = await getChair(existingChair.chairId);

        if (!details) {
          alert("Chair not found. It may have been deleted.");
          await loadExistingChairs();
          return;
        }

        setChairDetails((prev) => {
          const newMap = new Map(prev);
          newMap.set(position, details);
          return newMap;
        });

        // Set selected chair to show details below
        setSelectedChair(position);

        // Load items for this chair
        await loadChairItems(existingChair.chairId, position);
      } else {
        // Check if we've reached max capacity before creating new chair
        if (chairs.size >= maxCapacity) {
          alert(
            `Maximum capacity reached (${maxCapacity} chairs). Remove an existing chair to add a new one.`,
          );
          return;
        }

        // Chair doesn't exist - create new one
        const chairName = `${name}-Chair-${position + 1}`;
        await createChair(chairName, orderId, position);

        // Reload chairs to get the new chair with its ID
        await loadExistingChairs();
      }
    } catch (error) {
      console.error("Failed to handle chair click:", error);
      alert("Failed to handle chair action. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    setDialogState({ mode: "add", item: null, product });
  };

  const handleQuantityConfirm = async (quantity: number) => {
    if (selectedChair === null) return;
    if (!dialogState.product) return;

    const chair = chairs.get(selectedChair);
    if (!chair) return;

    try {
      setAddingProduct(dialogState.product.id);

      // Adding new product with specified quantity
      await addProductToChair(chair.chairId, dialogState.product.id, quantity);

      await loadChairItems(chair.chairId, selectedChair);
      setDialogState({ mode: "view", item: null, product: null });
    } catch (error) {
      console.error("Failed to add product:", error);
      alert("Failed to add product. Please try again.");
    } finally {
      setAddingProduct(null);
    }
  };

  const handleAddMore = async (quantity: number) => {
    if (selectedChair === null) return;
    if (!dialogState.item?.product) return;

    const chair = chairs.get(selectedChair);
    if (!chair) return;

    try {
      setAddingProduct(dialogState.item.product);

      // Add more of the same product
      await addProductToChair(
        chair.chairId,
        dialogState.item.product,
        quantity,
      );

      await loadChairItems(chair.chairId, selectedChair);
      setDialogState({ mode: "view", item: null, product: null });
    } catch (error) {
      console.error("Failed to add more product:", error);
      alert("Failed to add more product. Please try again.");
    } finally {
      setAddingProduct(null);
    }
  };

  const handleDeleteItem = () => {
    if (selectedChair === null) return;
    if (!itemContext || itemContext.itemIndex === undefined) {
      return;
    }

    const chair = chairs.get(selectedChair);
    if (!chair) return;

    // Show confirmation dialog
    setAlertDialog({
      isOpen: true,
      type: "delete",
      onConfirm: async () => {
        try {
          // Delete the item from the chair's tab
          await deleteItemFromChair(chair.chairId, itemContext.itemIndex);

          // Reload the chair's items to reflect the deletion
          await loadChairItems(chair.chairId, selectedChair);

          // Close the dialog and clear context
          setDialogState({ mode: "view", item: null, product: null });
          setItemContext({ item: null, sourceChairId: null, itemIndex: -1 });
        } catch (error) {
          console.error("Failed to delete item:", error);
          alert("Failed to delete item. Please try again.");
        }
      },
    });
  };

  const handleSplitClick = () => {
    // Check if item is already split
    const itemName = itemContext.item?.["product-name"] || "";
    if (itemName.includes("(Split") && itemName.includes("ways)")) {
      setAlertDialog({
        isOpen: true,
        type: "alreadySplit",
      });
      return;
    }

    // Open split dialog with stored context
    setSplitDialogState(itemContext);
    // Close the item details dialog
    setDialogState({ mode: "view", item: null, product: null });
  };

  const handleSplitConfirm = async (
    targetChairIds: number[],
    sharePerChair: number,
  ) => {
    if (
      splitDialogState.sourceChairId === null ||
      splitDialogState.itemIndex < 0
    ) {
      return;
    }

    try {
      await splitItemBetweenChairs(
        splitDialogState.sourceChairId,
        targetChairIds,
        splitDialogState.itemIndex,
        sharePerChair,
      );

      // Reload items for all affected chairs
      if (selectedChair !== null) {
        const chair = chairs.get(selectedChair);
        if (chair) {
          await loadChairItems(chair.chairId, selectedChair);
        }
      }

      // Reload items for target chairs
      for (const targetChairId of targetChairIds) {
        const targetChairEntry = Array.from(chairs.entries()).find(
          ([, chair]) => chair.chairId === targetChairId,
        );
        if (targetChairEntry) {
          const [position] = targetChairEntry;
          await loadChairItems(targetChairId, position);
        }
      }

      // Clear split dialog state
      setSplitDialogState({ item: null, sourceChairId: null, itemIndex: -1 });
    } catch (error) {
      console.error("Failed to split item:", error);
      alert("Failed to split item. Please try again.");
    }
  };

  const handleSplitClose = () => {
    setSplitDialogState({ item: null, sourceChairId: null, itemIndex: -1 });
  };

  const handleCombinePayConfirm = async (chairIds: number[]) => {
    try {
      const result = await combineTabsAndPay(chairIds);

      if (!result.success) {
        alert(`Failed to combine tabs: ${result.error}`);
        return;
      }

      // Reload chairs to reflect the changes
      await loadExistingChairs();

      // Clear selection
      setSelectedChair(null);
      setCombinePayDialogOpen(false);

      alert("Payment processed successfully!");
    } catch (error) {
      console.error("Failed to combine tabs:", error);
      alert("Failed to process payment. Please try again.");
    }
  };

  // Check if all existing chairs (not empty positions) are paid
  const allChairsPaid = () => {
    // chairs Map only contains occupied positions with actual chairs
    if (chairs.size === 0) return false;

    // Check if every chair in the Map has [PAID-] prefix in its name
    return Array.from(chairs.values()).every((chair) => {
      return chair.name?.startsWith("[PAID-") || false;
    });
  };

  const handleRestartTable = async () => {
    if (!orderId) return;

    try {
      const result = await restartTable(orderId);

      if (!result.success) {
        alert(`Failed to restart table: ${result.error}`);
        return;
      }

      // Reload chairs to show empty table
      await loadExistingChairs();
      setSelectedChair(null);
      setShowRestartConfirm(false);

      alert(
        `Table restarted successfully! ${result.removedChairs} chairs removed.`,
      );
    } catch (error) {
      console.error("Failed to restart table:", error);
      alert("Failed to restart table. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[300px] p-8 border border-gray-500 rounded-lg">
      {/* Show Restart Table button if all chairs are paid, otherwise show Process Payment */}
      {chairs.size >= 1 && (
        <div className="mb-4 w-full flex justify-center">
          {allChairsPaid() ? (
            <Button
              onClick={() => setShowRestartConfirm(true)}
              className="bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Restart Table
            </Button>
          ) : (
            <Button
              onClick={() => setCombinePayDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
              size="lg"
            >
              Process Payment
            </Button>
          )}
        </div>
      )}
      <ChairGrid
        name={name}
        width={width}
        height={height}
        maxCapacity={maxCapacity}
        chairs={chairs}
        selectedChairs={
          selectedChair !== null ? new Set([selectedChair]) : new Set()
        }
        allowedPositions={allowedPositions}
        currentState={currentState}
        isLoading={isLoading}
        onChairClick={handleChairClick}
      />

      {isLoading && (
        <div className="mt-2 text-sm text-blue-600">Loading...</div>
      )}

      {/* Chair Details Section */}
      {selectedChair !== null && chairDetails.has(selectedChair) && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg w-full max-w-lg">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg text-gray-800">
              Chair Details
            </h3>
            <button
              onClick={() => setSelectedChair(null)}
              className="text-gray-500 hover:text-gray-700 text-xl leading-none"
              title="Close details"
            >
              ×
            </button>
          </div>
          {(() => {
            const details = chairDetails.get(selectedChair);
            const items = chairItems.get(selectedChair) || [];
            if (!details) return null;

            // Check if chair is paid
            const isPaid = details.name?.startsWith("[PAID-") || false;

            return (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name: </span>
                  <span className="text-gray-600">{details.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Onslip-ID: </span>
                  <span className="text-gray-600">{details.id}</span>
                </div>

                {isPaid && (
                  <div className="p-3 bg-purple-100 border border-purple-300 rounded-md">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">✓</span>
                      <div>
                        <div className="font-semibold text-purple-800">
                          This tab has been paid
                        </div>
                        <div className="text-xs text-purple-600 mt-1">
                          Items are shown for reference only. No changes can be
                          made.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <ChairItemsList
                  items={items}
                  onItemClick={isPaid ? undefined : handleItemClick}
                />

                {!isPaid && (
                  <ProductGroupsList
                    products={products}
                    onProductClick={handleProductClick}
                    addingProductId={addingProduct}
                    currentState={currentState}
                  />
                )}
              </div>
            );
          })()}
        </div>
      )}

      <ItemDetailsDialog
        item={dialogState.item}
        product={dialogState.product}
        mode={dialogState.mode}
        onClose={() =>
          setDialogState({ mode: "view", item: null, product: null })
        }
        onQuantityChange={handleQuantityConfirm}
        onAddMore={handleAddMore}
        onSplit={handleSplitClick}
        onDelete={handleDeleteItem}
      />

      <SplitItemDialog
        item={splitDialogState.item}
        sourceChairId={splitDialogState.sourceChairId}
        sourceChairPosition={selectedChair}
        occupiedChairs={chairs}
        tableName={name}
        tableWidth={width}
        tableHeight={height}
        maxCapacity={maxCapacity}
        currentState={currentState}
        allowedPositions={allowedPositions}
        onClose={handleSplitClose}
        onConfirm={handleSplitConfirm}
      />

      <AlertDialog
        open={alertDialog.isOpen}
        onOpenChange={(open) => setAlertDialog({ isOpen: open, type: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {alertDialog.type === "delete"
                ? "Delete Item"
                : "Item Already Split"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {alertDialog.type === "delete"
                ? "Are you sure you want to delete this item from the order? This action cannot be undone."
                : "This item has already been split. To modify the split, you need to remove the split items and create a new split."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setAlertDialog({ isOpen: false, type: null })}
            >
              Cancel
            </AlertDialogCancel>
            {alertDialog.type === "delete" && (
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  alertDialog.onConfirm?.();
                  setAlertDialog({ isOpen: false, type: null });
                }}
              >
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CombinePayDialog
        isOpen={combinePayDialogOpen}
        occupiedChairs={chairs}
        tableName={name}
        tableWidth={width}
        tableHeight={height}
        currentState={currentState}
        allowedPositions={allowedPositions}
        onClose={() => setCombinePayDialogOpen(false)}
        onConfirm={handleCombinePayConfirm}
      />

      {/* Restart Table Confirmation */}
      <AlertDialog
        open={showRestartConfirm}
        onOpenChange={setShowRestartConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restart Table?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all paid chairs and prepare the table for new
              guests. All payment history will be cleared from this table. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowRestartConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestartTable}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Restart Table
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
