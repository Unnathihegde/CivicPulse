'use client';

import Link from 'next/link';

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen">
      <header className="px-6 py-4 border-b border-border bg-card flex justify-between items-center">
        <h1 className="text-xl font-bold">Worker Portal</h1>
        <nav className="flex space-x-4">
          <Link href="/" className="text-sm hover:underline">Return to Map</Link>
        </nav>
      </header>
      <main className="flex-1 overflow-auto bg-background/50">
        {children}
      </main>
    </div>
  );
}
