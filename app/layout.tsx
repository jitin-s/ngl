import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://nglcrush.vercel.app'),
  title: 'nglcrush - Anonymous Crush & Confession Sanctuary 💕',
  description: 'nglcrush - A private, safe, and anonymous space to share your secret crush, relationship status, and confessions.',
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
  openGraph: {
    title: 'nglcrush - Anonymous Crush & Confession Sanctuary 💕',
    description: 'nglcrush - A private, safe, and anonymous space to share your secret crush, relationship status, and confessions.',
    images: [
      {
        url: '/logo.jpg',
        width: 800,
        height: 800,
        alt: 'nglcrush Logo',
      },
    ],
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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
