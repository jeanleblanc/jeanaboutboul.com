interface HeadingItem {
  slug: string;
  text: string;
  depth: number;
}

export interface TocSection {
  heading: HeadingItem;
  children: HeadingItem[];
}

function normalizeLatexHeadingText(text: string) {
  return text
    .replace(/([A-Za-z0-9])?\\mathbb\{([A-Za-z])\}([A-Za-z0-9])?/g, (_, left, value, right) => {
      const blackboardMap: Record<string, string> = {
        C: "ℂ",
        N: "ℕ",
        Q: "ℚ",
        R: "ℝ",
        Z: "ℤ",
      };

      const symbol = blackboardMap[value] ?? value;
      const leftText = left === value ? "" : left ?? "";
      const rightText = right === value ? "" : right ?? "";
      return `${leftText}${symbol}${rightText}`;
    })
    .replace(/([A-Za-z0-9])?\\sqrt\{([^}]+)\}([A-Za-z0-9])?/g, (_, left, value, right) => {
      const leftText = left === value ? "" : left ?? "";
      const rightText = right === value ? "" : right ?? "";
      return `${leftText}√${value}${rightText}`;
    })
    .replace(/\$/g, "")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\to/g, "→")
    .replace(/\\infty/g, "∞")
    .replace(/\\forall/g, "∀")
    .replace(/\\exists/g, "∃")
    .replace(/\\Rightarrow/g, "⇒")
    .replace(/\\Leftarrow/g, "⇐")
    .replace(/\\Leftrightarrow/g, "⇔")
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1")
    .replace(/\\([a-zA-Z]+)/g, "$1")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildTocSections(headings: HeadingItem[]): TocSection[] {
  return headings
    .map((heading) => ({
      ...heading,
      text: normalizeLatexHeadingText(heading.text),
    }))
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
