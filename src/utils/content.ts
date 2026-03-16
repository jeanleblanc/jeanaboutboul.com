import type { CollectionEntry } from "astro:content";

type TalkEntry = CollectionEntry<"talks">;

export function formatMonthYear(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

export function isEpflTalk(talk: TalkEntry) {
  const venue = talk.data.venue?.toLowerCase() ?? "";
  const tags = talk.data.tags.map((tag) => tag.toLowerCase());

  return venue.includes("epfl") || tags.includes("epfl");
}

export function getTalkCategoryLabel(talk: TalkEntry) {
  if (!isEpflTalk(talk) && talk.data.category.toLowerCase() === "lecture notes") {
    return "Personal Notes";
  }

  return talk.data.category;
}

export function getTalkVenueLabel(talk: TalkEntry) {
  return isEpflTalk(talk) ? talk.data.venue : undefined;
}

export function formatSemesterOrMonth(date: Date, useSemester: boolean) {
  if (!useSemester) {
    return formatMonthYear(date);
  }

  const month = date.getMonth();
  const season = month <= 5 ? "Spring" : "Autumn";

  return `${season} ${date.getFullYear()}`;
}
