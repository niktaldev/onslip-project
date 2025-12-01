"use client";

import {
  createOrder,
  createTableStates,
  deleteTableResources,
  getLocations,
  getTableStates,
  setNextOrderState,
} from "../lib/states";

export default function PageState() {
  async function handleClick() {
    await createTableStates();
  }

  async function handleDelete() {
    await deleteTableResources();
  }

  async function handleGetStates() {
    await getTableStates();
  }

  async function handleGetLocations() {
    await getLocations();
  }

  async function handleCreateOrder() {
    await createOrder("Test Order 2", 85);
  }

  async function handleNextState() {
    await setNextOrderState(2);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <button onClick={handleClick}>Create Table States</button>
      <h1>---------------------------------</h1>
      <button onClick={handleDelete}>Delete resources</button>
      <h1>---------------------------------</h1>
      <button onClick={handleGetStates}>Get Table States</button>
      <h1>---------------------------------</h1>
      <button onClick={handleGetLocations}>Get Locations Test</button>
      <h1>---------------------------------</h1>
      <button onClick={handleCreateOrder}>Create Order Test</button>
      <h1>---------------------------------</h1>
      <button onClick={handleNextState}>Next State Test</button>
    </div>
  );
}
