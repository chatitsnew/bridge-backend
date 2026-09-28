/* ============================================================
   Bridge matching engine — extracted from the client-only demo
   into a standalone module so it can run behind a real API.
   No DOM, no globals — pure functions + data, safe for Node.
   ============================================================ */

const SKILLS = [
  {id:'python', name:'Python', aliases:['python']},
  {id:'javascript', name:'JavaScript', aliases:['javascript','js']},
  {id:'react', name:'React', aliases:['react','react.js','reactjs']},
  {id:'nodejs', name:'Node.js', aliases:['node.js','nodejs','node']},
  {id:'html', name:'HTML', aliases:['html']},
  {id:'css', name:'CSS', aliases:['css']},
  {id:'git', name:'Git', aliases:['git','github','version control']},
  {id:'sql', name:'SQL', aliases:['sql']},
  {id:'excel', name:'Excel', aliases:['excel','google sheets','spreadsheet','spreadsheets']},
  {id:'data_analysis', name:'Data Analysis', aliases:['data analysis','analyzing data','analysed data','analyzed data']},
  {id:'statistics', name:'Statistics', aliases:['statistics','statistical analysis']},
  {id:'data_viz', name:'Data Visualization', aliases:['data visualization','dashboards']},
  {id:'ml', name:'Machine Learning', aliases:['machine learning']},
  {id:'agile', name:'Agile/Scrum', aliases:['agile','scrum']},
  {id:'project_mgmt', name:'Project Management', aliases:['project management','managing projects']},
  {id:'stakeholder_comm', name:'Stakeholder Communication', aliases:['stakeholder communication','coordinating stakeholders']},
  {id:'scheduling', name:'Scheduling', aliases:['scheduling','coordinating appointments','coordinating schedules']},
  {id:'budget_mgmt', name:'Budget Management', aliases:['budget management','household budget','managing a budget']},
  {id:'crisis_mgmt', name:'Crisis Management', aliases:['crisis management','under pressure','fast decisions','high-pressure']},
  {id:'resource_prior', name:'Resource Prioritization', aliases:['resource prioritization','prioritizing resources','prioritization']},
  {id:'communication', name:'Communication', aliases:['communication','communicating']},
  {id:'leadership', name:'Leadership', aliases:['leadership','mentoring','led a team','leading a team']},
  {id:'uiux', name:'UI/UX', aliases:['ui/ux','user experience','ui design']},
  {id:'component_arch', name:'Component Architecture', aliases:['componentized','component-based','component architecture']},
  {id:'rest_api', name:'REST APIs', aliases:['rest api','rest apis']},
  {id:'aws', name:'AWS', aliases:['aws']},
  {id:'docker', name:'Docker', aliases:['docker','containers']},
  {id:'automation', name:'Automation', aliases:['automate','automation','automated']},
];

const ADJ = [
  ['python','data_analysis',0.65],['python','automation',0.6],['python','ml',0.5],
  ['react','javascript',0.95],['react','html',0.85],['react','css',0.85],
  ['react','component_arch',0.8],['react','uiux',0.55],
  ['nodejs','javascript',0.9],['nodejs','rest_api',0.7],
  ['data_analysis','statistics',0.6],['data_analysis','sql',0.5],
  ['data_analysis','data_viz',0.55],['data_analysis','excel',0.4],
  ['excel','data_analysis',0.4],
  ['crisis_mgmt','project_mgmt',0.6],['crisis_mgmt','stakeholder_comm',0.65],['crisis_mgmt','resource_prior',0.75],
  ['scheduling','stakeholder_comm',0.55],['scheduling','project_mgmt',0.5],
  ['budget_mgmt','resource_prior',0.6],['budget_mgmt','project_mgmt',0.45],
  ['resource_prior','project_mgmt',0.55],
  ['automation','data_analysis',0.4],
].map(([from,to,w])=>({from,to,w}));

const byId = Object.fromEntries(SKILLS.map(s=>[s.id,s]));
const byName = Object.fromEntries(SKILLS.map(s=>[s.name.toLowerCase(), s.id]));

const JOBS = [
  {name:'Data Analyst', company:'Healthcare Analytics Co.', required:['SQL','Excel','Data Analysis','Statistics'], preferred:['Python','Data Visualization'], minYears:2, degreeRequired:true, gapPolicy:true,
   desc:"We're looking for a rockstar Data Analyst to join our fast-paced healthcare analytics team. Bachelor's degree required. Candidates must have a continuous work history with no employment gaps in the last 3 years. 2+ years experience with SQL, Excel, and statistical analysis required.",
   flags:['rockstar','fast-paced','continuous work history']},
  {name:'Frontend Developer', company:'Nimbus Retail Tech', required:['JavaScript','React','HTML','CSS'], preferred:['Node.js','UI/UX'], minYears:3, degreeRequired:true, gapPolicy:false,
   desc:"Looking for a coding ninja who's a true digital native. Must have a B.Tech/BE degree and 3+ years of professional experience with JavaScript, React, HTML, and CSS.",
   flags:['coding ninja','digital native']},
  {name:'Junior Data Analyst (Remote)', company:'Meridian Insights', required:['Data Analysis','Excel'], preferred:['SQL','Python','Communication'], minYears:0, degreeRequired:false, gapPolicy:false,
   desc:"We welcome applicants from all educational backgrounds and career paths, including those returning after a career break. 0–1 years experience welcome; on-the-job training provided.",
   flags:[]},
  {name:'Project Coordinator', company:'Lighthouse Health Systems', required:['Project Management','Stakeholder Communication','Scheduling'], preferred:['Budget Management','Crisis Management'], minYears:2, degreeRequired:false, gapPolicy:true,
   desc:"Seeking an organized Project Coordinator. Must have no employment gaps in the last 3 years. 2+ years managing projects, coordinating stakeholders, and scheduling required.",
   flags:['no employment gaps']},
  {name:'Backend Engineer', company:'Forge Cloud Systems', required:['JavaScript','Node.js','Git','SQL'], preferred:['REST APIs','Docker','AWS'], minYears:2, degreeRequired:true, gapPolicy:false,
   desc:"Join our elite engineering team as a 10x Backend Engineer. Bachelor's in CS required. 2+ years with JavaScript, Node.js, Git, and SQL.",
   flags:['elite','10x']},
  {name:'Customer Insights Associate', company:'Bridgewell Analytics', required:['Data Analysis','Communication'], preferred:['SQL','Excel'], minYears:1, degreeRequired:false, gapPolicy:false,
   desc:"An entry-friendly analyst role. No specific degree required — we care about how you think about data. 1+ years of relevant experience, formal or informal.",
   flags:[]},
  {name:'DevOps Engineer', company:'Forge Cloud Systems', required:['Git','Docker','AWS'], preferred:['Automation','REST APIs'], minYears:2, degreeRequired:false, gapPolicy:false,
   desc:"Keep our deployment pipelines and cloud infrastructure running smoothly. No specific degree required — we care about hands-on experience. 2+ years working with Git, Docker, and AWS.",
   flags:[]},
  {name:'Product Designer', company:'Nimbus Retail Tech', required:['UI/UX','Communication'], preferred:['Component Architecture','Data Analysis'], minYears:1, degreeRequired:false, gapPolicy:false,
   desc:"Looking for a designer who can turn user feedback into clean, usable interfaces. No specific design pedigree required — we care about your process. 1+ years designing for real users.",
   flags:[]},
  {name:'Machine Learning Associate', company:'Bridgewell Analytics', required:['Python','Machine Learning'], preferred:['Data Analysis','Statistics'], minYears:1, degreeRequired:true, gapPolicy:false,
   desc:"Support our data science team building and evaluating predictive models. Bachelor's degree required. 1+ years of hands-on Python and machine learning experience.",
   flags:[]},
  {name:'Operations Program Lead', company:'Lighthouse Health Systems', required:['Leadership','Resource Prioritization','Budget Management'], preferred:['Crisis Management','Agile/Scrum'], minYears:3, degreeRequired:false, gapPolicy:true,
   desc:"Seeking a Program Lead who can juggle competing priorities and keep a budget on track under pressure. Must have no employment gaps in the last 3 years. 3+ years leading programs, managing budgets, and prioritizing resources.",
   flags:['no employment gaps']},
  {name:'Scrum Master', company:'Orbital Cloud Works', required:['Agile/Scrum','Stakeholder Communication'], preferred:['Project Management','Leadership'], minYears:2, degreeRequired:false, gapPolicy:false,
   desc:"Facilitate sprints and keep cross-functional teams aligned. No specific certification required — we care about how you run a room. 2+ years working in Agile/Scrum environments.",
   flags:[]},
  {name:'Full-Stack Engineer', company:'Nimbus Retail Tech', required:['JavaScript','React','Node.js'], preferred:['REST APIs','Component Architecture'], minYears:3, degreeRequired:true, gapPolicy:false,
   desc:"Join our elite full-stack squad shipping features end to end. Bachelor's in CS required. 3+ years across JavaScript, React, and Node.js.",
   flags:['elite']},
  {name:'Business Intelligence Analyst', company:'Healthcare Analytics Co.', required:['SQL','Data Visualization'], preferred:['Excel','Statistics'], minYears:2, degreeRequired:true, gapPolicy:true,
   desc:"Build dashboards that leadership actually reads. Bachelor's degree required. Candidates must have no employment gaps in the last 3 years. 2+ years with SQL and dashboarding tools.",
   flags:['no employment gaps']},
  {name:'Cloud Infrastructure Automation Engineer', company:'Forge Cloud Systems', required:['Automation','AWS'], preferred:['Docker','Git'], minYears:2, degreeRequired:false, gapPolicy:false,
   desc:"We're a lean team obsessed with automating away toil. Must be a 10x self-starter. 2+ years automating cloud infrastructure.",
   flags:['10x','self-starter']},
  {name:'Community Operations Coordinator', company:'Lighthouse Health Systems', required:['Scheduling','Crisis Management'], preferred:['Stakeholder Communication','Budget Management'], minYears:1, degreeRequired:false, gapPolicy:false,
   desc:"Keep community programs running when things get chaotic. We welcome applicants from all backgrounds, including career-break returners. 1+ years coordinating under pressure.",
   flags:[]},
  {name:'Junior Frontend Developer', company:'Meridian Insights', required:['HTML','CSS'], preferred:['JavaScript','React'], minYears:0, degreeRequired:false, gapPolicy:false,
   desc:"Entry point into frontend work — no professional experience required, just a portfolio and curiosity. 0+ years, on-the-job mentorship provided.",
   flags:[]},
  {name:'QA & Release Automation Engineer', company:'Bridgewell Analytics', required:['Automation','Git'], preferred:['Python','REST APIs'], minYears:2, degreeRequired:true, gapPolicy:false,
   desc:"Own our test automation and release pipeline. Bachelor's degree required. 2+ years automating QA workflows.",
   flags:[]},
  {name:'Data Visualization Specialist', company:'Healthcare Analytics Co.', required:['Data Visualization','Data Analysis'], preferred:['SQL','Excel'], minYears:1, degreeRequired:false, gapPolicy:false,
   desc:"Turn messy datasets into charts people actually understand. No design degree required. 1+ years building dashboards or reports.",
   flags:[]},
  {name:'Engineering Team Lead', company:'Forge Cloud Systems', required:['Leadership','Node.js','Git'], preferred:['Agile/Scrum','REST APIs'], minYears:4, degreeRequired:true, gapPolicy:false,
   desc:"Lead a small team of backend engineers as a true 10x tech lead. Bachelor's in CS required. 4+ years, including people leadership.",
   flags:['10x']},
  {name:'Grants & Budget Coordinator', company:'Lighthouse Health Systems', required:['Budget Management','Communication'], preferred:['Scheduling','Resource Prioritization'], minYears:1, degreeRequired:false, gapPolicy:true,
   desc:"Track program budgets and communicate spend to stakeholders. Must have no employment gaps in the last 3 years. 1+ years managing a budget.",
   flags:['no employment gaps']},
  {name:'UX Researcher', company:'Nimbus Retail Tech', required:['UI/UX','Data Analysis'], preferred:['Communication','Statistics'], minYears:2, degreeRequired:true, gapPolicy:false,
   desc:"Study how real users struggle with our product and turn it into design decisions. Bachelor's degree required. 2+ years of UX research or related analysis.",
   flags:[]},
  {name:'Platform Reliability Engineer', company:'Forge Cloud Systems', required:['Docker','AWS','Automation'], preferred:['Python','Git'], minYears:3, degreeRequired:false, gapPolicy:false,
   desc:"Keep production reliable at 3am too. No specific degree required — we care about incident scars. 3+ years running production infrastructure.",
   flags:[]},
];

function escapeRegex(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }

// A few aliases collide with common English words used as verbs, not the
// skill itself (e.g. "I excel at teamwork" is not a mention of MS Excel).
// Custom patterns here override the generic \b<alias>\b construction below.
const ALIAS_PATTERN_OVERRIDES = {
  'excel': '\\bexcel\\b(?!\\s+(?:at|in|as|when|beyond))',
};

// Guards against counting a skill the candidate explicitly says they
// DON'T have ("no experience with Python", "unfamiliar with SQL").
const NEGATION_TAIL = /\b(?:no|not|never|without|lack(?:ing)?\s+of|unfamiliar\s+with|not\s+familiar\s+with|no\s+experience\s+(?:with|in)|no\s+knowledge\s+of|no\s+formal\s+experience\s+(?:with|in)|haven't|hasn't|don't\s+have|doesn't\s+have)\s*$/i;

function extractExplicit(text){
  // Normalize hyphens to spaces so hyphenated phrasing like
  // "data-analysis" or "stakeholder-communication" still matches
  // two-word aliases like "data analysis".
  const lower = text.toLowerCase().replace(/-/g, ' ');
  const found = new Set();
  for(const s of SKILLS){
    for(const alias of s.aliases){
      // Aliases that themselves contain a hyphen (e.g. "high-pressure") need
      // the same hyphen-to-space normalization applied to the input text,
      // or they stop matching once hyphens in the text are turned to spaces.
      const source = ALIAS_PATTERN_OVERRIDES[alias] || ('\\b'+escapeRegex(alias.replace(/-/g,' '))+'\\b');
      const re = new RegExp(source, 'gi');
      let m, matched = false;
      while((m = re.exec(lower)) !== null){
        const before = lower.slice(Math.max(0, m.index - 40), m.index);
        if(!NEGATION_TAIL.test(before)){ matched = true; break; }
        if(m.index === re.lastIndex) re.lastIndex++; // guard against zero-length matches
      }
      if(matched){ found.add(s.id); break; }
    }
  }
  return found;
}
function literalFound(text, name){
  const pat = new RegExp('\\b'+escapeRegex(name.toLowerCase())+'\\b','i');
  return pat.test(text.toLowerCase());
}
function inferSkills(explicitSet){
  const inferred = new Map();
  for(const e of ADJ){
    if(explicitSet.has(e.from) && !explicitSet.has(e.to)){
      const cur = inferred.get(e.to);
      if(!cur || cur.confidence < e.w) inferred.set(e.to, {confidence:e.w, from:e.from});
    }
  }
  return inferred;
}
function skillsBreakdown(job, explicitSet, inferredMap){
  const rows = [];
  function addSkill(name, weight, isRequired){
    const id = byName[name.toLowerCase()];
    let type, contribution, confidence=null;
    if(explicitSet.has(id)){ type='explicit'; contribution=weight; }
    else if(inferredMap.has(id)){ type='inferred'; confidence=inferredMap.get(id).confidence; contribution=weight*confidence; }
    else { type='missing'; contribution=0; }
    rows.push({name, weight, isRequired, type, contribution, confidence});
  }
  job.required.forEach(n=>addSkill(n,2,true));
  job.preferred.forEach(n=>addSkill(n,1,false));
  const totalWeight = rows.reduce((a,r)=>a+r.weight,0);
  const totalGot = rows.reduce((a,r)=>a+r.contribution,0);
  return { rows, score: Math.round(100*totalGot/totalWeight) };
}
function traditionalResult(job, text, years, hasDegree, hadGap){
  const missing = job.required.filter(name=>!literalFound(text,name));
  const reasons=[];
  if(missing.length) reasons.push('Missing required keyword'+(missing.length>1?'s':'')+': '+missing.join(', '));
  if(years < job.minYears) reasons.push(`Needs ${job.minYears}+ yrs experience (has ${years})`);
  if(job.degreeRequired && !hasDegree) reasons.push("Requires a bachelor's degree on file");
  if(job.gapPolicy && hadGap) reasons.push('Employment-gap policy disqualifies');
  return {pass: reasons.length===0, reasons};
}

/**
 * Assembles the full per-job analysis given an already-computed explicit
 * skill set — the job-matching, scoring, and traditional-pass math is
 * always this same deterministic code, regardless of whether explicitSet
 * came from the regex engine or an optional AI-assisted extraction pass
 * (see ai-core.js). This is what keeps the fairness audit meaningful
 * either way: identity fields never flow into this function or into
 * whatever produced explicitSet.
 */
function assembleAnalysis({text, years=0, hasDegree=false, hadGap=false}, explicitSet){
  const inferredMap = inferSkills(explicitSet);
  const results = JOBS.map(job => {
    const trad = traditionalResult(job, text, years, hasDegree, hadGap);
    const skills = skillsBreakdown(job, explicitSet, inferredMap);
    return {
      job: job.name, company: job.company,
      traditional: trad,
      skillsScore: skills.score,
      breakdown: skills.rows,
    };
  });
  return {
    explicitSkills: [...explicitSet].map(id => byId[id].name),
    inferredSkills: [...inferredMap.entries()].map(([id,v]) => ({
      name: byId[id].name, confidence: v.confidence, inferredFrom: byId[v.from]?.name
    })),
    results,
    traditionalPassCount: results.filter(r=>r.traditional.pass).length,
    skillsMatchCount: results.filter(r=>r.skillsScore>=50).length,
    avgSkillsScore: Math.round(results.reduce((a,r)=>a+r.skillsScore,0)/results.length),
  };
}

/**
 * Full analysis for one candidate across every job, using the regex
 * engine's own extraction. NOTE: this function's signature has no
 * name/college/pronoun/identity parameter at all — that's not a policy,
 * it's a type-level fact. There is nothing to pass in even if a caller
 * wanted to.
 */
function analyzeCandidate(input){
  const explicitSet = extractExplicit(input.text);
  return assembleAnalysis(input, explicitSet);
}

module.exports = {
  SKILLS, ADJ, JOBS, byId, byName,
  extractExplicit, inferSkills, skillsBreakdown, traditionalResult,
  analyzeCandidate, assembleAnalysis,
};
