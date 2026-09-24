/* ============================================================
   Learning Pathway agent — thin, honest version.
   Not a real course-market integration (that's still roadmap —
   say so on stage). This is a static, curated lookup: given a
   candidate's missing skills for a role, suggest a short,
   plausible path to close each gap. It's real code that runs
   and returns real suggestions — just not backed by a live
   course-catalog API yet.
   ============================================================ */

const COURSE_MAP = {
  'JavaScript': ['freeCodeCamp: JavaScript Algorithms and Data Structures', 'The Odin Project: Foundations'],
  'React': ['React official docs: Learn React', 'freeCodeCamp: Front End Development Libraries'],
  'HTML': ['freeCodeCamp: Responsive Web Design'],
  'CSS': ['freeCodeCamp: Responsive Web Design', 'CSS Grid & Flexbox for Web Design (Coursera)'],
  'Node.js': ['Node.js official guides', 'The Odin Project: NodeJS'],
  'Git': ['GitHub Skills: Introduction to GitHub'],
  'SQL': ['Mode Analytics SQL Tutorial', 'freeCodeCamp: Relational Database'],
  'Excel': ['Microsoft Excel Skills for Business (Coursera)'],
  'Data Analysis': ['Google Data Analytics Certificate (Coursera)'],
  'Statistics': ['Khan Academy: Statistics and Probability'],
  'Data Visualization': ['Google Data Analytics: Share Data Through Visualization'],
  'Python': ['CS50P: Introduction to Programming with Python'],
  'Machine Learning': ['Andrew Ng: Machine Learning Specialization (Coursera)'],
  'Project Management': ['Google Project Management Certificate (Coursera)'],
  'Stakeholder Communication': ['Google Project Management: Foundations of Project Management'],
  'Scheduling': ['Google Project Management: Project Planning'],
  'Budget Management': ['Google Project Management: Project Execution'],
  'Crisis Management': ['Coursera: Crisis Management and Communications'],
  'Resource Prioritization': ['Google Project Management: Project Planning'],
  'Communication': ['Coursera: Improving Communication Skills'],
  'Leadership': ['Coursera: Leading People and Teams'],
  'UI/UX': ['Google UX Design Certificate (Coursera)'],
  'REST APIs': ['freeCodeCamp: Back End Development and APIs'],
  'AWS': ['AWS Skill Builder: Cloud Practitioner Essentials'],
  'Docker': ['Docker official: Get Started guide'],
  'Automation': ['Coursera: Google IT Automation with Python'],
};

function suggestCourses(gapSkillNames){
  return gapSkillNames.map(name => ({
    skill: name,
    suggestions: COURSE_MAP[name] || ['No curated course on file yet for this skill'],
  }));
}

module.exports = { suggestCourses, COURSE_MAP };
