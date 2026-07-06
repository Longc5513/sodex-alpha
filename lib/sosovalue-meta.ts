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
  { key: 'currency-list', title: 'Currency List', path: '/currencies', description: 'Currency directory from SoSoValue.' },
  { key: 'currency-snapshot', title: 'Currency Snapshot', path: '/currencies/{currency_id}/market-snapshot', description: 'Single currency market snapshot.', sampleParams: { currency_id: '1673723677362319866' } },
  { key: 'currency-klines', title: 'Currency Klines', path: '/currencies/{currency_id}/klines', description: 'Daily price history for a currency.', sampleParams: { currency_id: '1673723677362319866', interval: '1d', limit: 30 } },
  { key: 'sector-spotlight', title: 'Sector Spotlight', path: '/currencies/sector-spotlight', description: 'Live SoSoValue sector rotation board.' },
  { key: 'indices-list', title: 'Indices List', path: '/indices', description: 'Available SoSoValue indices.' },
  { key: 'index-snapshot', title: 'Index Snapshot', path: '/indices/{index_ticker}/market-snapshot', description: 'Snapshot for SSI / MAGI7 style indices.', sampleParams: { index_ticker: 'ssiMAG7' } },
  { key: 'index-klines', title: 'Index Klines', path: '/indices/{index_ticker}/klines', description: 'Historical index series.', sampleParams: { index_ticker: 'ssiMAG7', interval: '1d', limit: 30 } },
  { key: 'news-feed', title: 'News Feed', path: '/news/feed', description: 'General news feed rail.' },
  { key: 'hot-news', title: 'Hot News', path: '/news/hot', description: 'Trending headlines.' },
  { key: 'featured-news', title: 'Featured News', path: '/news/featured', description: 'Curated featured items.' },
  { key: 'news-search', title: 'News Search', path: '/news/search', description: 'Searchable research feed.', sampleParams: { keyword: 'bitcoin' } },
  { key: 'fundraising-list', title: 'Fundraising Projects', path: '/fundraising/projects', description: 'Project list from the fundraising section.' },
  { key: 'fundraising-detail', title: 'Fundraising Detail', path: '/fundraising/projects/{id}', description: 'Project detail page.', sampleParams: { id: 'btc-spot-etf' } },
  { key: 'macro-events', title: 'Macro Events', path: '/macro/events', description: 'Upcoming macro events from SoSoValue.' }
];
