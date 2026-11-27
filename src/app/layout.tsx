import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import './enhancements.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'IERMS - Integrated Examination and Results Management System',
  description:
    'Enterprise system unifying Online Examination Management (OEMS) and Student Result Management (SRMS) with PostgreSQL persistence, multi-role RBAC, question banking, exam delivery, mark entry, and result engine.',
  openGraph: {
    title: 'IERMS - Integrated Examination and Results Management System',
    description:
      'Enterprise system unifying Online Examination Management (OEMS) and Student Result Management (SRMS) with PostgreSQL persistence, multi-role RBAC, question banking, exam delivery, mark entry, and result engine.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
