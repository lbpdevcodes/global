module Wikidata
  # Chooses the current holder among statements without an end date. Former
  # holders are often never closed, so: the preferred-rank statement wins, then
  # the most recent start; several undated holders are left unresolved.
  module OfficeHolder
    PREFERRED = "http://wikiba.se/ontology#PreferredRank"

    def self.pick(candidates)
      preferred = candidates.select { it["rank"] == PREFERRED }
      return preferred.max_by { it["start"].to_s } if preferred.any?
      return candidates.first if candidates.size == 1

      candidates.select { it["start"] }.max_by { it["start"] }
    end
  end
end
