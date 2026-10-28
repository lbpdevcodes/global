module Sources
  class Ucdp
    # UCDP's monthly candidate events, newest January-to-date release: the
    # current year's state-based armed conflicts, which the yearly dataset
    # reaches only after the year ends. A conflict is placed by the governments
    # fighting it, not by where each event happened.
    class CandidateEvents
      RELEASE = %r{https://ucdp\.uu\.se/downloads/candidateged/GEDEvent_v(\d\d)_01_(\d\d)_(\d\d)\.csv}
      STATE_BASED = "1"
      # How UCDP writes an actor it has not identified yet: XXX and a country number.
      UNIDENTIFIED = /\AXXX\d+\z/
      GOVERNMENT = /\AGovernment of (.+)\z/
      ACTIVE = 25
      WAR = 1_000

      def self.from(downloads_page, fetcher)
        release = downloads_page.to_enum(:scan, RELEASE).map { Regexp.last_match }.max_by { [it[2], it[3]] } or
          raise KeyError, "UCDP's downloads page lists no January-to-date candidate events CSV"
        new(fetcher.get_text(release[0]), year: "20#{release[2]}", last_month: release[3].to_i)
      end

      def initialize(csv, year:, last_month:)
        @events = CSV.parse(csv.delete_prefix(BYTE_ORDER_MARK), headers: true).map(&:to_h)
          .select { it["type_of_violence"] == STATE_BASED }
        @year = year
        @last_month = last_month
      end

      attr_reader :year

      # Conflicts with at least 25 battle-related deaths so far, UCDP's threshold.
      def listings
        events.group_by { it["conflict_new_id"] }
          .filter_map { |id, conflict| listing(id, conflict) if deaths(conflict) >= ACTIVE }
      end

      private

      attr_reader :events, :last_month

      # A conflict with no identified sides yet is left out.
      def listing(id, conflict)
        sides = identified_sides(conflict) or return
        Listing.new(conflict_id: id, places: parties(conflict).filter_map { it[GOVERNMENT, 1] },
          item: {"title" => sides.join(" vs "), "parties" => parties(conflict), "status" => "active_conflict",
                 "statusLabel" => label(conflict), "sourceUrl" => "https://ucdp.uu.se/conflict/#{id}"})
      end

      # Every identified actor on either side, across all the conflict's pairings.
      def parties(conflict)
        conflict.flat_map { it.values_at("side_a", "side_b") }.flat_map { it.split(", ") }.uniq.grep_v(UNIDENTIFIED)
      end

      # The deadliest pairing of sides that UCDP has identified.
      def identified_sides(conflict)
        conflict.group_by { it.values_at("side_a", "side_b") }.reject { |sides, _| sides.any?(UNIDENTIFIED) }
          .max_by { |_, events| deaths(events) }&.first
      end

      def label(conflict)
        intensity = (deaths(conflict) >= WAR) ? "War" : "Minor armed conflict"
        "#{intensity}, preliminary (#{deaths(conflict).to_fs(:delimited)} battle-related deaths in #{covering})"
      end

      def deaths(conflict) = conflict.sum { it["best"].to_i }

      # The months the release spans, as in "January–September 2026".
      def covering = "#{Date::MONTHNAMES.values_at(1, last_month).uniq.join("–")} #{year}"
    end
  end
end
