import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SoDEX Alpha Launch | Hackathon-Ready Trading Desk',
  description: 'A hackathon-ready launch terminal powered by SoSoValue research, SoDEX market data, and execution tooling for on-chain finance workflows.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          html,body{margin:0;min-height:100%;background:#050914;color:#f8fbff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Arial,sans-serif}
          body{overflow-x:hidden}
          body:before{content:"";position:fixed;inset:0;background:radial-gradient(circle at 22% 0%,rgba(134,84,255,.18),transparent 30%),radial-gradient(circle at 92% 6%,rgba(255,112,58,.14),transparent 28%),linear-gradient(120deg,#060b16 0%,#090d17 44%,#060811 100%);pointer-events:none;z-index:-1}
          a{color:inherit;text-decoration:none}
          button{font:inherit;cursor:pointer}
          .app{position:relative;display:grid;grid-template-columns:260px minmax(0,1fr);min-height:100vh}
          .sidebar{position:sticky;top:0;height:100vh;padding:22px 16px;border-right:1px solid #1b2637;background:linear-gradient(180deg,rgba(3,9,20,.95),rgba(5,10,18,.86));overflow:auto}
          .desk{min-width:0}
          .playerBar{position:sticky;top:0;z-index:20;height:82px;display:grid;grid-template-columns:270px minmax(360px,1fr) auto;align-items:center;gap:18px;padding:0 28px;border-bottom:1px solid #1b2637;background:rgba(5,9,17,.78);backdrop-filter:blur(20px)}
          .topGrid{display:grid;grid-template-columns:minmax(0,1.9fr) minmax(360px,.95fr);gap:14px;padding:22px 14px 10px}
          .contentGrid{display:grid;grid-template-columns:minmax(0,1fr) 560px;gap:14px;padding:0 14px 18px}
          .panel,.hero,.market,.portfolio,.signals,.index,.single{position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.09);border-radius:14px;background:linear-gradient(180deg,rgba(15,21,33,.92),rgba(8,13,22,.92));box-shadow:0 22px 75px rgba(0,0,0,.26)}
          .hero{padding:34px 44px;min-height:210px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(100deg,rgba(9,14,24,.92),rgba(12,20,38,.82))}
          .panelTitle{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
          .featureGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;padding:6px}
          .featureGrid article,.watchCard,.walletBox{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);border-radius:14px;padding:16px}
          .miniBtn,.launchCtas .miniBtn{display:inline-flex;align-items:center;justify-content:center;border:1px solid #29384e;background:#101a29;color:#fff;border-radius:999px;padding:9px 12px;font-weight:800}
          .launchRibbon{display:inline-flex;align-items:center;gap:10px;margin-bottom:12px;padding:7px 12px;border-radius:999px;background:linear-gradient(90deg,rgba(255,140,84,.18),rgba(122,92,255,.18));border:1px solid rgba(255,255,255,.12);color:#ffd7c8;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
          table{width:100%;border-collapse:collapse}
          th,td{padding:11px 9px;border-bottom:1px solid rgba(255,255,255,.055);text-align:left}
          @media (max-width:1200px){.app{grid-template-columns:1fr}.sidebar{position:relative;height:auto}.contentGrid,.topGrid,.executionGrid{grid-template-columns:1fr}.playerBar{grid-template-columns:1fr}}
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
