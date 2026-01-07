"use server";

import { api } from "./onslipClient";

/* Please not that chairs are handled as tabs in Onslip 360, 
  plus any labeles required to implement the extra functionality
  needed that is not provided by the tabs in the api. */

export async function listAllChairs() {
  const chairs = await api.listTabs();

  return JSON.parse(JSON.stringify(chairs));
}

export async function getChair(chairId: number) {
  try {
    const chair = await api.getTab(chairId);
    return JSON.parse(JSON.stringify(chair));
  } catch (error) {
    console.error(`Failed to get chair with ID ${chairId}:`, error);
    return null;
  }
}

// Helper function to get or create label category for chair positions
async function getOrCreateChairLabelCategory(): Promise<number> {
  const categoryName = "chair-positions";

  const categories = await api.listLabelCategories();
  const existingCategory = categories.find((cat) => cat.name === categoryName);

  if (existingCategory) {
    return existingCategory.id;
  }

  const newCategory = await api.addLabelCategory({
    name: categoryName,
  });

  return newCategory.id;
}

// Helper function to get or create a label for a chair position
async function getOrCreatePositionLabel(position: number): Promise<number> {
  const labelName = `chair-position-${position}`;

  // Get or create the label category
  const categoryId = await getOrCreateChairLabelCategory();

  // Check if label already exists
  const labels = await api.listLabels();
  const existingLabel = labels.find((label) => label.name === labelName);

  if (existingLabel) {
    return existingLabel.id;
  }

  // Create new label
  const newLabel = await api.addLabel({
    name: labelName,
    "label-category": categoryId,
  });

  return newLabel.id;
}

// orderId is the tableId the chair belongs to
// Position is stored as a label with name "chair-position-{position}"
export async function createChair(
  name: string,
  orderId: number,
  position: number
) {
  try {
    // Get or create the position label
    const positionLabelId = await getOrCreatePositionLabel(position);

    const chair = await api.addTab({
      name,
      labels: [positionLabelId],
    });

    // Get existing table to preserve existing chairs
    const table = await api.getOrder(orderId);

    if (!table) {
      throw new Error(`Table with ID ${orderId} not found`);
    }

    const existingResources = table.resources || [];

    // Link the chair (tab) to the table (order), preserving existing chairs
    await api.updateOrder(orderId, {
      resources: [...existingResources, chair.id],
    });

    return JSON.parse(JSON.stringify(chair));
  } catch (error) {
    console.error(`Failed to create chair for order ${orderId}:`, error);
    throw error;
  }
}

export async function getTableChairs(tableId: number) {
  try {
    const table = await api.getOrder(tableId);

    if (!table) {
      console.error(`Table with ID ${tableId} not found.`);
      return [];
    }

    if (!table.resources) {
      console.error(`No chairs found for table with ID ${tableId}.`);
      return [];
    }

    // Fetch all labels to map IDs to names
    const allLabels = await api.listLabels();
    const labelMap = new Map(allLabels.map((label) => [label.id, label.name]));

    const chairs = [];
    // Fetch each chair associated with the table
    for (const chairId of table.resources) {
      const chair = await getChair(chairId);

      if (chair) {
        // Add label names to the chair object for easier position extraction
        const chairWithLabels = {
          ...chair,
          labelNames:
            chair.labels
              ?.map((labelId: number) => labelMap.get(labelId))
              .filter(Boolean) || [],
        };
        chairs.push(chairWithLabels);
      }
    }

    return JSON.parse(JSON.stringify(chairs));
  } catch (error) {
    console.error(`Failed to get chairs for table ${tableId}:`, error);
    return [];
  }
}
