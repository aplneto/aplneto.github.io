import { getCollection } from 'astro:content';
import { isPublished, sortEntriesByDate } from '../../utils/content';
import { buildVfsManifest, type BuiltManifestResult } from './manifest';

export async function loadBuiltManifest(
  includeDrafts: boolean = import.meta.env.DEV,
): Promise<BuiltManifestResult> {
  const allEntries = await getCollection('entries');
  const allProjects = await getCollection('projects');
  const allPages = await getCollection('pages');

  const pageMap = new Map(allPages.map((p) => [p.id, p]));
  const formatPage = (id: string): string | undefined => {
    const page = pageMap.get(id);
    if (!page) return undefined;
    return `# ${page.data.title}\n\n${page.body ?? ''}`.trimEnd() + '\n';
  };

  const visibleEntries = sortEntriesByDate(
    allEntries.filter((entry) => isPublished(entry, includeDrafts)),
  );
  const visibleProjects = allProjects
    .filter((project) => isPublished(project, includeDrafts))
    .sort((a, b) => a.data.title.localeCompare(b.data.title, 'en'));

  return buildVfsManifest({
    entries: visibleEntries,
    projects: visibleProjects,
    baseUrl: import.meta.env.BASE_URL,
    systemPages: {
      readme: formatPage('readme'),
      disclaimer: formatPage('disclaimer'),
      about: formatPage('about'),
      contact: formatPage('contact'),
    },
  });
}
