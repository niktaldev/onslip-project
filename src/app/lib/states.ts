/* TODO:
 * Implement a state list for the tables
 * Create a dummy
 * addStates() Push the states to the server
 * getStates() Fetch the states from the server
 */

import { API } from "@onslip/onslip-360-node-api";

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

    createConfigResource();
  });

  const labelStates = await api.listLabels(`label-category:${labelCategoryId}`);

  console.log("Labels:", labelStates);
}

export async function createConfigResource() {
  const locations = await api.listLocations();
  console.log("Locations:", locations);
  let locationId: number;

  const existingLocation = locations.find(
    (loc) => loc.name === "Table States Location"
  );

  if (existingLocation) {
    console.log("Location already exists:", existingLocation);
    locationId = existingLocation.id;
  } else {
    const location = await api.addLocation({ name: "Table States Location" });
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

  const labels = await api.listLabels(`label-category:${labelStates[0].id}`);

  const existingResources = await api.listResources();
  console.log(existingResources);

  // const configResource = await api.addResource({
  //   location: locationId,
  //   name: "Table States Resource",
  //   labels: labels.map((label) => label.id),
  // });

  // console.log("Created resource: ", await api.getResource(configResource.id));
}
