module Sources
  class Ucdp
    # The UCDP/PRIO Armed Conflict Dataset, newest release on the downloads
    # page: every conflict active in its latest year, placed where UCDP
    # locates it.
    class YearlyConflicts
      RELEASE = /ucdp-prio-acd-(\d+)-csv\.zip/
      INTENSITY = {"1" => "Minor armed conflict (25–999 battle-related deaths in %s)",
                   "2" => "War (1,000+ battle-related deaths in %s)"}

      def self.from(downloads_page, fetcher)
        version = downloads_page.scan(RELEASE).flatten.max_by(&:to_i)
        zip = fetcher.get_bytes("https://ucdp.uu.se/downloads/ucdpprio/ucdp-prio-acd-#{version}-csv.zip")
        new(Zip::File.open_buffer(StringIO.new(zip)).glob("*.csv").first.get_input_stream.read)
      end

      def initialize(csv)
        rows = CSV.parse(csv.force_encoding(Encoding::UTF_8).delete_prefix(BYTE_ORDER_MARK), headers: true).map(&:to_h)
        @year = rows.pluck("year").max
        @rows = rows.select { it["year"] == year }
      end

      def listings
        rows.map { Listing.new(conflict_id: it["conflict_id"], places: places(it), item: item(it)) }
      end

      private

      attr_reader :rows, :year

      def places(row) = row["location"].split(",").map(&:strip)

      def item(row)
        sides = [row["side_a"], row["side_b"]]
        territory = row["territory_name"].presence&.then { " over #{it}" }
        {"title" => "#{sides.join(" vs ")}#{territory}", "parties" => parties(row), "status" => "active_conflict",
         "statusLabel" => format(INTENSITY.fetch(row["intensity_level"]), row["year"]),
         "sourceUrl" => "https://ucdp.uu.se/conflict/#{row["conflict_id"]}"}
      end

      # Each side's actors, each followed by the governments UCDP records as
      # sending troops to support that side (secondary warring parties).
      def parties(row)
        row.values_at("side_a", "side_a_2nd", "side_b", "side_b_2nd").compact_blank.flat_map { it.split(", ") }
      end
    end
  end
end
