import { NextRequest, NextResponse } from 'next/server';

export interface InstitutionResult {
  name: string;
  type: 'university' | 'school' | 'workplace' | 'place' | 'organization';
  location?: string;
  source: 'google' | 'wikipedia' | 'database';
}

// Curated popular institutions and organizations for instant fallback & precision
const CURATED_LIST: InstitutionResult[] = [
  // Top Universities & Colleges
  { name: 'Stanford University', type: 'university', location: 'California, USA', source: 'database' },
  { name: 'Harvard University', type: 'university', location: 'Massachusetts, USA', source: 'database' },
  { name: 'Massachusetts Institute of Technology (MIT)', type: 'university', location: 'Cambridge, USA', source: 'database' },
  { name: 'University of Oxford', type: 'university', location: 'Oxford, UK', source: 'database' },
  { name: 'University of Cambridge', type: 'university', location: 'Cambridge, UK', source: 'database' },
  { name: 'Indian Institute of Technology (IIT Bombay)', type: 'university', location: 'Mumbai, India', source: 'database' },
  { name: 'Indian Institute of Technology (IIT Delhi)', type: 'university', location: 'New Delhi, India', source: 'database' },
  { name: 'Indian Institute of Technology (IIT Madras)', type: 'university', location: 'Chennai, India', source: 'database' },
  { name: 'Indian Institute of Technology (IIT Kharagpur)', type: 'university', location: 'Kharagpur, India', source: 'database' },
  { name: 'University of Delhi (DU)', type: 'university', location: 'Delhi, India', source: 'database' },
  { name: "St. Stephen's College", type: 'university', location: 'Delhi, India', source: 'database' },
  { name: 'Hindu College', type: 'university', location: 'Delhi, India', source: 'database' },
  { name: 'Miranda House', type: 'university', location: 'Delhi, India', source: 'database' },
  { name: 'Shri Ram College of Commerce (SRCC)', type: 'university', location: 'Delhi, India', source: 'database' },
  { name: 'Lady Shri Ram College (LSR)', type: 'university', location: 'Delhi, India', source: 'database' },
  { name: 'Birla Institute of Technology and Science (BITS Pilani)', type: 'university', location: 'Pilani, India', source: 'database' },
  { name: 'National Institute of Technology (NIT Trichy)', type: 'university', location: 'Tiruchirappalli, India', source: 'database' },
  { name: 'University of California, Berkeley (UC Berkeley)', type: 'university', location: 'California, USA', source: 'database' },
  { name: 'University of California, Los Angeles (UCLA)', type: 'university', location: 'California, USA', source: 'database' },
  { name: 'University of Toronto', type: 'university', location: 'Toronto, Canada', source: 'database' },
  { name: 'National University of Singapore (NUS)', type: 'university', location: 'Singapore', source: 'database' },

  // Top Schools
  { name: 'Delhi Public School (DPS R.K. Puram)', type: 'school', location: 'New Delhi, India', source: 'database' },
  { name: 'Delhi Public School (DPS Vasant Kunj)', type: 'school', location: 'New Delhi, India', source: 'database' },
  { name: "St. Xavier's High School", type: 'school', location: 'Mumbai, India', source: 'database' },
  { name: 'The Doon School', type: 'school', location: 'Dehradun, India', source: 'database' },
  { name: 'The Mother\'s International School', type: 'school', location: 'New Delhi, India', source: 'database' },
  { name: 'Modern School, Barakhamba', type: 'school', location: 'New Delhi, India', source: 'database' },
  { name: 'La Martiniere for Boys/Girls', type: 'school', location: 'Kolkata, India', source: 'database' },
  { name: 'The Cathedral and John Connon School', type: 'school', location: 'Mumbai, India', source: 'database' },

  // Top Workplaces & Tech Companies
  { name: 'Google (Alphabet Inc.)', type: 'workplace', location: 'Mountain View, USA & Global', source: 'database' },
  { name: 'Microsoft Corporation', type: 'workplace', location: 'Redmond, USA & Global', source: 'database' },
  { name: 'Apple Inc.', type: 'workplace', location: 'Cupertino, USA & Global', source: 'database' },
  { name: 'Amazon Web Services / Amazon', type: 'workplace', location: 'Seattle, USA & Global', source: 'database' },
  { name: 'Meta (Facebook / Instagram)', type: 'workplace', location: 'Menlo Park, USA & Global', source: 'database' },
  { name: 'Tata Consultancy Services (TCS)', type: 'workplace', location: 'Global & India', source: 'database' },
  { name: 'Infosys', type: 'workplace', location: 'Bengaluru, India', source: 'database' },
  { name: 'Wipro', type: 'workplace', location: 'Bengaluru, India', source: 'database' },
  { name: 'Deloitte', type: 'workplace', location: 'Global', source: 'database' },
  { name: 'McKinsey & Company', type: 'workplace', location: 'Global', source: 'database' },
  { name: 'Goldman Sachs', type: 'workplace', location: 'Global & New York', source: 'database' },
];

function categorizeQuery(text: string): 'university' | 'school' | 'workplace' | 'place' | 'organization' {
  const lower = text.toLowerCase();
  if (lower.includes('univ') || lower.includes('college') || lower.includes('institute') || lower.includes('campus') || lower.includes('iit') || lower.includes('nit') || lower.includes('bits') || lower.includes('faculty')) {
    return 'university';
  }
  if (lower.includes('school') || lower.includes('academy') || lower.includes('vidyalaya') || lower.includes('dps') || lower.includes('high') || lower.includes('convent') || lower.includes('class')) {
    return 'school';
  }
  if (lower.includes('corp') || lower.includes('technologies') || lower.includes('pvt') || lower.includes('ltd') || lower.includes('inc') || lower.includes('company') || lower.includes('solutions') || lower.includes('consulting') || lower.includes('google') || lower.includes('microsoft') || lower.includes('amazon') || lower.includes('tcs') || lower.includes('infosys')) {
    return 'workplace';
  }
  if (lower.includes('area') || lower.includes('city') || lower.includes('town') || lower.includes('colony') || lower.includes('nagar') || lower.includes('street') || lower.includes('road') || lower.includes('park') || lower.includes('sector')) {
    return 'place';
  }
  return 'organization';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: CURATED_LIST.slice(0, 8) });
  }

  const resultsMap = new Map<string, InstitutionResult>();

  // 1. Check local curated list first
  const queryLower = query.toLowerCase();
  for (const item of CURATED_LIST) {
    if (item.name.toLowerCase().includes(queryLower) || (item.location && item.location.toLowerCase().includes(queryLower))) {
      resultsMap.set(item.name.toLowerCase(), item);
    }
  }

  // 2. Fetch live suggestions from Google Suggest API
  try {
    const googleUrl = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`;
    const googleRes = await fetch(googleUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(2000),
    });

    if (googleRes.ok) {
      const data = await googleRes.json();
      const suggestions: string[] = Array.isArray(data[1]) ? data[1] : [];

      for (const s of suggestions.slice(0, 6)) {
        const cleanName = s.trim();
        const key = cleanName.toLowerCase();
        if (!resultsMap.has(key) && cleanName.length > 2) {
          resultsMap.set(key, {
            name: cleanName,
            type: categorizeQuery(cleanName),
            location: 'Verified Online / Search Result',
            source: 'google',
          });
        }
      }
    }
  } catch (err) {
    // Graceful fallback if external request fails
  }

  // 3. Fetch from Wikipedia OpenSearch API for accredited institutions
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&namespace=0&format=json`;
    const wikiRes = await fetch(wikiUrl, {
      headers: { 'User-Agent': 'SecretFeelingsVault/1.0 (https://secretfeelingsvault.com)' },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(2000),
    });

    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      const titles: string[] = Array.isArray(wikiData[1]) ? wikiData[1] : [];
      const descriptions: string[] = Array.isArray(wikiData[2]) ? wikiData[2] : [];

      for (let i = 0; i < titles.length; i++) {
        const title = titles[i]?.trim();
        const desc = descriptions[i]?.trim() || '';
        const key = title.toLowerCase();

        if (title && !resultsMap.has(key)) {
          resultsMap.set(key, {
            name: title,
            type: categorizeQuery(title + ' ' + desc),
            location: desc.slice(0, 60) || 'Global Knowledge Base',
            source: 'wikipedia',
          });
        }
      }
    }
  } catch (err) {
    // Graceful fallback
  }

  const results = Array.from(resultsMap.values()).slice(0, 10);

  return NextResponse.json(
    { results, query },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
