/* TODO:
 * Implement a state list for the tables
 * addStates() Push the states to the server
 * getStates() Fetch the states from the server
 */

import { API } from "@onslip/onslip-360-node-api";

// Some dummy states for testing
const states = ["state1", "state2", "state3"];

const api = new API(
  "https://test.onslip360.com/v1/",
  "dev390569",
  "key:admin+niklast@dev390569",
  "NCldVjBjTFhPPDp9VEBEOXQ8bFRwJU4wRnBUdFpJPS8="
);

export async function addStates(newStates?: string[]) {
  return await api.getClientInfo();
}
