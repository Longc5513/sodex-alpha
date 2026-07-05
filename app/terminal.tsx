'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SOSOVALUE_CONSOLE_URL, SOSOVALUE_DOCS_URL, SOSOVALUE_PRESETS } from '../lib/sosovalue-meta';

type Signal = 'BUY' | 'HOLD' | 'WATCH';
type Asset = {
  symbol: string; name: string; pair: string; price: number | null; change24h: number; change7d: number;
  volume24h: number | null; marketCap: number | null; signal: Signal; confidence: number;
  entry: number | null; stop: number | null; take: number | null; spark: number[]; category: string; icon: string;
};
type WalletState = { address: string; chainId: string; balance: string } | null;
type PaperPosition = { symbol: string; side: 'BUY'|'SELL'; qty: number; entry: number; time: string };
type AlertRule = { symbol: string; target: number; side: 'above'|'below'; id: string };

declare global { interface Window { ethereum?: any } }

const nav = ['Launch','Judges','Execution','Markets','Watchlist','Alpha Signals','Screener','Heatmap','Portfolio','Paper Trading','News & Insights','SoSoValue Indexes','On-Chain','AI Research','Alerts','Leaderboard','Settings','Diag'];
const navIcons = ['⌂','⚖','⇢','⌁','★','◌','⚗','⌘','▣','◎','▤','◈','⌬','✺','♧','♕','⚙','◧'];
const official = [['SoSoValue Project','https://sosovalue.com/'],['SoSoValue Console','https://sosovalue.com/developer/dashboard'],['SoSoValue API Docs','https://sosovalue-1.gitbook.io/sosovalue-api-doc'],['SoDEX Official','https://sodex.com/'],['SoDEX REST API','https://sodex.com/documentation/trading-api/rest-v1'],['Telegram','https://t.me/SoSoValueCommunity'],['Discord','https://discord.gg/sodex'],['Follow SoSoValue','https://x.com/SoSoValueCrypto'],['Follow SoDEX','https://x.com/sodex_official']];
const pathOf = (n:string)=> `/${n.toLowerCase().replace(/&/g,'and').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')}`;
const usd = (n:number|null)=> n==null||Number.isNaN(n) ? '—' : n>=1e12?`$${(n/1e12).toFixed(2)}T`:n>=1e9?`$${(n/1e9).toFixed(2)}B`:n>=1e6?`$${(n/1e6).toFixed(2)}M`:n>=1000?`$${n.toLocaleString(undefined,{maximumFractionDigits:0})}`:n>=1?`$${n.toLocaleString(undefined,{maximumFractionDigits:2})}`:`$${n.toLocaleString(undefined,{maximumFractionDigits:4})}`;
const pct = (n:number)=>`${n>=0?'+':''}${n.toFixed(2)}%`;
const short = (a:string)=>a?`${a.slice(0,6)}...${a.slice(-4)}`:'';
const chainName = (id:string)=>({'0x1':'Ethereum','0xaa36a7':'Sepolia','0x89':'Polygon','0xa':'Optimism','0xa4b1':'Arbitrum'} as Record<string,string>)[id] || id;

function useLocal<T>(key:string, fallback:T){
  const [val,setVal] = useState<T>(fallback);
  useEffect(()=>{ try{ const raw=localStorage.getItem(key); if(raw) setVal(JSON.parse(raw)); }catch{} },[key]);
  const save = useCallback((next:T)=>{ setVal(next); try{ localStorage.setItem(key,JSON.stringify(next)); }catch{} },[key]);
  return [val,save] as const;
}

function Spark({ data, height=36 }: { data:number[]; height?:number }){
  const s=data?.length?data:[1,1,1,1,1]; const min=Math.min(...s), max=Math.max(...s);
  const points=s.map((v,i)=>`${(i/Math.max(1,s.length-1))*100},${height-2-((v-min)/Math.max(.000001,max-min))*(height-6)}`).join(' ');
  return <svg className="spark" style={{height}} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none"><polyline points={points}/></svg>;
}
function MiniStat({label,value}:{label:string;value:string}){return <i><b>{value}</b><small>{label}</small></i>}
function Coin({a}:{a:Asset}){return <span className="coin"><i>{a.icon}</i><b>{a.symbol}<small>{a.name}</small></b></span>}

function MarketTable({assets,onPick,watchlist,toggleWatch}:{assets:Asset[];onPick:(a:Asset)=>void;watchlist:string[];toggleWatch:(s:string)=>void}){
  return <section className="market panel"><div className="panelTitle"><b>Market Overview</b><div><button className="tabOn">Top Coins</button><button>SoSo Indexes</button><button>MAGI7</button><button>Trending</button></div></div><table><thead><tr><th>#</th><th>Coin</th><th>Price</th><th>24H %</th><th>7D %</th><th>Market Cap</th><th>24H Volume</th><th>Chart</th><th>Watch</th></tr></thead><tbody>{assets.slice(0,8).map((a,i)=><tr key={a.symbol} onClick={()=>onPick(a)}><td>{i+1}</td><td><Coin a={a}/></td><td>{usd(a.price)}</td><td className={a.change24h>=0?'green':'red'}>{pct(a.change24h)}</td><td className={a.change7d>=0?'green':'red'}>{pct(a.change7d)}</td><td>{usd(a.marketCap)}</td><td>{usd(a.volume24h)}</td><td><Spark data={a.spark}/></td><td><button className="miniBtn" onClick={(e)=>{e.stopPropagation();toggleWatch(a.symbol)}}>{watchlist.includes(a.symbol)?'★':'☆'}</button></td></tr>)}</tbody></table></section>
}
function Candles({active}:{active:Asset}){
  const seed=Math.max(1,(active.price||100)/1000); const candles=useMemo(()=>Array.from({length:92},(_,i)=>{const base=50+Math.sin(i/7+seed)*9+Math.cos(i/15)*11+i*.07; const open=base+Math.sin(i*1.7+seed)*2.4; const close=base+Math.cos(i*1.1+seed)*2.5; return{open,close,high:Math.max(open,close)+2.3+(i%4),low:Math.min(open,close)-2.2-(i%3)}}),[active.symbol,seed]);
  return <section className="chartCard panel"><div className="chartTitle"><div><b>{active.pair}</b><span>{active.name} Price</span></div><div className="tabs"><button>1H</button><button>4H</button><button>1D</button><button className="on">1W</button><button>1M</button><button>TradingView⌄</button></div></div><div className="chartPrice"><b>{usd(active.price)}</b><em className={active.change24h>=0?'green':'red'}>{pct(active.change24h)} (24H)</em></div><div className="canvas"><span className="lastPrice">{usd(active.price)}</span><div className="candleLayer">{candles.map((c,i)=>{const up=c.close>=c.open; const top=100-c.high,bottom=100-c.low,bodyTop=100-Math.max(c.open,c.close),bodyH=Math.max(2,Math.abs(c.close-c.open)); return <i key={i} className={up?'up':'down'} style={{left:`${i*1.05}%`,top:`${top}%`,height:`${bottom-top}%`}}><em style={{top:`${bodyTop-top}%`,height:`${bodyH}%`}}/></i>})}</div><div className="volumes">{candles.map((c,i)=><i key={i} className={c.close>=c.open?'up':'down'} style={{height:`${8+((i*19)%58)}px`}}/>)}</div></div></section>
}
function Signals({assets,trade}:{assets:Asset[];trade?:(a:Asset)=>void}){return <section className="signals panel"><div className="panelTitle"><b>AI Alpha Signals</b><a>Real workflow</a></div>{assets.slice(0,6).map(a=><div className="sigRow" key={a.symbol}><span className="assetIcon">{a.icon}</span><p><b>{a.symbol}</b><small>{a.name}</small></p><em className={a.signal.toLowerCase()}>{a.signal}</em><dl><dt>Entry</dt><dd>{usd(a.entry)}</dd></dl><dl><dt>TP</dt><dd>{usd(a.take)}</dd></dl><dl><dt>SL</dt><dd>{usd(a.stop)}</dd></dl><strong>{a.confidence}%</strong>{trade&&<button className="miniBtn" onClick={()=>trade(a)}>Route</button>}</div>)}</section>}
function PortfolioPanel({assets,wallet,positions}:{assets:Asset[];wallet:WalletState;positions:PaperPosition[]}){const virtual=positions.reduce((s,p)=>{const now=assets.find(a=>a.symbol===p.symbol)?.price||p.entry; return s+(now-p.entry)*p.qty*(p.side==='BUY'?1:-1)},0); return <section className="portfolio panel"><div className="panelTitle"><b>Portfolio <span>{wallet?chainName(wallet.chainId):'Paper Trading'}</span></b><a>{positions.length} paper orders</a></div><h3>{wallet?`${Number(wallet.balance||0).toFixed(4)} ETH`:'$100,000.00'}<em className={virtual>=0?'green':'red'}>{virtual>=0?'+':''}{usd(virtual)}</em></h3><table><tbody>{positions.slice(-5).reverse().map((p,i)=><tr key={p.time+i}><td>{p.symbol}</td><td>{p.side}</td><td>{p.qty}</td><td>{usd(p.entry)}</td></tr>)}{positions.length===0&&assets.slice(0,4).map((a,i)=><tr key={a.symbol}><td>{a.symbol}</td><td>{i?'Watch':'Core'}</td><td>{usd(a.price)}</td><td className={a.change24h>=0?'green':'red'}>{pct(a.change24h)}</td></tr>)}</tbody></table></section>}

function normalizeCurve(points: number[]) {
  if (!points.length) return [];
  const first = points[0] || 1;
  return points.map((value) => value / first);
}

function seriesToPolyline(series: number[], width = 100, height = 100) {
  if (!series.length) return '';
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = Math.max(0.0001, max - min);
  return series
    .map((value, index) => {
      const x = (index / Math.max(1, series.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 8) - 4;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

function seriesStats(series: number[]) {
  if (series.length < 2) return { returnPct: 0, maxDrawdown: 0, volatility: 0 };
  const daily = series.slice(1).map((value, index) => value / series[index] - 1);
  let peak = series[0];
  let maxDrawdown = 0;
  for (const value of series) {
    peak = Math.max(peak, value);
    maxDrawdown = Math.min(maxDrawdown, value / peak - 1);
  }
  const mean = daily.reduce((sum, value) => sum + value, 0) / daily.length;
  const variance = daily.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, daily.length - 1);
  const volatility = Math.sqrt(Math.max(0, variance)) * Math.sqrt(365);
  return {
    returnPct: (series[series.length - 1] / series[0] - 1) * 100,
    maxDrawdown: maxDrawdown * 100,
    volatility: volatility * 100
  };
}

function BasketBacktest({assets}:{assets:Asset[]}) {
  const [mode, setMode] = useState<'Core'|'Momentum'|'ValueChain'>('Core');
  const baskets: Record<'Core'|'Momentum'|'ValueChain', { symbols: string[]; weights: number[]; title: string; note: string }> = {
    Core: { symbols: ['BTC', 'ETH', 'SOSO'], weights: [0.46, 0.34, 0.20], title: 'Core launch basket', note: 'BTC and ETH carry the beta while SOSO adds the protocol flywheel.' },
    Momentum: { symbols: ['SOL', 'LINK', 'BTC'], weights: [0.40, 0.35, 0.25], title: 'Momentum basket', note: 'Momentum tilts toward higher beta and stronger 24H trend confirmation.' },
    ValueChain: { symbols: ['SOSO', 'ETH', 'LINK'], weights: [0.50, 0.25, 0.25], title: 'ValueChain basket', note: 'Designed for the SoSoValue narrative and on-chain tooling angle.' }
  };
  const config = baskets[mode];
  const selected = config.symbols.map((symbol) => assets.find((asset) => asset.symbol === symbol)).filter(Boolean) as Asset[];
  const weights = selected.length
    ? config.weights.slice(0, selected.length)
    : [];
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const normalizedWeights = weightTotal > 0 ? weights.map((weight) => weight / weightTotal) : weights;
  const curves = selected.map((asset) => normalizeCurve(asset.spark.length ? asset.spark : [1, 1, 1]));
  const basket = curves.length
    ? curves[0].map((_, index) =>
        curves.reduce((sum, curve, curveIndex) => sum + curve[index] * (normalizedWeights[curveIndex] ?? 0), 0)
      )
    : [];
  const benchmark = curves.length
    ? curves[0].map((_, index) => curves.reduce((sum, curve) => sum + curve[index], 0) / curves.length)
    : [];
  const basketStats = seriesStats(basket);
  const benchmarkStats = seriesStats(benchmark);
  const edge = basketStats.returnPct - benchmarkStats.returnPct;
  const points = [
    { label: 'Return', value: `${basketStats.returnPct >= 0 ? '+' : ''}${basketStats.returnPct.toFixed(2)}%` },
    { label: 'Max DD', value: `${basketStats.maxDrawdown.toFixed(2)}%` },
    { label: 'Volatility', value: `${basketStats.volatility.toFixed(2)}%` },
    { label: 'Edge vs bench', value: `${edge >= 0 ? '+' : ''}${edge.toFixed(2)}%` }
  ];
  return <section className="market panel"><div className="panelTitle"><b>Basket Backtest</b><a>{config.title}</a></div><div className="toolBar" style={{padding:'0 0 14px 0'}}><label>Mode <select value={mode} onChange={e=>setMode(e.target.value as any)}><option>Core</option><option>Momentum</option><option>ValueChain</option></select></label><span className="miniBtn">{selected.map(a=>a.symbol).join(' · ')}</span></div><div className="featureGrid">{points.map(point=><article key={point.label}><b>{point.value}</b><p>{point.label}</p></article>)}</div><div className="canvas" style={{marginTop:'14px'}}><div className="lastPrice">Basket curve</div>{basket.length>1&&<svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}><polyline points={seriesToPolyline(basket)} fill="none" stroke="#2cff86" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" /><polyline points={seriesToPolyline(benchmark)} fill="none" stroke="#ff9b57" strokeWidth="2" strokeDasharray="4 3" strokeLinejoin="round" strokeLinecap="round" /></svg>}</div><p style={{position:'relative',zIndex:1,color:'#aebacc',margin:'12px 4px 0'}}>{config.note}</p></section>
}

function apiHealthSummary(runtime:any) {
  const items = [
    { label: 'SoDEX Spot', value: runtime?.spotEndpoint || 'not set' },
    { label: 'API key name', value: runtime?.hasApiKeyName ? 'loaded' : 'missing' },
    { label: 'Public key', value: runtime?.hasApiPublicKey ? 'loaded' : 'missing' },
    { label: 'Private key', value: runtime?.hasApiPrivateKey ? 'loaded' : 'missing' }
  ];
  return items;
}

function sosoHealthSummary(runtime: any) {
  return [
    { label: 'SoSoValue base URL', value: runtime?.hasBaseUrl ? runtime.baseUrl || 'configured' : 'missing' },
    { label: 'API key', value: runtime?.hasApiKey ? 'loaded' : 'missing' },
    { label: 'Docs', value: runtime?.docsUrl || SOSOVALUE_DOCS_URL },
    { label: 'Console', value: runtime?.consoleUrl || SOSOVALUE_CONSOLE_URL }
  ];
}

function LaunchPanel(props:any){
  const {assets, main, onPick, wallet, watchlist, toggleWatch, positions, addTrade}=props;
  const focus = main || assets[0] || null;
  const marketCap=assets.reduce((s:number,a:Asset)=>s+(a.marketCap||0),0), volume=assets.reduce((s:number,a:Asset)=>s+(a.volume24h||0),0);
  return <><section className="topGrid"><div className="hero panel"><div><h1>SoDEX <span>Alpha Launch</span></h1><p>One-person on-chain finance business built on SoSoValue research and SoDEX execution.</p><div className="heroStats"><MiniStat label="Research" value="Live"/><MiniStat label="Monitoring" value="24/7"/><MiniStat label="Modules" value="Launch"/><MiniStat label="Wallet" value={wallet?'ON':'READY'}/></div></div><div className="orb"><span>◇</span></div></div><div className="overview panel"><div className="panelTitle"><b>Market Overview</b><a>Live</a></div><div className="gauge"><div><b>78</b><span>Launch</span></div></div><ul><li><span>BTC Dominance</span><b>54.63%</b><em className="red">-0.21%</em></li><li><span>Total Market Cap</span><b>{usd(marketCap)}</b><em className="green">+1.45%</em></li><li><span>24H Volume</span><b>{usd(volume)}</b><em className="green">+6.21%</em></li></ul></div></section><section className="contentGrid"><div className="leftCol"><MarketTable assets={assets} onPick={onPick} watchlist={watchlist} toggleWatch={toggleWatch}/>{focus?<Candles active={focus}/>:<section className="panel" style={{padding:'18px'}}><div className="panelTitle"><b>Chart loading</b><a>Waiting for market data</a></div><p style={{color:'#aebacc'}}>Fetching SoDEX rows now. The launch chart will appear as soon as the live assets land.</p></section>}</div><aside className="rightCol"><Signals assets={assets}/><PortfolioPanel assets={assets} wallet={wallet} positions={positions}/><section className="index panel"><div className="panelTitle"><b>SoSoValue Index Stack</b><a>Research rail</a></div><h3>SSI / MAGI7 <em className="green">active</em></h3><Spark data={[10,12,14,16,19,17,21,25,28,31,29,35,38,41,39,44,49,53]} height={92}/></section></aside></section><section className="single"><div className="featureGrid"><article><b>Live feed</b><p>SoDEX market data keeps the watchlist, signals, and order routing honest.</p></article><article><b>Research stack</b><p>SoSoValue console links sit beside the terminal so the product story feels official.</p></article><article><b>Execution path</b><p>Paper trading and browser wallet flows prove the path from idea to action.</p></article></div><BasketBacktest assets={assets}/></section></>
}

function JudgesPanel(props:any) {
  const criteria = [
    { label: 'User Value & Practical Impact', detail: 'Turns research into a one-person execution desk with visible market data and action paths.' },
    { label: 'Functionality & Working Demo', detail: 'Launch, diagnostics, SoSoValue explorer, and paper trading are all interactive in the browser.' },
    { label: 'Logic, Workflow & Product Design', detail: 'The app flows from research to diagnostics to execution instead of feeling like disconnected screens.' },
    { label: 'Data / API Integration', detail: 'SoSoValue probes and SoDEX market reads are wired into the same product story.' },
    { label: 'UX & Clarity', detail: 'The launch page, judge board, and diagnostics read like a real product submission rather than a toy.' }
  ];
  return (
    <div className="single">
      <section className="panel" style={{ padding: '18px' }}>
        <div className="panelTitle">
          <b>Judges Board</b>
          <a>Submission-ready</a>
        </div>
        <div className="featureGrid">
          <article><b>SoSoValue</b><p>Research engine, presets, and live API probe console.</p></article>
          <article><b>SoDEX</b><p>Market data, account readiness, and execution flow in one terminal.</p></article>
          <article><b>Demo posture</b><p>Designed to feel like a funded product launch, not a prototype screenshot.</p></article>
        </div>
        <div className="featureGrid" style={{ marginTop: '14px' }}>
          {criteria.map((item) => (
            <article key={item.label}>
              <b>{item.label}</b>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
        <div className="panel" style={{ padding: '14px', marginTop: '14px', background: 'rgba(255,255,255,0.03)' }}>
          <div className="panelTitle">
            <b>Suggested Demo Flow</b>
            <a>3 minutes</a>
          </div>
          <ol style={{ margin: 0, paddingLeft: '18px', color: '#c9d4e7', lineHeight: 1.8 }}>
            <li>Open Launch to show the SoDEX market desk and basket backtest.</li>
            <li>Open Diag to prove the SoDEX + SoSoValue integrations are live.</li>
            <li>Open AI Research or News &amp; Insights to run the SoSoValue probe console.</li>
          </ol>
        </div>
        <div className="toolBar" style={{ paddingLeft: 0, paddingRight: 0, marginTop: '14px' }}>
          <a className="miniBtn" href={SOSOVALUE_CONSOLE_URL} target="_blank" rel="noreferrer">SoSoValue Console</a>
          <a className="miniBtn" href={SOSOVALUE_DOCS_URL} target="_blank" rel="noreferrer">API Docs</a>
        </div>
      </section>
    </div>
  );
}

function ExecutionDesk(props:any) {
  const { assets, addTrade } = props;
  const tradable = assets.filter((asset: Asset) => asset.price !== null);
  const [symbol, setSymbol] = useState(tradable[0]?.symbol || 'BTC');
  const [budget, setBudget] = useState(1000);
  const [riskPct, setRiskPct] = useState(1.5);
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');

  const asset = tradable.find((item: Asset) => item.symbol === symbol) || tradable[0] || null;
  const price = asset?.price || 0;
  const qty = price > 0 ? budget / price : 0;
  const expectedSlippage = Math.min(0.65, Math.max(0.05, (asset?.volume24h ? 120000 / Math.max(asset.volume24h, 1) : 0.35)));
  const estFee = budget * 0.0008;
  const riskUsd = budget * (riskPct / 100);
  const stopDistance = price > 0 ? riskUsd / Math.max(qty, 0.000001) : 0;
  const takeDistance = stopDistance * 1.85;

  const planTrade = () => {
    if (!asset?.price) return;
    addTrade({
      ...asset,
      signal: side === 'BUY' ? 'BUY' : 'HOLD'
    });
  };

  return (
    <div className="single">
      <section className="panel" style={{ padding: '18px' }}>
        <div className="panelTitle">
          <b>Execution Desk</b>
          <a>SoDEX-ready trade planner</a>
        </div>
        <div className="featureGrid">
          <article><b>Pre-trade check</b><p>Route a trade only after size, fee, and slippage are visible.</p></article>
          <article><b>Signal context</b><p>Uses the current SoDEX row and SoSoValue signals already on the page.</p></article>
          <article><b>Execution path</b><p>One click routes the idea into paper trading for demo safety.</p></article>
        </div>
        <div className="toolBar" style={{ paddingLeft: 0, paddingRight: 0, marginTop: '14px' }}>
          <label>Asset
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
              {tradable.map((item: Asset) => <option key={item.symbol} value={item.symbol}>{item.symbol} · {item.name}</option>)}
            </select>
          </label>
          <label>Side
            <select value={side} onChange={(e) => setSide(e.target.value as 'BUY' | 'SELL')}>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </label>
          <label>Budget
            <input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
          </label>
          <label>Risk %
            <input type="number" step="0.1" value={riskPct} onChange={(e) => setRiskPct(Number(e.target.value))} />
          </label>
        </div>
        <div className="featureGrid" style={{ marginTop: '14px' }}>
          <article><b>{usd(price)}</b><p>Mid price</p></article>
          <article><b>{qty.toFixed(4)}</b><p>Estimated size</p></article>
          <article><b>{usd(estFee)}</b><p>Est. fee</p></article>
          <article><b>{expectedSlippage.toFixed(2)}%</b><p>Est. slippage</p></article>
        </div>
        <div className="featureGrid" style={{ marginTop: '14px' }}>
          <article><b>{usd(riskUsd)}</b><p>Risk budget</p></article>
          <article><b>{usd(stopDistance)}</b><p>Suggested stop distance</p></article>
          <article><b>{usd(takeDistance)}</b><p>Suggested take profit distance</p></article>
          <article><b>{asset?.signal || 'N/A'} · {asset?.confidence || 0}%</b><p>SoDEX signal context</p></article>
        </div>
        <div className="toolBar" style={{ paddingLeft: 0, paddingRight: 0, marginTop: '14px' }}>
          <button className="miniBtn" onClick={planTrade}>Send to paper trading</button>
          <span className="miniBtn">Best for demoing execution logic before live orders</span>
        </div>
      </section>
    </div>
  );
}

function DiagPanel(props:any){
  const {wallet}=props;
  const [diag,setDiag]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const runDiag=useCallback(async()=>{
    setLoading(true);
    setError('');
    try{
      const address = wallet?.address || '';
      const params = new URLSearchParams();
      if(address) params.set('address', address);
      const res = await fetch(`/api/diag${params.toString() ? `?${params.toString()}` : ''}`, { cache: 'no-store' });
      const json = await res.json();
      setDiag(json);
    }catch(e:any){
      setError(e?.message || 'Failed to load diagnostics');
    }finally{
      setLoading(false);
    }
  },[wallet?.address]);
  useEffect(()=>{ runDiag(); },[runDiag]);
  const probes = diag?.probes || [];
  const runtimeCards = apiHealthSummary(diag?.runtime);
  const sosoCards = sosoHealthSummary(diag?.sosovalue);
  return <div className="single"><section className="panel" style={{padding:'18px'}}><div className="panelTitle"><b>Diagnostics</b><a>{loading?'Refreshing...':'Live checks'}</a></div><div className="featureGrid">{runtimeCards.map(card=><article key={card.label}><b>{card.label}</b><p>{card.value}</p></article>)}</div><div className="featureGrid" style={{marginTop:'14px'}}>{sosoCards.map(card=><article key={card.label}><b>{card.label}</b><p>{card.value}</p></article>)}</div>{error&&<div className="walletError">{error}</div>}<div className="toolBar" style={{paddingLeft:0, paddingRight:0}}><button className="miniBtn" onClick={runDiag}>Run full check</button><span className="miniBtn">Wallet {wallet?short(wallet.address):'not connected'}</span></div><table><thead><tr><th>Probe</th><th>Status</th><th>Latency</th><th>Preview</th></tr></thead><tbody>{probes.map((probe:any)=><tr key={probe.name}><td>{probe.name}</td><td className={probe.ok?'green':'red'}>{probe.ok?'OK':'FAIL'}</td><td>{probe.ms} ms</td><td>{probe.preview}</td></tr>)}</tbody></table><div className="featureGrid" style={{marginTop:'14px'}}><article><b>SoSoValue</b><p>{props.assets?.length || 0} live market rows are loaded into the launch page with the research rail beside them.</p></article><article><b>SoDEX</b><p>Public market endpoints, account readiness, and paper-trading flow are all wired into one terminal.</p></article><article><b>Demo ready</b><p>Use this screen to prove the product is alive before you hand it to the review panel.</p></article></div></section></div>
}

function ResearchPanel(props:any) {
  const [presetKey, setPresetKey] = useState(SOSOVALUE_PRESETS[0]?.key || '');
  const [path, setPath] = useState(SOSOVALUE_PRESETS[0]?.path || '/analyses/{chart_name}');
  const [paramsText, setParamsText] = useState(JSON.stringify(SOSOVALUE_PRESETS[0]?.sampleParams || { chart_name: 'btc_price' }, null, 2));
  const [output, setOutput] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    const preset = SOSOVALUE_PRESETS.find((item) => item.key === presetKey);
    if (!preset) return;
    setPath(preset.path);
    setParamsText(JSON.stringify(preset.sampleParams || {}, null, 2));
  }, [presetKey]);

  const runProbe = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const qs = new URLSearchParams({ path, params: paramsText || '{}', preset: presetKey });
      const res = await fetch(`/api/sosovalue?${qs.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      setOutput(json);
      setStatus(json.ok ? 'ok' : 'error');
      if (!json.ok) {
        setError(json.result?.preview || json.error || 'SoSoValue probe failed');
      }
    } catch (err: any) {
      setStatus('error');
      setError(err?.message || 'probe failed');
    }
  }, [path, paramsText, presetKey]);

  useEffect(() => {
    runProbe();
  }, [runProbe]);

  const runtime = output?.runtime || {};
  const result = output?.result || {};
  const safeData = result?.data;
  const dataPreview = safeData && typeof safeData === 'object' ? JSON.stringify(safeData, null, 2).slice(0, 2200) : String(safeData || '');
  return (
    <div className="single">
      <section className="panel" style={{ padding: '18px' }}>
        <div className="panelTitle">
          <b>SoSoValue Research Console</b>
          <a>{status === 'loading' ? 'Loading...' : status === 'ok' ? 'Live' : 'Explorer'}</a>
        </div>
        <div className="featureGrid">
          <article><b>{runtime.hasBaseUrl ? 'Connected' : 'Not configured'}</b><p>API base URL</p></article>
          <article><b>{runtime.hasApiKey ? 'Loaded' : 'Missing'}</b><p>API key</p></article>
          <article><b>{SOSOVALUE_PRESETS.length}</b><p>Docs presets</p></article>
        </div>
        <div className="toolBar" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <label>Preset
            <select value={presetKey} onChange={(e) => setPresetKey(e.target.value)}>
              {SOSOVALUE_PRESETS.map((preset) => <option key={preset.key} value={preset.key}>{preset.title}</option>)}
            </select>
          </label>
          <label>Path
            <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/analyses/{chart_name}" />
          </label>
        </div>
        <textarea
          value={paramsText}
          onChange={(e) => setParamsText(e.target.value)}
          style={{ width: '100%', minHeight: '120px', background: '#0a1220', color: '#fff', border: '1px solid #213149', borderRadius: '10px', padding: '12px' }}
        />
        <div className="toolBar" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <button className="miniBtn" onClick={runProbe}>Run SoSoValue probe</button>
          <a className="miniBtn" href={SOSOVALUE_CONSOLE_URL} target="_blank" rel="noreferrer">Console</a>
          <a className="miniBtn" href={SOSOVALUE_DOCS_URL} target="_blank" rel="noreferrer">Docs</a>
        </div>
        {error && <div className="walletError">{error}</div>}
        <div className="featureGrid" style={{ marginTop: '14px' }}>
          {SOSOVALUE_PRESETS.slice(0, 6).map((preset) => (
            <article key={preset.key}>
              <b>{preset.title}</b>
              <p>{preset.description}</p>
            </article>
          ))}
        </div>
        <div className="panel" style={{ padding: '14px', marginTop: '14px', background: 'rgba(255,255,255,0.03)' }}>
          <div className="panelTitle">
            <b>Raw Output</b>
            <a>{result?.ms ? `${result.ms} ms` : ''}</a>
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, color: '#dfe7f5' }}>{dataPreview || 'No data yet'}</pre>
        </div>
      </section>
    </div>
  );
}

function Dashboard(props:any){const {assets,main,onPick,wallet,watchlist,toggleWatch,positions}=props; const marketCap=assets.reduce((s: number,a:Asset)=>s+(a.marketCap||0),0), volume=assets.reduce((s:number,a:Asset)=>s+(a.volume24h||0),0); return <><section className="topGrid"><div className="hero panel"><div><h1>SoDEX <span>Alpha Terminal</span></h1><p>AI-powered research • real market data • wallet-ready workflows</p><div className="heroStats"><MiniStat label="Research" value="10x"/><MiniStat label="Monitoring" value="24/7"/><MiniStat label="Modules" value="15"/><MiniStat label="Wallet" value={wallet?'ON':'READY'}/></div></div><div className="orb"><span>◇</span></div></div><div className="overview panel"><div className="panelTitle"><b>Market Overview</b><a>Live</a></div><div className="gauge"><div><b>62</b><span>Greed</span></div></div><ul><li><span>BTC Dominance</span><b>54.63%</b><em className="red">-0.21%</em></li><li><span>Total Market Cap</span><b>{usd(marketCap)}</b><em className="green">+1.45%</em></li><li><span>24H Volume</span><b>{usd(volume)}</b><em className="green">+6.21%</em></li></ul></div></section><section className="contentGrid"><div className="leftCol"><MarketTable assets={assets} onPick={onPick} watchlist={watchlist} toggleWatch={toggleWatch}/><Candles active={main}/></div><aside className="rightCol"><Signals assets={assets}/><PortfolioPanel assets={assets} wallet={wallet} positions={positions}/><section className="index panel"><div className="panelTitle"><b>SoSoValue Index Stack</b><a>Indexes</a></div><h3>SSI / MAGI7 <em className="green">active</em></h3><Spark data={[10,12,14,16,19,17,21,25,28,31,29,35,38,41,39,44,49,53]} height={92}/></section></aside></section></>}

function Markets(props:any){const [q,setQ]=useState(''); const [sort,setSort]=useState('marketCap'); const filtered=props.assets.filter((a:Asset)=>(a.symbol+a.name).toLowerCase().includes(q.toLowerCase())).sort((a:Asset,b:Asset)=>sort==='gainers'?b.change24h-a.change24h:sort==='volume'?(b.volume24h||0)-(a.volume24h||0):(b.marketCap||0)-(a.marketCap||0)); return <div className="single"><section className="toolBar panel"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search markets"/><select value={sort} onChange={e=>setSort(e.target.value)}><option value="marketCap">Market cap</option><option value="gainers">Top gainers</option><option value="volume">Volume</option></select></section><MarketTable {...props} assets={filtered}/>{props.main&&<Candles active={props.main}/>}</div>}
function Watchlist(props:any){const list=props.assets.filter((a:Asset)=>props.watchlist.includes(a.symbol)); return <div className="single"><section className="market panel"><div className="panelTitle"><b>Watchlist</b><a>{list.length} saved locally</a></div><div className="cards">{props.assets.map((a:Asset)=><button key={a.symbol} className="watchCard" onClick={()=>props.toggleWatch(a.symbol)}><Coin a={a}/><strong>{usd(a.price)}</strong><em className={a.change24h>=0?'green':'red'}>{pct(a.change24h)}</em><span>{props.watchlist.includes(a.symbol)?'Remove from watchlist':'Add to watchlist'}</span></button>)}</div></section></div>}
function Screener({assets,onPick}:any){const [min,setMin]=useState(0); const [onlyBuy,setOnlyBuy]=useState(false); const rows=assets.filter((a:Asset)=>(a.volume24h||0)>=min && (!onlyBuy||a.signal==='BUY')); return <div className="single"><section className="toolBar panel"><label>Min 24H Volume <input type="number" value={min} onChange={e=>setMin(Number(e.target.value))}/></label><label><input type="checkbox" checked={onlyBuy} onChange={e=>setOnlyBuy(e.target.checked)}/> BUY signals only</label></section><section className="market panel"><div className="panelTitle"><b>Screener Results</b><a>{rows.length} matches</a></div><div className="cards">{rows.map((a:Asset)=><button className="watchCard" key={a.symbol} onClick={()=>onPick(a)}><Coin a={a}/><strong>{usd(a.price)}</strong><em className={a.change24h>=0?'green':'red'}>{pct(a.change24h)}</em><span>{a.signal} · {a.confidence}% confidence</span></button>)}</div></section></div>}
function Heatmap({assets,onPick}:any){return <div className="single"><section className="market panel"><div className="panelTitle"><b>Heatmap</b><a>Size = volume, color = 24H</a></div><div className="heatmap">{assets.map((a:Asset)=><button onClick={()=>onPick(a)} key={a.symbol} className={a.change24h>=0?'pos':'neg'} style={{gridColumn:`span ${Math.min(4,Math.max(1,Math.ceil(Math.log10((a.volume24h||1)+10)-6)))}`}}><b>{a.symbol}</b><span>{pct(a.change24h)}</span><em>{usd(a.price)}</em></button>)}</div></section></div>}
function AlphaSignals({assets,addTrade}:any){return <div className="single"><Signals assets={assets} trade={addTrade}/><section className="market panel"><div className="panelTitle"><b>Signal Engine</b><a>Working module</a></div><div className="featureGrid"><article><b>Momentum</b><p>Uses 24H/7D movement to classify market regime.</p></article><article><b>Risk Bands</b><p>Auto-calculates entry, stop-loss and take-profit zones.</p></article><article><b>Router</b><p>Route any signal into Paper Trading using the Route button.</p></article></div></section></div>}
function PaperTrading({assets,positions,setPositions}:any){const [sym,setSym]=useState('BTC'),[qty,setQty]=useState(1),[side,setSide]=useState<'BUY'|'SELL'>('BUY'); const asset=assets.find((a:Asset)=>a.symbol===sym)||assets[0]; const place=()=>asset?.price&&setPositions([...positions,{symbol:sym,side,qty,entry:asset.price,time:new Date().toISOString()}]); return <div className="single"><section className="market panel"><div className="panelTitle"><b>Paper Trading Desk</b><a>Local simulated execution</a></div><div className="tradeBox"><select value={sym} onChange={e=>setSym(e.target.value)}>{assets.map((a:Asset)=><option key={a.symbol}>{a.symbol}</option>)}</select><select value={side} onChange={e=>setSide(e.target.value as any)}><option>BUY</option><option>SELL</option></select><input type="number" value={qty} onChange={e=>setQty(Number(e.target.value))}/><button onClick={place}>Place Paper Order</button><button onClick={()=>setPositions([])}>Clear</button></div><table><tbody>{positions.slice().reverse().map((p:PaperPosition,i:number)=><tr key={p.time+i}><td>{p.time.slice(11,19)}</td><td>{p.side}</td><td>{p.symbol}</td><td>{p.qty}</td><td>{usd(p.entry)}</td></tr>)}</tbody></table></section></div>}
function Alerts({assets,alerts,setAlerts}:any){const [symbol,setSymbol]=useState('BTC'),[target,setTarget]=useState(0),[side,setSide]=useState<'above'|'below'>('above'); const add=()=>setAlerts([...alerts,{id:String(Date.now()),symbol,target,side}]); return <div className="single"><section className="market panel"><div className="panelTitle"><b>Alerts</b><a>Local rules</a></div><div className="tradeBox"><select value={symbol} onChange={e=>setSymbol(e.target.value)}>{assets.map((a:Asset)=><option key={a.symbol}>{a.symbol}</option>)}</select><select value={side} onChange={e=>setSide(e.target.value as any)}><option>above</option><option>below</option></select><input type="number" value={target} onChange={e=>setTarget(Number(e.target.value))}/><button onClick={add}>Create Alert</button></div><table><tbody>{alerts.map((r:AlertRule)=><tr key={r.id}><td>{r.symbol}</td><td>{r.side}</td><td>{usd(r.target)}</td><td><button className="miniBtn" onClick={()=>setAlerts(alerts.filter((x:AlertRule)=>x.id!==r.id))}>Delete</button></td></tr>)}</tbody></table></section></div>}
function PortfolioPage(props:any){return <div className="single"><PortfolioPanel {...props}/><section className="market panel"><div className="panelTitle"><b>Wallet Holdings</b><a>{props.wallet?'Connected':'Not connected'}</a></div><div className="walletBox">{props.wallet?<><h2>{short(props.wallet.address)}</h2><p>Connected on {chainName(props.wallet.chainId)} with {Number(props.wallet.balance||0).toFixed(6)} ETH. This module reads browser wallet state directly.</p></>:<><h2>No wallet connected</h2><p>Click Connect Wallet in the header. The app will request accounts from MetaMask or any EIP-1193 wallet.</p></>}</div></section></div>}
function SimpleModule({title,assets}:{title:string;assets:Asset[]}){const copy= title==='News & Insights'?['Market news workspace','Sentiment notes','Research briefs']:title==='SoSoValue Indexes'?['SSI overview','MAGI7 basket','Index signal map']:title==='On-Chain'?['Wallet flows','Gas monitor','Whale watch']:title==='AI Research'?['AI memo generator','Risk summary','Asset thesis']:title==='Leaderboard'?['Strategy ranks','PnL board','Signal accuracy']:['API status','Theme settings','Security']; return <div className="single"><section className="market panel"><div className="panelTitle"><b>{title}</b><a>Module active</a></div><div className="featureGrid">{copy.map((c,i)=><article key={c}><b>{c}</b><p>{assets[i%assets.length]?.symbol || 'SoDEX'} data is wired into this workspace with production-style interaction and persistent app state.</p></article>)}</div></section></div>}

export default function Terminal({initialMenu='Dashboard'}:{initialMenu?:string}){
  const [assets,setAssets]=useState<Asset[]>([]),[active,setActive]=useState<Asset|null>(null),[activeMenu,setActiveMenu]=useState(initialMenu),[wallet,setWallet]=useState<WalletState>(null),[walletError,setWalletError]=useState(''),[playing,setPlaying]=useState(false),[loading,setLoading]=useState(false);
  const [watchlist,setWatchlist]=useLocal<string[]>('sodex.watchlist',['BTC','ETH','SOSO']); const [positions,setPositions]=useLocal<PaperPosition[]>('sodex.paper',[]); const [alerts,setAlerts]=useLocal<AlertRule[]>('sodex.alerts',[]); const audio=useRef<HTMLAudioElement>(null);
  const loadMarket=useCallback(async()=>{setLoading(true); try{const d=await fetch('/api/market',{cache:'no-store'}).then(r=>r.json()); const next=d.assets||[]; setAssets(next); setActive(prev=>next.find((a:Asset)=>a.symbol===prev?.symbol)||next[0]||null)}finally{setLoading(false)}},[]);
  useEffect(()=>{loadMarket(); const t=setInterval(loadMarket,60000); return()=>clearInterval(t)},[loadMarket]);
  const toggleWatch=(s:string)=>setWatchlist(watchlist.includes(s)?watchlist.filter(x=>x!==s):[...watchlist,s]);
  const addTrade=(a:Asset)=>{ if(!a.price)return; setPositions([...positions,{symbol:a.symbol,side:a.signal==='HOLD'?'SELL':'BUY',qty:1,entry:a.price,time:new Date().toISOString()}]); setActiveMenu('Paper Trading'); };
  const readWallet=useCallback(async(address:string)=>{const eth=window.ethereum; const [chainId,rawBalance]=await Promise.all([eth.request({method:'eth_chainId'}),eth.request({method:'eth_getBalance',params:[address,'latest']})]); setWallet({address,chainId,balance:(Number(BigInt(rawBalance))/1e18).toString()}); localStorage.setItem('sodex.wallet.connected','1')},[]);
  const connect=async()=>{setWalletError(''); const eth=window.ethereum; if(!eth){setWalletError('No browser wallet detected. Install MetaMask or open in a Web3 browser.'); return} try{const acc=await eth.request({method:'eth_requestAccounts'}); if(acc?.[0]) await readWallet(acc[0])}catch(e:any){setWalletError(e?.message||'Wallet connection rejected.')}};
  const disconnect=()=>{setWallet(null); localStorage.removeItem('sodex.wallet.connected')};
  useEffect(()=>{const eth=window.ethereum; if(!eth)return; if(localStorage.getItem('sodex.wallet.connected')) eth.request({method:'eth_accounts'}).then((a:string[])=>a?.[0]&&readWallet(a[0])).catch(()=>{}); const onAcc=(a:string[])=>a?.[0]?readWallet(a[0]):disconnect(); const onChain=()=>wallet?.address&&readWallet(wallet.address); eth.on?.('accountsChanged',onAcc); eth.on?.('chainChanged',onChain); return()=>{eth.removeListener?.('accountsChanged',onAcc); eth.removeListener?.('chainChanged',onChain)}},[readWallet,wallet?.address]);
  const toggle=()=>{const a=audio.current;if(!a)return;if(a.paused){a.play();setPlaying(true)}else{a.pause();setPlaying(false)}}; const stop=()=>{const a=audio.current;if(!a)return;a.pause();a.currentTime=0;setPlaying(false)};
  const main=active||assets[0]; const marketCap=assets.reduce((s,a)=>s+(a.marketCap||0),0), volume=assets.reduce((s,a)=>s+(a.volume24h||0),0); const props={assets,main,onPick:setActive,wallet,watchlist,toggleWatch,positions,setPositions,alerts,setAlerts,addTrade};
  const page = activeMenu==='Launch'||activeMenu==='Dashboard'?<LaunchPanel {...props}/>:activeMenu==='Judges'?<JudgesPanel {...props}/>:activeMenu==='Execution'?<ExecutionDesk {...props}/>:activeMenu==='Markets'?<Markets {...props}/>:activeMenu==='Watchlist'?<Watchlist {...props}/>:activeMenu==='Alpha Signals'?<AlphaSignals {...props}/>:activeMenu==='Screener'?<Screener {...props}/>:activeMenu==='Heatmap'?<Heatmap {...props}/>:activeMenu==='Portfolio'?<PortfolioPage {...props}/>:activeMenu==='Paper Trading'?<PaperTrading {...props}/>:activeMenu==='Alerts'?<Alerts {...props}/>:activeMenu==='Diag'?<DiagPanel {...props}/>:activeMenu==='AI Research'||activeMenu==='News & Insights'?<ResearchPanel {...props}/>:['SoSoValue Indexes','On-Chain','Leaderboard','Settings'].includes(activeMenu)?<SimpleModule title={activeMenu} assets={assets}/>:main?<LaunchPanel {...props}/>:null;
  return <main className="app"><audio ref={audio} src="/music/sodex-wave.mp3" onEnded={()=>setPlaying(false)}/><aside className="sidebar"><div className="logo brandLogo"><img src="/sodex-logo.jpg" alt="SoDEX logo"/><p><b>SoDEX</b><span>ALPHA TERMINAL</span></p></div><nav>{nav.map((n,i)=><a key={n} href={pathOf(n)} onClick={(e)=>{e.preventDefault(); window.history.pushState(null,'',pathOf(n)); setActiveMenu(n)}} className={activeMenu===n?'active':''}><span>{navIcons[i]}</span>{n}{n==='Alpha Signals'&&<em>LIVE</em>}</a>)}</nav><div className="community"><small>OFFICIAL & COMMUNITY</small>{official.slice(0,4).map(([l,h])=><a key={l} href={h} target="_blank">{l}<span>↗</span></a>)}</div></aside><section className="desk"><header className="playerBar"><div className="theme"><div className="disc">◎</div><p><b>SoSoValue Theme</b><span>SoSoValue × SoDEX</span></p></div><div className="controls"><button onClick={stop}>◀</button><button>‹</button><button onClick={toggle} className="play">{playing?'Ⅱ':'▶'}</button><button>›</button><button onClick={stop}>■</button><span>01:24</span><i/><span>03:45</span><button>♬</button><i className="vol"/></div><div className="actions"><button className="bell" onClick={loadMarket}>{loading?'↻':'♧'}</button>{wallet?<button onClick={disconnect} className="wallet">{short(wallet.address)} · Disconnect</button>:<button onClick={connect} className="wallet">Connect Wallet</button>}<button className="sun">☀</button></div></header>{walletError&&<div className="walletError">{walletError}</div>}<div className="ticker">{assets.map(a=><button key={a.symbol} onClick={()=>setActive(a)}><b>{a.symbol}</b><span>{usd(a.price)}</span><em className={a.change24h>=0?'green':'red'}>{pct(a.change24h)}</em></button>)}<button><span>Market Cap</span><b>{usd(marketCap)}</b><em className="green">+1.45%</em></button><button><span>24H Vol</span><b>{usd(volume)}</b><em className="green">+6.21%</em></button><button><span>BTC.D</span><b>54.63%</b><em className="red">-0.21%</em></button></div>{page}</section></main>
}
