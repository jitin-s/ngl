import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Secret Feelings & Crush Confession Vault 💕',
  description: 'A private and safe space to share your secret crush, relationship status, and confessions.',
  openGraph: {
    title: 'Secret Feelings & Crush Confession Vault 💕',
    description: 'A private and safe space to share your secret crush, relationship status, and confessions.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-rose-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
