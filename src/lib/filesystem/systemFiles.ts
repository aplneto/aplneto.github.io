import { SITE_CONFIG } from '../../site.config';

export const DISCLAIMER_PARAGRAPHS = [
  'This website is, first and foremost, my personal notebook made public.',
  "I'm not an expert in most of the subjects I write about, but I am deeply curious about them. Much of what you'll find here comes from personal experiments, independent study, and an occasional urge to understand how things work.",
  'My investigations are driven more by curiosity than scientific rigor. As such, my findings may be incomplete, my assumptions flawed, and my conclusions outright wrong. Nothing here should be mistaken for peer-reviewed research or authoritative guidance.',
  "The primary purpose of this website is to organize my thoughts, document my discoveries, and give my future self somewhere to look when I've inevitably forgotten something.",
  "I've chosen to make these notes public in the hope that someone, somewhere, might find them useful, interesting, or even just entertaining.",
  'If you spot a mistake, disagree with a conclusion, or have something interesting to add, I would genuinely love to hear from you.',
  'After all, understanding things is the whole point.',
] as const;

export const README_MARKDOWN = `# ${SITE_CONFIG.headline}

${SITE_CONFIG.motto}

${SITE_CONFIG.tagline}

Welcome to ${SITE_CONFIG.siteName} — a personal public notebook by ${SITE_CONFIG.authorName} covering cybersecurity, artificial intelligence, machine learning, and software engineering.

## Navigating this notebook

- Browse folders in the **File Manager** or open the **Terminal** to explore \`/home/guest\`.
- Prefer a regular web layout? Use the navigation bar for [Notes](/notes/), [Experiments](/experiments/), [Projects](/projects/), [About](/about/), and the [Disclaimer](/disclaimer/).
- Contact: ${SITE_CONFIG.contactEmail}
`;

export const DISCLAIMER_MARKDOWN = `# Reader Disclaimer

${DISCLAIMER_PARAGRAPHS.join('\n\n')}

---

Contact: ${SITE_CONFIG.contactEmail}
`;

export const ABOUT_MARKDOWN = `# About

Hi, I'm **${SITE_CONFIG.authorName}**.

${SITE_CONFIG.headline}

This site is my public laboratory notebook — a place to collect notes, experiments, mistakes, and occasional discoveries across cybersecurity, artificial intelligence, and software engineering.

${SITE_CONFIG.motto} ${SITE_CONFIG.tagline}

## Contact

If you spot a mistake, disagree with a conclusion, or want to share something interesting, you can reach me at **${SITE_CONFIG.contactEmail}**.
`;
