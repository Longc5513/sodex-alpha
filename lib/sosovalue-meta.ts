export type SosoPreset = {
  key: string;
  title: string;
  path: string;
  description: string;
  sampleParams?: Record<string, any>;
};

export const SOSOVALUE_CONSOLE_URL = 'https://sosovalue.com/developer/dashboard';
export const SOSOVALUE_DOCS_URL = 'https://sosovalue-1.gitbook.io/sosovalue-api-doc';

export const SOSOVALUE_PRESETS: SosoPreset[] = [
  { key: 'analysis-chart', title: 'Analysis Chart', path: '/analyses/{chart_name}', description: 'Chart data family from the official docs.', sampleParams: { chart_name: 'btc_price' } },
  { key: 'currency-list', title: 'Currency List', path: '/currencies', description: 'Currency & pairs index.', sampleParams: { coin: 'BTC' } },
  { key: 'currency-info', title: 'Currency Info', path: '/currencies/{coin}', description: 'Single currency detail view.', sampleParams: { coin: 'BTC' } },
  { key: 'market-snapshot', title: 'Market Snapshot', path: '/market/snapshot', description: 'Snapshot summary for the live market rail.' },
  { key: 'token-economics', title: 'Token Economics', path: '/tokens/{coin}/economics', description: 'Token economics and supply context.', sampleParams: { coin: 'BTC' } },
  { key: 'historical-klines', title: 'Historical Klines', path: '/markets/{symbol}/klines', description: 'Price history for charts/backtests.', sampleParams: { symbol: 'vBTC_vUSDC' } },
  { key: 'news-feed', title: 'News Feed', path: '/news/feed', description: 'General news feed rail.' },
  { key: 'hot-news', title: 'Hot News', path: '/news/hot', description: 'Trending headlines.' },
  { key: 'featured-news', title: 'Featured News', path: '/news/featured', description: 'Curated featured items.' },
  { key: 'news-search', title: 'News Search', path: '/news/search', description: 'Searchable research feed.', sampleParams: { keyword: 'bitcoin' } },
  { key: 'fundraising-list', title: 'Fundraising Projects', path: '/fundraising/projects', description: 'Project list from the fundraising section.' },
  { key: 'fundraising-detail', title: 'Fundraising Detail', path: '/fundraising/projects/{id}', description: 'Project detail page.', sampleParams: { id: 'btc-spot-etf' } },
  { key: 'macro', title: 'Macro', path: '/macro', description: 'Macro dashboard and events.' }
];
