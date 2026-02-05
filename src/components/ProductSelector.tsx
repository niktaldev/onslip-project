"use client";

import { useState, useEffect } from "react";
import { listAllProducts, addProductToChair } from "@/lib/products";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price?: number;
  description?: string;
}

interface ProductSelectorProps {
  chairId: number;
  chairName: string;
  onClose: () => void;
  onProductAdded?: () => void;
}

export default function ProductSelector({
  chairId,
  chairName,
  onClose,
  onProductAdded,
}: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingProduct, setAddingProduct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allProducts = await listAllProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error("Failed to load products:", error);
      setError("Failed to load products. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async (productId: number) => {
    try {
      setAddingProduct(productId);
      setError(null);
      await addProductToChair(chairId, productId);

      // Notify parent component to refresh items list
      if (onProductAdded) {
        onProductAdded();
      }
    } catch (error) {
      console.error("Failed to add product:", error);
      setError("Failed to add product. Please try again.");
    } finally {
      setAddingProduct(null);
    }
  };

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return "N/A";
    return `${price.toFixed(2)} kr`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-lg z-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Add Product to {chairName}
            </h3>
            <p className="text-sm text-gray-600">
              Select a product to add to this chair
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none px-2"
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Error Alert - Fixed at top of screen */}
        {error && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
            <Alert variant="destructive" className="shadow-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Product List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-600">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No products available. Create products first.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-3 pb-2">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddProduct(product.id)}
                  disabled={addingProduct === product.id}
                  className="shrink-0 w-48 p-4 bg-linear-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg hover:from-blue-100 hover:to-blue-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  title={product.description || product.name}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-gray-800 text-left line-clamp-2 mb-1">
                      {product.name}
                    </span>
                    <span className="text-sm font-bold text-blue-700">
                      {formatPrice(product.price)}
                    </span>
                    {addingProduct === product.id && (
                      <span className="text-xs text-gray-600 mt-1">
                        Adding...
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
