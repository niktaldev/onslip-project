"use server";

import { API, nodeRequestHandler } from "@onslip/onslip-360-node-api";

// Initialize the API with a request handler
API.initialize(nodeRequestHandler({ userAgent: "onslip-project/1.0.0" }));

// Some dummy states for testing
const states = [
  "ready",
  "guest_arrived",
  "drinks_ordered",
  "drinks_served",
  "food_ordered",
  "food_served",
  "bill_requested",
  "paid",
  "uncleaned",
  "cleaned",
];

const api = new API(
  "https://test.onslip360.com/v1/",
  "dev390569",
  "key:admin+niklast@dev390569",
  "NCldVjBjTFhPPDp9VEBEOXQ8bFRwJU4wRnBUdFpJPS8="
);

export async function createTableStates(newStates?: string[]) {
  const client = await api.getClientInfo();
  console.log("Client Info:", client);

  const listLocations = await api.listLocations();
  console.log("Locations:", listLocations);

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
  let locationId: number;

  const existingLocation = locations.find(
    (loc) => loc.name === "table-states-location"
  );

  if (existingLocation) {
    console.log("Location already exists:", existingLocation);
    locationId = existingLocation.id;
  } else {
    const location = await api.addLocation({ name: "table-states-location" });
    console.log("Location created:", location);
    locationId = location.id;
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

  // Try to update existing resource
  const existing = resources.find((r) => r.name === targetResourceName);
  if (existing) {
    const updatedResource = await api.updateResource(existing.id, {
      labels: labels.map((label) => label.id),
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
    labels: labels.map((label) => label.id),
  });
  console.log("Created Resource:", newResource);
}

export async function deleteTableResources() {
  const resources = await api.listResources();

  for (const resource of resources) {
    await api.removeResource(resource.id);
    console.log(`Deleted Resource: ${resource.name}`);
  }
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

  console.log("Table States:", stateNames);

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

// Fetches the current state of the order and sets it to the next state in the list
export async function setNextOrderState(orderId: number) {
  const order = await api.getOrder(orderId);

  if (!order || !order.resources || order.resources.length === 0) {
    console.error("The order does not exist or does not have a state resource");
    return;
  }

  const currentStates = await getTableStates();

  if (currentStates.length === 0) {
    console.error("No table states available to set.");
    return;
  }

  for (const resourceId of order.resources) {
    const resource = await api.getResource(resourceId);
    if (resource.name.startsWith(`order-${orderId}-state:`)) {
      // Extract the current state from the resource name
      const currentState = resource.name.split(":")[1];

      let nextState: string;
      if (currentState === "null") {
        nextState = currentStates[0];
      } else {
        const currentIndex = currentStates.indexOf(currentState);

        if (currentIndex === -1) {
          console.error(`Current state "${currentState}" not found`);
          continue;
        }

        // If at last state, jump to first; otherwise, go to next
        nextState =
          currentIndex === currentStates.length - 1
            ? currentStates[0]
            : currentStates[currentIndex + 1];
      }

      await updateStateResource(orderId, resourceId, nextState);
      console.log(
        `Order ${orderId} state changed from "${currentState}" to "${nextState}"`
      );
    }
  }
}

export async function getLocations() {
  const locations = await api.listLocations();
  console.log("Locations:", locations);
  return locations;
}
