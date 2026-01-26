"use server";

import { api } from "./onslipClient";

export async function listProductGroups() {
  const productGroups = await api.listProductGroups();

  return JSON.parse(JSON.stringify(productGroups));
}

export async function listAllProducts() {
  const products = await api.listProducts();

  // Fetch product groups to get product group name
  const productsWithTypes = await Promise.all(
    products.map(async (product: { id: number; "product-group": number }) => {
      try {
        const productGroup = await api.getProductGroup(
          product["product-group"],
        );
        return {
          ...product,
          productGroup: productGroup.name || "other",
        };
      } catch (error) {
        console.error(
          `Failed to get product group for product ${product.id}:`,
          error,
        );
        return {
          ...product,
          productGroup: "other",
        };
      }
    }),
  );

  console.log("Products fetched with types:", productsWithTypes);
  return JSON.parse(JSON.stringify(productsWithTypes));
}

export async function getProduct(productId: number) {
  try {
    const product = await api.getProduct(productId);
    return JSON.parse(JSON.stringify(product));
  } catch (error) {
    console.error(`Failed to get product with ID ${productId}:`, error);
    return null;
  }
}

export async function createProduct(
  name: string,
  productGroup: number,
  price: number,
) {
  try {
    const newProduct = await api.addProduct({
      name: name,
      "product-group": productGroup,
      price: price,
    });
    return JSON.parse(JSON.stringify(newProduct));
  } catch (error) {
    console.error("Failed to create product:", error);
    return null;
  }
}

export async function deleteProduct(productId: number) {
  try {
    await api.removeProduct(productId);
    return true;
  } catch (error) {
    console.error(`Failed to delete product with ID ${productId}:`, error);
    return false;
  }
}

export async function updateProduct(
  productId: number,
  name: string,
  productGroup: number,
  price: number,
) {
  try {
    const updatedProduct = await api.updateProduct(productId, {
      name: name,
      "product-group": productGroup,
      price: price,
    });
    return JSON.parse(JSON.stringify(updatedProduct));
  } catch (error) {
    console.error(`Failed to update product with ID ${productId}:`, error);
    return null;
  }
}

export async function addProductToChair(chairId: number, productId: number) {
  try {
    // Get the current tab/chair
    const tab = await api.getTab(chairId);

    if (!tab) {
      throw new Error(`Chair with ID ${chairId} not found`);
    }

    // Get the product details
    const product = await api.getProduct(productId);

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // Get the product group to determine the type
    const productGroup = await api.getProductGroup(product["product-group"]);

    // Create the item to add to the tab with all required fields
    const newItem = {
      product: productId,
      "product-name": product.name,
      type: productGroup.type || ("goods" as const),
      quantity: product["default-quantity"] || 1,
      price: product.price || 0,
    };

    // Get existing items or initialize empty array
    const existingItems = tab.items || [];

    // Update the tab with the new item
    const updatedTab = await api.updateTab(chairId, {
      items: [...existingItems, newItem],
    });

    return JSON.parse(JSON.stringify(updatedTab));
  } catch (error) {
    console.error(`Failed to add product to chair ${chairId}:`, error);
    throw error;
  }
}

export async function getChairItems(chairId: number) {
  try {
    const tab = await api.getTab(chairId);

    if (!tab) {
      return [];
    }

    return JSON.parse(JSON.stringify(tab.items || []));
  } catch (error) {
    console.error(`Failed to get items for chair ${chairId}:`, error);
    return [];
  }
}
