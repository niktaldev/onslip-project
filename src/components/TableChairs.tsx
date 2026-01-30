"use client";

import { useState, useEffect } from "react";
import { createChair, getChair, getTableChairs } from "@/lib/chairs";
import type { Chair } from "@/types/table";
import {
  getChairItems,
  listAllProducts,
  addProductToChair,
  getProduct,
} from "@/lib/products";
import ChairGrid from "./ChairGrid";
import ChairItemsList from "./ChairItemsList";
import ProductGroupsList from "./ProductGroupsList";
import ItemDetailsDialog from "./ItemDetailsDialog";

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

  const handleItemClick = async (item: Item) => {
    if (!item.product) {
      setDialogState({ mode: "view", item, product: null });
      return;
    }

    try {
      const productDetails = await getProduct(item.product);
      setDialogState({ mode: "view", item, product: productDetails });
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

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[300px] p-8 border border-gray-500 rounded-lg">
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

                <ChairItemsList items={items} onItemClick={handleItemClick} />

                <ProductGroupsList
                  products={products}
                  onProductClick={handleProductClick}
                  addingProductId={addingProduct}
                  currentState={currentState}
                />
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
      />
    </div>
  );
}
