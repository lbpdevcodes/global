import { cards, siteUrl } from "virtual:share-cards";
import { shareMeta } from "../lib/share.js";

// The explorer layout draws the selected country; this route only names it,
// so each prerendered page and the tab title carry that country's card.
export function meta({ params }) {
  return shareMeta(params.code, cards, siteUrl);
}

export default function Country() {
  return null;
}
