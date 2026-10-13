// Vercel serverless function: fetches the LeetCode solved counts on the server (no CORS problem)
// and lets Vercel's edge cache the answer for 60 seconds, so the site sees new solves within about a minute.
const USER = 'Anant_goyal2907';

module.exports = async (req, res) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com/u/' + USER + '/',
        'Origin': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
      },
      body: JSON.stringify({
        query: 'query($u:String!){matchedUser(username:$u){submitStatsGlobal{acSubmissionNum{difficulty count}}}}',
        variables: { u: USER }
      })
    });
    if (!r.ok) throw new Error('LeetCode answered ' + r.status);
    const j = await r.json();
    const list = j.data.matchedUser.submitStatsGlobal.acSubmissionNum;
    const pick = d => list.find(x => x.difficulty === d).count;
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json({ total: pick('All'), easy: pick('Easy'), medium: pick('Medium'), hard: pick('Hard') });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'unavailable' });
  } finally {
    clearTimeout(timer);
  }
};
