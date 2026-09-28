/* ============================================================
   Optional SAP AI Core (Generative AI Hub) skill-extraction layer.

   Purely additive: if the AICORE_* env vars below aren't set, or any
   call in here fails for ANY reason (network, timeout, bad JSON,
   AI Core outage), extractViaAiCore() resolves to null and the
   caller (server.js) falls back to the deterministic regex engine
   in engine.js. The app must never depend on this to function.

   Identity fields (name, age, college, pronouns) are never read by
   this module and never appear in the prompt sent to the model —
   only resume text goes in. So the fairness-audit's core guarantee
   (the engine never sees identity) holds whether or not this path
   is used, and whether or not it succeeds.

   Required env vars (set only in Railway's dashboard, never
   committed to this repo):
     AICORE_AUTH_URL        e.g. https://<subdomain>.authentication.<region>.hana.ondemand.com
     AICORE_CLIENT_ID
     AICORE_CLIENT_SECRET
     AICORE_API_URL         e.g. https://api.ai.prod.<region>.aws.ml.hana.ondemand.com
     AICORE_DEPLOYMENT_ID   the deployment id of a running gpt-4o / gpt-4o-mini deployment
   Optional:
     AICORE_RESOURCE_GROUP  defaults to "default"
   ============================================================ */
const https = require('https');
const { SKILLS, byName } = require('./engine.js');

const {
  AICORE_AUTH_URL,
  AICORE_CLIENT_ID,
  AICORE_CLIENT_SECRET,
  AICORE_API_URL,
  AICORE_DEPLOYMENT_ID,
  AICORE_RESOURCE_GROUP,
} = process.env;

const CONFIGURED = !!(AICORE_AUTH_URL && AICORE_CLIENT_ID && AICORE_CLIENT_SECRET && AICORE_API_URL && AICORE_DEPLOYMENT_ID);

let cachedToken = null; // { value, expiresAt }

function httpJSON(urlStr, { method = 'POST', headers = {}, body, timeoutMs = 8000 } = {}){
  return new Promise((resolve, reject) => {
    let url;
    try { url = new URL(urlStr); } catch(e){ return reject(e); }
    const payload = body == null ? null : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: { ...headers, ...(payload ? { 'Content-Length': payload.length } : {}) },
      timeout: timeoutMs,
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        if(res.statusCode < 200 || res.statusCode >= 300){
          return reject(new Error(`HTTP ${res.statusCode} from ${url.hostname}${url.pathname}: ${data.slice(0,300)}`));
        }
        try { resolve(data ? JSON.parse(data) : {}); }
        catch(e){ reject(new Error('Non-JSON response: ' + data.slice(0,300))); }
      });
    });
    req.on('timeout', () => req.destroy(new Error(`timeout after ${timeoutMs}ms`)));
    req.on('error', reject);
    if(payload) req.write(payload);
    req.end();
  });
}

async function getToken(){
  if(cachedToken && cachedToken.expiresAt > Date.now() + 30000) return cachedToken.value;
  const basic = Buffer.from(`${AICORE_CLIENT_ID}:${AICORE_CLIENT_SECRET}`).toString('base64');
  const data = await httpJSON(`${AICORE_AUTH_URL}/oauth/token?grant_type=client_credentials`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': '0',
    },
    body: '',
  });
  if(!data.access_token) throw new Error('OAuth response had no access_token');
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000 };
  return cachedToken.value;
}

const KNOWN_SKILL_NAMES = SKILLS.map(s => s.name);

function buildMessages(text){
  return [
    {
      role: 'system',
      content:
        'You extract ONLY skills that are explicitly present in resume text, from a fixed ' +
        'vocabulary. Return strict JSON of the shape {"explicit": string[]}. Each string must ' +
        'be copied EXACTLY from the vocabulary list below (same spelling and case) and included ' +
        'only if the resume text genuinely states or demonstrates that skill — not merely a ' +
        'nearby or loosely related word. If the text explicitly denies having a skill ' +
        '("no experience with X", "unfamiliar with Y"), leave it out. Never include a skill that ' +
        'is not in the vocabulary, and never invent one. Vocabulary: ' + KNOWN_SKILL_NAMES.join(', '),
    },
    { role: 'user', content: String(text).slice(0, 6000) },
  ];
}

/**
 * Resolves to { explicitSet: Set<skillId> } on success, or null on any
 * failure at all (not configured, network error, AI Core down, bad JSON).
 * Callers must treat null as "fall back to the deterministic engine" —
 * this function never throws.
 */
async function extractViaAiCore(text){
  if(!CONFIGURED) return null;
  try {
    const token = await getToken();
    const resourceGroup = AICORE_RESOURCE_GROUP || 'default';
    const url = `${AICORE_API_URL}/v2/inference/deployments/${AICORE_DEPLOYMENT_ID}/chat/completions?api-version=2024-10-21`;
    const data = await httpJSON(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'AI-Resource-Group': resourceGroup,
        'Content-Type': 'application/json',
      },
      body: {
        messages: buildMessages(text),
        temperature: 0,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      },
      timeoutMs: 8000,
    });
    const raw = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if(!raw) return null;
    const parsed = JSON.parse(raw);
    if(!parsed || !Array.isArray(parsed.explicit)) return null;
    const explicitSet = new Set();
    for(const name of parsed.explicit){
      const id = byName[String(name).toLowerCase()];
      if(id) explicitSet.add(id); // silently drop anything outside our vocabulary (hallucination-proof)
    }
    return { explicitSet };
  } catch(err){
    console.error('[ai-core] extraction failed, falling back to rule engine:', err && err.message || err);
    return null;
  }
}

module.exports = { extractViaAiCore, isConfigured: () => CONFIGURED };
