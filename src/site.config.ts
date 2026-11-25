export const SITE_CONFIG = {
  siteName: 'aplneto',
  authorName: 'aplneto',
  contactEmail: 'aplneto@outlook.com',
  headline: 'My journey on attempting to understand stuff',
  motto: 'Driven by curiosity, not authority.',
  tagline: '',
  description:
    'A personal public notebook of notes, experiments, mistakes, and discoveries across cybersecurity, artificial intelligence, and software engineering.',
  language: 'en',
  homePath: '/home/guest',
} as const;

export const CATEGORIES = {
  security: {
    label: 'Cybersecurity',
    shortLabel: 'Security',
    description: 'Notes on systems security, vulnerabilities, defensive tooling, and how things break.',
  },
  ai: {
    label: 'Artificial Intelligence',
    shortLabel: 'AI',
    description: 'Experiments and observations on language models, agents, and machine learning.',
  },
  engineering: {
    label: 'Software Engineering',
    shortLabel: 'Engineering',
    description: 'Architecture, debugging logs, tooling, and lessons from building software.',
  },
  miscellaneous: {
    label: 'Miscellaneous',
    shortLabel: 'Misc',
    description: 'Everything else that sparked curiosity.',
  },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

export const KINDS = {
  note: 'Note',
  experiment: 'Experiment',
  article: 'Article',
  devlog: 'Devlog',
} as const;

export type KindKey = keyof typeof KINDS;

export const EPISTEMIC_STATUSES = {
  raw: {
    label: 'Raw',
    description: 'Preliminary or loosely organized notes.',
  },
  speculative: {
    label: 'Speculative',
    description: 'Ideas or untested hypotheses.',
  },
  exploratory: {
    label: 'Exploratory',
    description: 'Early investigations with limited evidence.',
  },
  experimental: {
    label: 'Experimental',
    description: 'Observations from practical experiments; not a guarantee of validity.',
  },
  revisited: {
    label: 'Revisited',
    description: 'Updated after further learning.',
  },
  retracted: {
    label: 'Retracted',
    description: 'Conclusions the author no longer endorses.',
  },
} as const;

export type EpistemicStatusKey = keyof typeof EPISTEMIC_STATUSES;
