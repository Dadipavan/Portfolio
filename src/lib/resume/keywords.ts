// Simple keyword matching between a job description (JD) and the content of a resume.
// No AI and no network: it counts the skills and phrases that the JD repeats, and checks which of them
// appear in a piece of text.

export interface Keyword {
  term: string; // lower case
  weight: number; // more for words repeated in the JD or listed under "requirements"
  known: boolean; // true when it is a skill from the vocabulary or from the owner's own data
}

// Common skill words, so they are recognised even when the JD mentions them once
export const COMMON_SKILLS = [
  'python', 'sql', 'java', 'javascript', 'typescript', 'c++', 'c#', 'scala', 'rust', 'php', 'ruby', 'kotlin', 'swift', 'bash', 'shell',
  'react', 'next.js', 'node.js', 'angular', 'vue', 'django', 'flask', 'fastapi', 'spring boot', '.net', 'html', 'css', 'tailwind', 'rest', 'graphql', 'api', 'apis', 'microservices',
  'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras', 'spark', 'pyspark', 'hadoop', 'hive', 'kafka', 'airflow', 'dbt', 'etl', 'elt', 'data pipeline', 'data pipelines',
  'power bi', 'tableau', 'looker', 'excel', 'google sheets', 'qlik', 'superset', 'matplotlib', 'seaborn', 'plotly', 'streamlit',
  'machine learning', 'deep learning', 'nlp', 'natural language processing', 'computer vision', 'llm', 'generative ai', 'time series', 'forecasting', 'regression', 'classification', 'clustering', 'statistics', 'hypothesis testing', 'a/b testing', 'feature engineering', 'model deployment', 'mlops',
  'data analysis', 'data analytics', 'data visualization', 'data modeling', 'data modelling', 'data warehouse', 'data warehousing', 'data cleaning', 'data engineering', 'data science', 'business intelligence', 'dashboards', 'reporting', 'kpi', 'kpis', 'stakeholders', 'storytelling',
  'aws', 'azure', 'gcp', 'google cloud', 'snowflake', 'databricks', 'bigquery', 'redshift', 'postgresql', 'mysql', 'mongodb', 'oracle', 'sql server', 'redis', 'supabase', 'firebase',
  'docker', 'kubernetes', 'git', 'github', 'ci/cd', 'jenkins', 'linux', 'terraform', 'jira', 'agile', 'scrum',
  'testing', 'unit testing', 'debugging', 'automation', 'problem solving', 'communication', 'leadership', 'collaboration', 'cross-functional',
];

const STOP = new Set(
  (
    'a about above after again all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its just me more most my no nor not now of off on once only or other our out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours ' +
    'ability able across amp apply applicants applicant based better build candidate candidates career city client clients company companies create day days degree deliver description desired diverse duties employer employment environment equal etc experience experienced excellent familiarity following full good great grow help high including individual including job join knowledge learn level like looking make may meet must need needs new offer opportunity opportunities part people perform please position preferred prior provide qualifications qualified related required requirements requirement responsibilities responsibility role roles seeking skills skill strong support take team teams tools understanding use used using want well within work working works year years you will'
  ).split(/\s+/)
);

// Different spellings of the same skill
const ALIASES: Record<string, string[]> = {
  'power bi': ['powerbi', 'power-bi'],
  'machine learning': ['ml'],
  'natural language processing': ['nlp'],
  'javascript': ['js'],
  'typescript': ['ts'],
  'node.js': ['nodejs', 'node js', 'node'],
  'next.js': ['nextjs', 'next js'],
  'postgresql': ['postgres'],
  'google cloud': ['gcp'],
  'scikit-learn': ['sklearn', 'scikit learn'],
  'a/b testing': ['ab testing', 'a b testing'],
  'ci/cd': ['cicd', 'ci cd'],
  'data visualization': ['data visualisation'],
  'data modeling': ['data modelling'],
  'data warehouse': ['data warehousing'],
  'kpi': ['kpis'],
  'api': ['apis'],
  'dashboards': ['dashboard'],
  'etl': ['elt'],
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// A pattern that finds the term as a whole word (so "r" does not match inside "report") and allows a plural "s"
function termPattern(term: string): RegExp {
  const forms = [term, ...(ALIASES[term] ?? [])].map((f) => escapeRegExp(f).replace(/\\?[ -]/g, '[\\s-]?'));
  return new RegExp(`(?<![a-z0-9+#])(?:${forms.join('|')})(?:s|es)?(?![a-z0-9+#])`, 'gi');
}

export function countTerm(text: string, term: string): number {
  if (!text) return 0;
  return (text.match(termPattern(term)) ?? []).length;
}

export function hasTerm(text: string, term: string): boolean {
  return countTerm(text, term) > 0;
}

// Splits the JD into lines tagged by the heading above them
function weightedLines(jd: string): { text: string; bonus: number }[] {
  let bonus = 0;
  const out: { text: string; bonus: number }[] = [];
  for (const raw of jd.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const lower = line.toLowerCase();
    const isHeading = line.length < 60 && /[:：]?$/.test(line) && !/[.;]$/.test(line);
    if (isHeading) {
      if (/(requirement|qualification|must[- ]have|what you(?:'|’)ll need|what we(?:'|’)re looking for|you have|skills)/.test(lower)) bonus = 1;
      else if (/(responsibilit|what you(?:'|’)ll do|duties|about (?:the )?(?:role|job|team|us|company))/.test(lower)) bonus = 0.5;
      else if (/(nice to have|preferred|bonus|plus|good to have)/.test(lower)) bonus = 0;
    }
    out.push({ text: line, bonus });
  }
  return out;
}

export function extractKeywords(jd: string, vocabulary: string[] = [], limit = 40): Keyword[] {
  const text = (jd ?? '').trim();
  if (!text) return [];
  const lines = weightedLines(text);

  const known = new Map<string, string>(); // lower case -> lower case
  for (const v of [...vocabulary, ...COMMON_SKILLS]) {
    const t = v.trim().toLowerCase();
    if (t.length >= 1 && t.length <= 40) known.set(t, t);
  }

  const found = new Map<string, Keyword>();
  const add = (term: string, weight: number, isKnown: boolean) => {
    const prev = found.get(term);
    if (prev) {
      prev.weight = Math.max(prev.weight, weight);
      prev.known = prev.known || isKnown;
    } else found.set(term, { term, weight, known: isKnown });
  };

  // 1) skills we recognise
  for (const term of known.keys()) {
    let weight = 0;
    let count = 0;
    for (const l of lines) {
      const n = countTerm(l.text, term);
      if (n) {
        count += n;
        weight += n * (1 + l.bonus);
      }
    }
    if (count > 0) add(term, Math.round(weight * 10) / 10, true);
  }

  // 2) words and two-word phrases that the JD repeats
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+#./\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^[./-]+|[./-]+$/g, ''))
    .filter(Boolean);
  const freq = new Map<string, number>();
  const bump = (k: string) => freq.set(k, (freq.get(k) ?? 0) + 1);
  const meaningful = (w: string) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w);
  words.forEach((w, i) => {
    if (meaningful(w)) bump(w);
    const n = words[i + 1];
    if (n && meaningful(w) && meaningful(n)) bump(`${w} ${n}`);
  });
  const alreadyCovered = (term: string) =>
    [...found.keys()].some((k) => k === term || k.includes(term) || term.includes(k));
  for (const [term, n] of freq) {
    if (n < 2 || alreadyCovered(term)) continue;
    add(term, n * (term.includes(' ') ? 1.2 : 1), false);
  }

  return [...found.values()].sort((a, b) => b.weight - a.weight || a.term.localeCompare(b.term)).slice(0, limit);
}

export interface TextMatch {
  matched: Keyword[];
  score: number; // sum of the weights of the matched keywords
}

export function matchText(text: string, keywords: Keyword[]): TextMatch {
  const matched = keywords.filter((k) => hasTerm(text, k.term));
  return { matched, score: matched.reduce((a, k) => a + k.weight, 0) };
}

export interface Coverage {
  matched: Keyword[];
  missing: Keyword[];
  percent: number; // 0-100, weighted
}

export function coverage(text: string, keywords: Keyword[]): Coverage {
  const total = keywords.reduce((a, k) => a + k.weight, 0);
  const { matched, score } = matchText(text, keywords);
  const matchedSet = new Set(matched.map((k) => k.term));
  return {
    matched,
    missing: keywords.filter((k) => !matchedSet.has(k.term)),
    percent: total > 0 ? Math.round((score / total) * 100) : 0,
  };
}
