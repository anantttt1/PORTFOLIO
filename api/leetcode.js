// Vercel serverless: LeetCode solved counts + submission calendar (60s cache)
const USER = 'Anant_goyal2907';
const ALLOWED_ORIGINS = new Set([
  'https://anantportfolio-eight.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);

function setCors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com/u/' + USER + '/',
        'Origin': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (compatible; PortfolioBot/1.0)'
      },
      body: JSON.stringify({
        query: `query($u:String!){
          matchedUser(username:$u){
            submitStatsGlobal{acSubmissionNum{difficulty count}}
            userCalendar{streak totalActiveDays submissionCalendar}
          }
        }`,
        variables: { u: USER }
      })
    });
    if (!r.ok) throw new Error('LeetCode answered ' + r.status);
    const j = await r.json();
    const user = j && j.data && j.data.matchedUser;
    if (!user || !user.submitStatsGlobal || !Array.isArray(user.submitStatsGlobal.acSubmissionNum)) {
      throw new Error('unexpected payload');
    }
    const list = user.submitStatsGlobal.acSubmissionNum;
    const pick = (d) => {
      const row = list.find((x) => x && x.difficulty === d);
      const n = row ? Number(row.count) : NaN;
      return Number.isFinite(n) ? n : 0;
    };
    const cal = user.userCalendar || {};
    let calendar = {};
    try {
      calendar = typeof cal.submissionCalendar === 'string'
        ? JSON.parse(cal.submissionCalendar)
        : (cal.submissionCalendar || {});
      if (!calendar || typeof calendar !== 'object' || Array.isArray(calendar)) calendar = {};
    } catch (e) {
      calendar = {};
    }
    const clean = {};
    for (const [k, v] of Object.entries(calendar)) {
      if (/^\d+$/.test(k)) {
        const n = Number(v);
        if (Number.isFinite(n) && n >= 0 && n < 10000) clean[k] = Math.floor(n);
      }
    }
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json({
      total: pick('All'),
      easy: pick('Easy'),
      medium: pick('Medium'),
      hard: pick('Hard'),
      streak: Number(cal.streak) || 0,
      totalActiveDays: Number(cal.totalActiveDays) || 0,
      submissionCalendar: clean
    });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'unavailable' });
  } finally {
    clearTimeout(timer);
  }
};
