// Vercel serverless function: fetches LeetCode solved counts + submission calendar
// Cached for 60 seconds so the site sees new solves within about a minute.
const USER = 'Anant_goyal2907';

module.exports = async (req, res) => {
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
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
    const user = j.data.matchedUser;
    const list = user.submitStatsGlobal.acSubmissionNum;
    const pick = d => list.find(x => x.difficulty === d).count;
    const cal = user.userCalendar || {};
    let calendar = {};
    try {
      calendar = typeof cal.submissionCalendar === 'string'
        ? JSON.parse(cal.submissionCalendar)
        : (cal.submissionCalendar || {});
    } catch (e) {}
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json({
      total: pick('All'),
      easy: pick('Easy'),
      medium: pick('Medium'),
      hard: pick('Hard'),
      streak: cal.streak || 0,
      totalActiveDays: cal.totalActiveDays || 0,
      submissionCalendar: calendar
    });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'unavailable' });
  } finally {
    clearTimeout(timer);
  }
};
