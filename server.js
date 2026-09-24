/* ============================================================
   Bridge API server — no external dependencies (no npm install
   needed), so it runs anywhere Node runs, including offline.
   Endpoints:
     GET  /api/jobs                 -> list of open roles
     POST /api/analyze              -> full candidate analysis
     POST /api/learning-pathway     -> course suggestions from gaps
     GET  /api/fairness-summary     -> latest batch audit result
   ============================================================ */
const http = require('http');
const { JOBS, analyzeCandidate } = require('./engine.js');
const { suggestCourses } = require('./learning-pathway.js');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;

function sendJSON(res, status, data){
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

function readBody(req){
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      if(!data) return resolve({});
      try { resolve(JSON.parse(data)); }
      catch(e){ reject(e); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if(req.method === 'OPTIONS'){ return sendJSON(res, 204, {}); }

  if(req.method === 'GET' && url.pathname === '/api/jobs'){
    return sendJSON(res, 200, { jobs: JOBS.map(j => ({
      name: j.name, company: j.company, required: j.required,
      preferred: j.preferred, minYears: j.minYears,
      degreeRequired: j.degreeRequired, gapPolicy: j.gapPolicy,
    })) });
  }

  if(req.method === 'POST' && url.pathname === '/api/analyze'){
    try {
      const body = await readBody(req);
      if(!body.text || typeof body.text !== 'string' || !body.text.trim()){
        return sendJSON(res, 400, { error: 'Missing required field: text' });
      }
      const result = analyzeCandidate({
        text: body.text,
        years: Number(body.years) || 0,
        hasDegree: !!body.hasDegree,
        hadGap: !!body.hadGap,
      });
      return sendJSON(res, 200, result);
    } catch(e){
      return sendJSON(res, 400, { error: 'Invalid request body', detail: String(e.message||e) });
    }
  }

  if(req.method === 'POST' && url.pathname === '/api/learning-pathway'){
    try {
      const body = await readBody(req);
      if(!body.jobName){
        return sendJSON(res, 400, { error: 'Missing required field: jobName' });
      }
      const analysis = analyzeCandidate({
        text: body.text || '', years: Number(body.years)||0,
        hasDegree: !!body.hasDegree, hadGap: !!body.hadGap,
      });
      const jobResult = analysis.results.find(r => r.job === body.jobName);
      if(!jobResult){
        return sendJSON(res, 404, { error: `No job named "${body.jobName}"` });
      }
      const gaps = jobResult.breakdown.filter(r => r.type === 'missing').map(r => r.name);
      return sendJSON(res, 200, { job: body.jobName, gaps, pathway: suggestCourses(gaps) });
    } catch(e){
      return sendJSON(res, 400, { error: 'Invalid request body', detail: String(e.message||e) });
    }
  }

  if(req.method === 'GET' && url.pathname === '/api/fairness-summary'){
    const reportPath = path.join(__dirname, 'fairness-report.json');
    if(!fs.existsSync(reportPath)){
      return sendJSON(res, 404, { error: 'No audit run yet — run `node fairness-audit.js` first' });
    }
    return sendJSON(res, 200, JSON.parse(fs.readFileSync(reportPath, 'utf8')));
  }

  if(req.method === 'GET' && url.pathname === '/api/health'){
    return sendJSON(res, 200, { status: 'ok', jobs: JOBS.length });
  }

  sendJSON(res, 404, { error: 'Not found', routes: ['GET /api/jobs','POST /api/analyze','POST /api/learning-pathway','GET /api/fairness-summary','GET /api/health'] });
});

server.listen(PORT, () => {
  console.log(`Bridge API listening on http://localhost:${PORT}`);
});
