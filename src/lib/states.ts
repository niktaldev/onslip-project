"use server";

import { API, nodeRequestHandler } from "@onslip/onslip-360-node-api";

// Initialize the API with a request handler
API.initialize(nodeRequestHandler({ userAgent: "onslip-project/1.0.0" }));

// Some dummy states for testing
const states = [
  "1:ready",
  "2:guest_arrived",
  "3:drinks_ordered",
  "4:drinks_served",
  "5:food_ordered",
  "6:food_served",
  "7:bill_requested",
  "8:paid",
  "9:uncleaned",
  "10:cleaned",
];

const api = new API(
  "https://test.onslip360.com/v1/",
  "dev390569",
  "key:admin+niklast@dev390569",
  "NCldVjBjTFhPPDp9VEBEOXQ8bFRwJU4wRnBUdFpJPS8="
);

export async function createTableStates(newStates?: string[]) {
  const listLabelCategories = await api.listLabelCategories();
  let labelCategoryId: number;

  const existingCategory = listLabelCategories.find(
    (cat) => cat.name === "table-states"
  );

  if (existingCategory) {
    console.log("Label category already exists:", existingCategory);
    labelCategoryId = existingCategory.id;
  } else {
    const labelCategory = await api.addLabelCategory({
      name: "table-states",
    });
    console.log("Label Category Added:", labelCategory);
    labelCategoryId = labelCategory.id;
  }

  const labels = await api.listLabels();

  states.forEach(async (state) => {
    const existingLabel = labels.find((label) => label.name === state);
    if (existingLabel) {
      console.log(`Label "${state}" already exists:`, existingLabel);
    } else {
      const label = await api.addLabel({
        name: state,
        "label-category": labelCategoryId,
      });
      console.log("Label Added:", label);
    }
  });

  await createConfigResource();

  const labelStates = await api.listLabels(`label-category:${labelCategoryId}`);

  console.log("Labels:", labelStates);
}

export async function createConfigResource() {
  const locations = await api.listLocations();
  console.log("Locations:", locations);

  const existingLocation = locations.find(
    (loc) => loc.name === "table-states-location"
  );

  if (existingLocation) {
    console.log("Location already exists:", existingLocation);
  } else {
    const location = await api.addLocation({ name: "table-states-location" });
    console.log("Location created:", location);
  }

  const labelStates = await api.listLabelCategories("table-states");

  if (labelStates.length === 0) {
    console.error(
      "Label category 'table-states' does not exist. Please create it first."
    );
    return;
  }

  addResourceStates(states);

  console.log("Current resources: ", await api.listResources());
}

// Helper to add or update the resource that holds the table states
async function addResourceStates(newStates: string[]) {
  const targetResourceName = "table-states-resource";
  const resources = await api.listResources();
  const labelCategories = await api.listLabelCategories("table-states");

  if (labelCategories.length === 0) {
    console.error("Label category 'table-states' does not exist.");
    return;
  }

  const labels = await api.listLabels(
    `label-category:${labelCategories[0].id}`
  );

  // Check for labels that don't exist in the current states list and delete them
  for (const label of labels) {
    if (!newStates.includes(label.name)) {
      await api.removeLabel(label.id);
      console.log(`Deleted obsolete label: ${label.name}`);
    }
  }

  // Re-fetch labels after deletion to get the current list
  const currentLabels = await api.listLabels(
    `label-category:${labelCategories[0].id}`
  );

  // Try to update existing resource
  const existing = resources.find((r) => r.name === targetResourceName);
  if (existing) {
    const updatedResource = await api.updateResource(existing.id, {
      labels: currentLabels.map((label) => label.id),
    });
    console.log("Updated Resource:", updatedResource);
    return;
  }

  // Ensure location exists
  const locations = await api.listLocations();
  let locationId: number;
  const existingLocation = locations.find(
    (loc) => loc.name === "table-states-location"
  );

  if (existingLocation) {
    locationId = existingLocation.id;
  } else {
    const location = await api.addLocation({ name: "table-states-location" });
    locationId = location.id;
    console.log("Location created:", location);
  }

  // Create new resource
  const newResource = await api.addResource({
    location: locationId,
    name: targetResourceName,
    labels: currentLabels.map((label) => label.id),
  });
  console.log("Created Resource:", newResource);
}

// This function fetches the possible table states from the server
export async function getTableStates(): Promise<string[]> {
  const resources = await api.listResources("name=table-states-resource");

  if (!resources[0] || !resources[0].labels) {
    console.error("Table states resource not found.");
    return [];
  }

  // Fetch label names for the resource's labels
  const stateNames = await Promise.all(
    resources[0].labels.map(async (labelId) => {
      const label = await api.getLabel(labelId);
      return label.name;
    })
  );

  // Sort states by their order prefix (e.g., "1:ready", "2:guest_arrived")
  stateNames.sort((a, b) => {
    const orderA = parseInt(a.split(":")[0]);
    const orderB = parseInt(b.split(":")[0]);
    return orderA - orderB;
  });

  console.log(stateNames);

  return stateNames;
}

// Create an order and its associated state resource, and returns the order ID
export async function createOrder(
  name: string,
  locationId: number
): Promise<number> {
  const order = await api.addOrder({
    name: name,
    location: locationId,
    state: "active",
  });

  console.log("Created Order:", order);
  await createStateResourceForOrder(order.id);

  return order.id;
}

export async function listOrders() {
  const orders = await api.listOrders();

  // Filter out orders where the 'deleted' field is defined (not undefined)
  const activeOrders = orders.filter((order) => order.deleted === undefined);

  console.log("Active Orders:", activeOrders);

  activeOrders.forEach((order) => {
    order.resources?.forEach(async (resourceId) => {
      const resource = await api.getResource(resourceId);
      console.log(`Resource in order ${order.id}:`, resource);
    });
  });
}

// Deletes an order and its associated resources
export async function deleteOrder(orderId: number) {
  const order = await api.getOrder(orderId);

  if (!order) {
    console.log(`Order with ID ${orderId} does not exist.`);
    return;
  }

  await api.removeOrder(orderId);
  console.log(`Deleted Order with ID: ${orderId}`);

  if (order.resources) {
    for (const resourceId of order.resources) {
      await deleteTableResource(resourceId);
      console.log(`Deleted Resource with ID: ${resourceId}`);
    }
  }
}

// Deletes the resources of the given id
async function deleteTableResource(resourceId: number) {
  await api.removeResource(resourceId);
}

// This function creates the resource for a given order which holds the current state
export async function createStateResourceForOrder(orderId: number) {
  const order = await api.getOrder(orderId);
  console.log("Order Info:", order);

  if (!order) {
    console.log("Order was not found.");
    return;
  }

  const resource = await api.addResource({
    location: order.location,
    name: `order-${orderId}-state:null`,
  });

  const updateOrder = await api.updateOrder(orderId, {
    resources: [resource.id],
  });

  console.log("Created State Resource for Order:", resource);
  console.log("Updated Order with Resource:", updateOrder);
}

// Helper to update the state of a given order by modifying its state resource
async function updateStateResource(
  orderId: number,
  resourceId: number,
  newState: string
) {
  const resource = await api.getResource(resourceId);

  if (!resource) {
    console.error("Resource not found.");
    return;
  }

  if (!resource.name.startsWith(`order-${orderId}-state`)) {
    console.error("Resource does not belong to the specified order.");
  }

  const updatedResource = await api.updateResource(resourceId, {
    name: `order-${orderId}-state:${newState}`,
  });

  console.log("Updated State Resource:", updatedResource);
}

// Helper function to change order state in a given direction
async function changeOrderState(orderId: number, direction: "next" | "prev") {
  const order = await api.getOrder(orderId);

  if (!order || !order.resources || order.resources.length === 0) {
    console.error("The order does not exist or does not have a state resource");
    return;
  }

  const currentStates = await getTableStates();
  console.log("Table States:", currentStates);

  if (currentStates.length === 0) {
    console.error("No table states available to set.");
    return;
  }

  for (const resourceId of order.resources) {
    const resource = await api.getResource(resourceId);
    if (resource.name.startsWith(`order-${orderId}-state:`)) {
      // Extract the current state from the resource name (everything after "order-X-state:")
      const currentState = resource.name.substring(
        `order-${orderId}-state:`.length
      );

      let newState: string;
      if (currentState === "null") {
        newState =
          direction === "next"
            ? currentStates[0]
            : currentStates[currentStates.length - 1];
      } else {
        const currentIndex = currentStates.indexOf(currentState);

        if (currentIndex === -1) {
          console.error(`Current state "${currentState}" not found`);
          continue;
        }

        if (direction === "next") {
          // If at last state, jump to first; otherwise, go to next
          newState =
            currentIndex === currentStates.length - 1
              ? currentStates[0]
              : currentStates[currentIndex + 1];
        } else {
          // If at first state, jump to last; otherwise, go to previous
          newState =
            currentIndex === 0
              ? currentStates[currentStates.length - 1]
              : currentStates[currentIndex - 1];
        }
      }

      await updateStateResource(orderId, resourceId, newState);
      console.log(
        `Order ${orderId} state changed from "${currentState}" to "${newState}"`
      );
    }
  }
}

// Fetches the current state of the order and sets it to the next state in the list
export async function setNextOrderState(orderId: number) {
  await changeOrderState(orderId, "next");
}

// Fetches the current state of the order and sets it to the previous state in the list
export async function setPreviousOrderState(orderId: number) {
  await changeOrderState(orderId, "prev");
}

export async function getLocations() {
  const locations = await api.listLocations();
  console.log("Locations:", locations);
  return locations;
}

// Gets the current state of an order by reading its state resource
export async function getOrderState(orderId: number): Promise<string | null> {
  try {
    const order = await api.getOrder(orderId);

    if (!order || !order.resources || order.resources.length === 0) {
      return null;
    }

    for (const resourceId of order.resources) {
      const resource = await api.getResource(resourceId);
      if (resource.name.startsWith(`order-${orderId}-state:`)) {
        const state = resource.name.substring(`order-${orderId}-state:`.length);
        return state === "null" ? null : state;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error getting state for order ${orderId}:`, error);
    return null;
  }
}
