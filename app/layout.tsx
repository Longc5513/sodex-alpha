import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SoDEX Alpha Launch',
  description: 'Product-launch terminal powered by SoSoValue research and SoDEX execution.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
