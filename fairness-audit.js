/* ============================================================
   Statistical fairness audit — generalizes the single Priya/
   Vikram proof from the deck to N different candidates.

   Important honesty note: Bridge's analyzeCandidate() has no
   name/age/college/pronoun parameter at all, so a naive swap test
   would trivially always show 0% delta — that's not a strong
   empirical claim, it's just re-stating the function signature.

   This audit does something more meaningful: it injects a fake
   identity header (name, age, college, pronouns) directly INTO
   the resume text — exactly as a real uploaded resume would
   contain it — and runs the FULL text pipeline (extractExplicit +
   traditionalResult, which do scan the raw text) on both
   versions. This actually tests whether a name, age, or college
   that happens to appear in real resume text could ever leak into
   the score, not just whether a parameter exists.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { analyzeCandidate, JOBS } = require('./engine.js');

const IDENTITY_A = { name: 'Priya Selvam', age: 29, college: 'Govt. Arts College, Madurai', pronoun: 'she' };
const IDENTITY_B = { name: 'Vikram Mehta', age: 45, college: 'IIT Delhi', pronoun: 'he' };
const IDENTITY_C = { name: 'Fatima Sheikh', age: 22, college: 'Regional Engineering College', pronoun: 'she' };
const IDENTITY_D = { name: 'Arjun Kumar', age: 51, college: 'no formal degree, self-taught', pronoun: 'he' };

function withHeader(identity, body){
  return `${identity.name}, age ${identity.age}. Education: ${identity.college}. `
       + `Pronouns: ${identity.pronoun}/${identity.pronoun}. `
       + body;
}

// 12 varied synthetic candidates — different skill mixes, different
// experience/gap patterns, independent of the 3 rehearsed demo personas.
const CANDIDATES = [
  { years:1, hasDegree:true,  hadGap:true,  body:"Worked one year as a data entry associate, using Excel and Google Sheets daily. Took a two-year gap for family caregiving, during which I completed online courses in Python and data analysis fundamentals." },
  { years:0, hasDegree:false, hadGap:false, body:"Recent bootcamp graduate. Built two projects using JavaScript, React, and CSS. Comfortable with HTML and Git for version control." },
  { years:3, hasDegree:true,  hadGap:false, body:"Three years as a backend developer working with Node.js, SQL, and REST APIs. Deployed services using Docker and AWS. Used Git daily in an agile team." },
  { years:2, hasDegree:false, hadGap:true,  body:"Coordinated logistics for a family business for two years, managing budgets and scheduling appointments under pressure. Took a one-year gap to relocate. Self-taught SQL and Excel for inventory tracking." },
  { years:1, hasDegree:true,  hadGap:false, body:"One year as a customer insights analyst. Used data analysis and communication skills daily to present findings to stakeholders. Familiar with Excel and basic SQL." },
  { years:0, hasDegree:true,  hadGap:false, body:"Fresh graduate with a degree in statistics. Coursework covered data analysis, statistics, and data visualization using dashboards. No professional experience yet." },
  { years:4, hasDegree:true,  hadGap:false, body:"Four years leading small engineering teams. Strong in JavaScript, React, and component architecture. Mentoring junior engineers and leadership are core to my role." },
  { years:2, hasDegree:false, hadGap:false, body:"Two years freelance web developer. React, HTML, CSS, and UI/UX design for small business clients. Learning Node.js for backend work." },
  { years:1, hasDegree:false, hadGap:true,  body:"One year in project coordination before a career gap. Scheduling, stakeholder communication, and crisis management under pressure were daily requirements. Currently returning to the workforce." },
  { years:0, hasDegree:false, hadGap:false, body:"Self-taught programmer exploring Python and automation. Built scripts to automate personal expense tracking and basic data analysis of spending patterns." },
  { years:5, hasDegree:true,  hadGap:false, body:"Five years as a cloud engineer. AWS, Docker, and automation are daily tools. Strong Git and SQL background from prior data engineering role." },
  { years:2, hasDegree:true,  hadGap:true,  body:"Two years as a healthcare project coordinator, then a gap for medical reasons. Budget management, resource prioritization, and stakeholder communication were core responsibilities." },
];

const IDENTITY_PAIRS = [
  [IDENTITY_A, IDENTITY_B],
  [IDENTITY_C, IDENTITY_D],
];

function runAudit(){
  const comparisons = [];
  let maxAbsDelta = 0;
  let mismatches = 0;

  CANDIDATES.forEach((cand, i) => {
    const [idA, idB] = IDENTITY_PAIRS[i % IDENTITY_PAIRS.length];
    const textA = withHeader(idA, cand.body);
    const textB = withHeader(idB, cand.body);

    const resA = analyzeCandidate({ text: textA, years: cand.years, hasDegree: cand.hasDegree, hadGap: cand.hadGap });
    const resB = analyzeCandidate({ text: textB, years: cand.years, hasDegree: cand.hasDegree, hadGap: cand.hadGap });

    resA.results.forEach((jobResA, j) => {
      const jobResB = resB.results[j];
      const delta = Math.abs(jobResA.skillsScore - jobResB.skillsScore);
      maxAbsDelta = Math.max(maxAbsDelta, delta);
      if(delta !== 0) mismatches++;
      comparisons.push({
        candidate: i+1, job: jobResA.job,
        identityA: idA.name, scoreA: jobResA.skillsScore,
        identityB: idB.name, scoreB: jobResB.skillsScore,
        delta,
      });
    });
  });

  const report = {
    generatedAt: new Date().toISOString(),
    candidatesTested: CANDIDATES.length,
    jobsPerCandidate: JOBS.length,
    totalComparisons: comparisons.length,
    maxAbsoluteScoreDelta: maxAbsDelta,
    mismatchesFound: mismatches,
    verdict: mismatches === 0
      ? `Identical scores in ${comparisons.length}/${comparisons.length} identity-swap comparisons across ${CANDIDATES.length} independently-written candidates.`
      : `${mismatches} of ${comparisons.length} comparisons showed a nonzero score delta — investigate before claiming identity-blindness.`,
    comparisons,
  };

  fs.writeFileSync(path.join(__dirname, 'fairness-report.json'), JSON.stringify(report, null, 2));
  return report;
}

if(require.main === module){
  const report = runAudit();
  console.log(`\nCandidates tested: ${report.candidatesTested}`);
  console.log(`Total comparisons: ${report.totalComparisons} (${report.candidatesTested} candidates x ${report.jobsPerCandidate} jobs)`);
  console.log(`Max absolute score delta: ${report.maxAbsoluteScoreDelta}`);
  console.log(`Mismatches: ${report.mismatchesFound}`);
  console.log(`\n${report.verdict}\n`);
  console.log('Full report written to fairness-report.json');
}

module.exports = { runAudit };
