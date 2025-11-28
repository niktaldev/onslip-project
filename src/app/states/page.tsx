import { createTableStates } from "../lib/states";

export default async function PageState() {
  const test = await createTableStates();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1>This page will soon show the currently implemented table states</h1>
      <p>{JSON.stringify(test)}</p>
    </div>
  );
}
