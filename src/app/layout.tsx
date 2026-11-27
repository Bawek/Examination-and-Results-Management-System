import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import './enhancements.css';

export const metadata: Metadata = {
  title: 'Apex IERMS',
  description: 'Apex Academy Examination and Results Management System',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
