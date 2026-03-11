// Curated list of tech, business, and soft skills for keyword matching
export const SKILLS_DICTIONARY = [
  // Programming Languages
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'c', 'ruby', 'go', 'golang',
  'rust', 'swift', 'kotlin', 'scala', 'php', 'perl', 'r', 'matlab', 'dart', 'lua',
  'objective-c', 'assembly', 'haskell', 'elixir', 'clojure', 'groovy',

  // Web Frontend
  'html', 'css', 'react', 'reactjs', 'angular', 'vue', 'vuejs', 'svelte', 'nextjs',
  'next.js', 'nuxt', 'gatsby', 'webpack', 'vite', 'tailwind', 'tailwindcss',
  'bootstrap', 'sass', 'scss', 'less', 'jquery', 'redux', 'mobx', 'graphql',
  'rest', 'restful', 'ajax', 'responsive design', 'pwa', 'web components',

  // Web Backend
  'node', 'nodejs', 'node.js', 'express', 'expressjs', 'fastify', 'nestjs',
  'django', 'flask', 'fastapi', 'spring', 'spring boot', 'rails', 'ruby on rails',
  'laravel', 'asp.net', '.net', 'gin', 'fiber',

  // Databases
  'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'elasticsearch',
  'cassandra', 'dynamodb', 'firebase', 'firestore', 'sqlite', 'oracle', 'mariadb',
  'neo4j', 'couchdb', 'influxdb', 'supabase',

  // Cloud & DevOps
  'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'terraform',
  'ansible', 'jenkins', 'ci/cd', 'github actions', 'gitlab ci', 'circleci',
  'heroku', 'vercel', 'netlify', 'cloudflare', 'nginx', 'apache',
  'linux', 'unix', 'bash', 'powershell', 'shell scripting',

  // Data Science & ML
  'machine learning', 'deep learning', 'neural networks', 'tensorflow', 'pytorch',
  'keras', 'scikit-learn', 'pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn',
  'data analysis', 'data visualization', 'data mining', 'nlp', 'natural language processing',
  'computer vision', 'ai', 'artificial intelligence', 'statistics', 'big data',
  'hadoop', 'spark', 'apache spark', 'tableau', 'power bi', 'jupyter',

  // Mobile
  'android', 'ios', 'react native', 'flutter', 'xamarin', 'ionic', 'cordova',
  'swiftui', 'jetpack compose', 'mobile development',

  // Tools & Practices
  'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'trello',
  'agile', 'scrum', 'kanban', 'tdd', 'bdd', 'unit testing', 'integration testing',
  'e2e testing', 'jest', 'mocha', 'cypress', 'selenium', 'postman',
  'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator',

  // Concepts
  'data structures', 'algorithms', 'design patterns', 'oop', 'object oriented',
  'functional programming', 'microservices', 'monolith', 'api design',
  'system design', 'distributed systems', 'concurrency', 'multithreading',
  'caching', 'load balancing', 'security', 'authentication', 'authorization',
  'oauth', 'jwt', 'encryption', 'ssl', 'tls', 'https',
  'websockets', 'sockets', 'tcp', 'http', 'dns',

  // Soft Skills
  'communication', 'teamwork', 'leadership', 'problem solving', 'critical thinking',
  'time management', 'project management', 'presentation', 'collaboration',
  'adaptability', 'attention to detail', 'creativity', 'analytical',

  // Business/Domain
  'excel', 'word', 'powerpoint', 'sap', 'erp', 'crm', 'salesforce',
  'marketing', 'seo', 'content management', 'e-commerce', 'fintech',
  'blockchain', 'web3', 'solidity', 'smart contracts', 'defi',
];

export function extractSkills(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found = new Set();
  for (const skill of SKILLS_DICTIONARY) {
    // Use word boundary matching for short skills to avoid false positives
    if (skill.length <= 2) {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lower)) found.add(skill);
    } else {
      if (lower.includes(skill)) found.add(skill);
    }
  }
  return [...found].sort();
}

export function analyzeMatch(resumeText, jdText) {
  const resumeSkills = extractSkills(resumeText);
  const jdSkills = extractSkills(jdText);

  if (jdSkills.length === 0) {
    return { resumeSkills, jdSkills, matchedSkills: [], missingSkills: [], score: 0 };
  }

  const matchedSkills = jdSkills.filter(s => resumeSkills.includes(s));
  const missingSkills = jdSkills.filter(s => !resumeSkills.includes(s));
  const score = Math.round((matchedSkills.length / jdSkills.length) * 100);

  return { resumeSkills, jdSkills, matchedSkills, missingSkills, score };
}
