"use server";

import { api } from "./onslipClient";

/* Please not that chairs are handled as tabs in Onslip 360, 
  plus any labeles required to implement the extra functionality
  needed that is not provided by the tabs in the api. */

export async function listAllChairs() {
  const chairs = await api.listTabs();

  return chairs;
}

export async function getChair(chairId: number) {
  const chair = await api.getTab(chairId);

  return chair;
}

// orderId is the tableId the chair belongs to
export async function createChair(name: string, orderId: number) {
  const chair = await api.addTab({ name });
  
  // Link the chair (tab) to the table (order)
  await api.updateOrder(orderId, {
    resources: [chair.id]
  });
}

export async function getTableChairs(tableId: number) {
  const table = await api.getOrder(tableId);

  if (!table) {
    console.error(`Table with ID ${tableId} not found.`);
    return [];
  }

  if (!table.resources) {
    console.error(`No chairs found for table with ID ${tableId}.`);
    return [];
  }

  const chairs = [];
  // Fetch each chair associated with the table
  for (const chairId of table.resources) {
    const chair = await getChair(chairId);

    if (chair) {
      chairs.push(chair);
    }
  }

  return chairs;
}
