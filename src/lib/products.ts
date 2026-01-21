"use server";

import { api } from "./onslipClient";

export async function listProductGroups() {
  const productGroups = await api.listProductGroups();

  return JSON.parse(JSON.stringify(productGroups));
}

export async function listAllProducts() {
  const products = await api.listProducts();

  return JSON.parse(JSON.stringify(products));
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
