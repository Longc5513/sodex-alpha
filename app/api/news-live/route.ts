import { NextRequest, NextResponse } from 'next/server';
import { requestSosovalue, sosovalueRuntimeStatus } from '../../../lib/sosovalue';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function toArray(payload: any) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.list)) return payload.list;
  if (Array.isArray(payload?.data?.list)) return payload.data.list;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function pickStoryContent(row: any) {
  if (typeof row?.content === 'string' && row.content.trim()) return row.content;
  if (Array.isArray(row?.multilanguageContent)) {
    const preferred = row.multilanguageContent.find((item: any) => item.language === 'en') || row.multilanguageContent[0];
    return preferred?.content || '';
  }
  return '';
}

function pickStoryTitle(row: any) {
  if (typeof row?.title === 'string' && row.title.trim()) return row.title;
  if (Array.isArray(row?.multilanguageContent)) {
    const preferred = row.multilanguageContent.find((item: any) => item.language === 'en') || row.multilanguageContent[0];
    return preferred?.title || '';
  }
  return '';
}

function normalizeStory(row: any, source: 'hot' | 'featured') {
  return {
    id: String(row.id || `${source}-${Math.random()}`),
    source,
    title: pickStoryTitle(row),
    summary: pickStoryContent(row).slice(0, 420),
    releaseTime: Number(row.release_time || row.releaseTime || 0),
    author: row.author || row.source || 'SoSoValue',
    link: row.source_link || row.sourceLink || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    image: row.featureImage || ''
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const featuredPageSize = Number(url.searchParams.get('featuredPageSize') || '6');

  const [hot, featured, macro] = await Promise.all([
    requestSosovalue('/news/hot'),
    requestSosovalue('/news/featured', { pageNum: 1, pageSize: featuredPageSize }),
    requestSosovalue('/macro/events')
  ]);

  const hotStories = toArray(hot.data).map((row: any) => normalizeStory(row, 'hot'));
  const featuredStories = toArray(featured.data).map((row: any) => normalizeStory(row, 'featured'));
  const stories = [...featuredStories, ...hotStories]
    .filter((story) => story.title)
    .sort((a, b) => (b.releaseTime || 0) - (a.releaseTime || 0));

  return NextResponse.json({
    runtime: sosovalueRuntimeStatus(),
    updatedAt: new Date().toISOString(),
    stories,
    featured: featuredStories,
    hot: hotStories,
    macroEvents: toArray(macro.data).map((row: any) => ({
      date: row.date || '',
      events: Array.isArray(row.events) ? row.events : []
    }))
  });
}
