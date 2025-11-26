import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Link href="/states">Go to States Page</Link>
    </div>
  );
}
