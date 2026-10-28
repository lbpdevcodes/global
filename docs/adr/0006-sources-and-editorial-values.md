# 0006. Profile sources, classification and editorial values

- Status: Accepted
- Date: 2026-10-27

## Decision

| Field | Source | Notes |
|---|---|---|
| Name, capital, flag, codes, languages, aliases, centroid, territory status | REST Countries v5 | API key in credentials. Kosovo `UNK` maps to `XKX`. Multiple capitals are labeled with the roles the source gives them. |
| Population, GDP, GDP per person | World Bank WDI (CC BY 4.0) | Latest non-empty year per country. Some indicators return several years despite `mrnev=1`, so the latest is chosen explicitly. |
| Top exports | World Bank WDI merchandise exports by product group | Five groups ranked by share. **Not OEC**, see below. |
| Democracy score | V-Dem Electoral Democracy Index (0–1), via Our World in Data | Scores more than 5 years old are dropped: V-Dem's Palestine series ends in 1948. |
| Government type | Wikidata P122, classified by `GovernmentType` | Ordered rules map editor labels to a neutral vocabulary; unplaceable combinations stay null. |
| Recognition | REST Countries `un_member` (`full`); `config/overrides.yml` for PSE, VAT, TWN, XKX, ESH | Overrides carry their own source and are dated by review. |

### OEC is not used

OEC's terms prohibit "distributing, hosting, or otherwise commercially exploiting" the site, and
they allow building only solutions "that do not imply the redistribution… of the content". A
public site that republishes top exports would breach that. WDI's product-group shares are
coarser ("Manufactures 78.5%", not "Aircraft 9%"), but they are openly licensed.

**Top trade partners stay null in v1.** Revisit with an OEC subscription whose terms allow
redistribution, or with a UN Comtrade key once its terms are checked.

### Government type vocabulary

The vocabulary is: Absolute monarchy, One-party state, Military government, Theocracy,
Provisional government, Constitutional monarchy, Semi-presidential republic, Presidential
republic, Parliamentary republic, Directorial republic, Monarchy, Republic.

- **Rules apply in that order,** so the most specific system wins.
- **Editor labels such as "communist dictatorship" are never shown;** the PRD requires neutral
  wording.
- **Coverage, checked 2026-10-27:** 159 of the 161 entities with P122 statements classify. The
  other 37 profiled entities have no P122 statement, so their row is hidden.

### Editorial values

`config/overrides.yml` is for fields with no structured source.

- **Precedence:** a reviewed value wins over any source.
- **Dating:** its `asOf` is the review date, so it shows "may be outdated" once its refresh
  window passes.
- **Process:** changes go through pull requests. The wording stays qualitative ("recognized by
  some UN member states") unless a source supports a number.
