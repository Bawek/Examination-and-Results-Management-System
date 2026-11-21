import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'Apex IERMS',
  description: 'Apex Academy Examination and Results Management System',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
