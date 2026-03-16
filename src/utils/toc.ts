interface HeadingItem {
  slug: string;
  text: string;
  depth: number;
}

export interface TocSection {
  heading: HeadingItem;
  children: HeadingItem[];
}

export function buildTocSections(headings: HeadingItem[]): TocSection[] {
  return headings
    .filter((heading) => heading.depth === 2 || heading.depth === 3)
    .reduce<TocSection[]>((sections, heading) => {
      if (heading.depth === 2) {
        sections.push({ heading, children: [] });
        return sections;
      }

      const lastSection = sections.at(-1);
      if (lastSection) {
        lastSection.children.push(heading);
      }

      return sections;
    }, []);
}
