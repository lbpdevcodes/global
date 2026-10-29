const SITE_NAME = "Geopolitical Globe";
const SITE_DESCRIPTION = "Spin the globe and open any country's sourced, dated geopolitical profile.";

// The tags a shared link's preview card is built from. A code with no card,
// or none at all, gets the site's own card.
export function shareMeta(requested, cards, siteUrl) {
  const code = requested?.toUpperCase();
  const card = cards[code];
  if (!card) return tags({ title: SITE_NAME, description: SITE_DESCRIPTION, url: `${siteUrl}/` }, siteUrl);

  const name = card.parent ? `${card.name} (${cards[card.parent].name})` : card.name;
  return tags({
    title: `${name} · ${SITE_NAME}`,
    description: `Leaders, government, economy and armed conflicts for ${name}, each fact with its source and date.`,
    // A territory opens its parent's profile, so the parent's page is the one to index.
    url: `${siteUrl}/country/${card.parent ?? code}`,
  }, siteUrl);
}

function tags({ title, description, url }, siteUrl) {
  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:image", content: `${siteUrl}/og.png` },
    { name: "twitter:card", content: "summary_large_image" },
  ];
}
