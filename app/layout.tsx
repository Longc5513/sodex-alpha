import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SoDEX Alpha Launch | Hackathon-Ready Trading Desk',
  description: 'A hackathon-ready launch terminal powered by SoSoValue research, SoDEX market data, and execution tooling for on-chain finance workflows.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
