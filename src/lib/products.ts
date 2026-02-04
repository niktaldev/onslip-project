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

export async function addProductToChair(
  chairId: number,
  productId: number,
  quantity: number = 1,
) {
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
      quantity: quantity,
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

export async function deleteItemFromChair(chairId: number, itemIndex: number) {
  try {
    // Get the current tab/chair
    const tab = await api.getTab(chairId);

    if (!tab) {
      throw new Error(`Chair with ID ${chairId} not found`);
    }

    // Get existing items
    const existingItems = tab.items || [];

    if (itemIndex < 0 || itemIndex >= existingItems.length) {
      throw new Error(`Invalid item index ${itemIndex}`);
    }

    // Remove the item at the specified index
    const updatedItems = [
      ...existingItems.slice(0, itemIndex),
      ...existingItems.slice(itemIndex + 1),
    ];

    // Update the tab with the modified items array
    const updatedTab = await api.updateTab(chairId, {
      items: updatedItems,
    });

    return JSON.parse(JSON.stringify(updatedTab));
  } catch (error) {
    console.error(`Failed to delete item from chair ${chairId}:`, error);
    throw error;
  }
}

export async function splitItemBetweenChairs(
  sourceChairId: number,
  targetChairIds: number[],
  itemIndex: number,
  sharePerChair: number,
) {
  try {
    // Get source chair/tab
    const sourceTab = await api.getTab(sourceChairId);
    if (!sourceTab) {
      throw new Error(`Source chair with ID ${sourceChairId} not found`);
    }

    const items = sourceTab.items || [];
    if (itemIndex < 0 || itemIndex >= items.length) {
      throw new Error(`Invalid item index: ${itemIndex}`);
    }

    const originalItem = items[itemIndex];
    const allChairIds = [sourceChairId, ...targetChairIds];

    // Create split indicator in product name and comment
    const splitIndicator = `(Split ${allChairIds.length} ways)`;
    const splitComment = `Split between chairs: ${allChairIds.join(", ")}. Original price: ${(originalItem.price || 0).toFixed(2)} kr`;

    // Update the source chair's item with split info and reduced price
    const updatedSourceItems = [...items];
    updatedSourceItems[itemIndex] = {
      ...originalItem,
      price: sharePerChair,
      "product-name": `${originalItem["product-name"]} ${splitIndicator}`,
      comment: splitComment,
    };

    await api.updateTab(sourceChairId, {
      items: updatedSourceItems,
    });

    // Add split items to target chairs
    for (const targetChairId of targetChairIds) {
      const targetTab = await api.getTab(targetChairId);
      if (!targetTab) {
        console.error(`Target chair ${targetChairId} not found, skipping`);
        continue;
      }

      const targetItems = targetTab.items || [];
      const splitItem = {
        product: originalItem.product,
        "product-name": `${originalItem["product-name"]} ${splitIndicator}`,
        type: originalItem.type,
        quantity: originalItem.quantity,
        price: sharePerChair,
        comment: splitComment,
      };

      await api.updateTab(targetChairId, {
        items: [...targetItems, splitItem],
      });
    }

    return true;
  } catch (error) {
    console.error("Failed to split item:", error);
    throw error;
  }
}

export async function combineTabsAndPay(chairIds: number[]) {
  try {
    if (chairIds.length < 1) {
      throw new Error("Need at least 1 chair to process payment");
    }

    // Get all tabs
    const tabs = await Promise.all(
      chairIds.map(async (id) => {
        const tab = await api.getTab(id);
        if (!tab) {
          throw new Error(`Chair with ID ${id} not found`);
        }
        return tab;
      }),
    );

    // Find the tab with the lowest ID (will be the primary tab)
    const sortedTabs = [...tabs].sort((a, b) => a.id - b.id);
    const primaryTab = sortedTabs[0];
    const tabsToMerge = sortedTabs.slice(1);

    // Collect all items from all tabs
    const allItems = tabs.flatMap((tab) => tab.items || []);

    // Create a special name to track which tabs were combined
    const combinedTabIds = tabsToMerge.map((tab) => tab.id);
    const newName =
      chairIds.length > 1
        ? `[PAID-${chairIds.length}] ${primaryTab.name || "Combined"}`
        : `[PAID-1] ${primaryTab.name || "Single"}`;

    // Update the primary tab with all items and updated name
    await api.updateTab(primaryTab.id, {
      items: allItems,
      name: newName,
    });

    // Delete the other tabs
    await Promise.all(tabsToMerge.map((tab) => api.removeTab(tab.id)));

    return {
      success: true,
      primaryTabId: primaryTab.id,
      mergedTabIds: combinedTabIds,
    };
  } catch (error) {
    console.error("Error combining tabs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
