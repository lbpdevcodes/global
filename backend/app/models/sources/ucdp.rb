require "csv"
require "zip"

module Sources
  # Armed conflicts from the UCDP/PRIO Armed Conflict Dataset (CC BY 4.0), the
  # newest release on UCDP's downloads page: every conflict active in the
  # dataset's latest year, listed under each country where it is fought.
  # Every known country gets a list, so an empty one confirms "none recorded".
  # Place names are matched against the names known when the source runs, so
  # the ones REST Countries records earlier in the same refresh count.
  class Ucdp
    DOWNLOADS = "https://ucdp.uu.se/downloads/"
    BYTE_ORDER_MARK = "﻿"
    INTENSITY = {"1" => "Minor armed conflict (25–999 battle-related deaths in %s)",
                 "2" => "War (1,000+ battle-related deaths in %s)"}

    def initialize(fetcher: HttpFetcher.new, names: nil)
      @fetcher = fetcher
      @names = names
    end

    def observations
      rows = latest_year_rows
      year = rows.first&.fetch("year")
      by_code = rows.flat_map { |row| locations(row).map { [it, item(row)] } }.group_by(&:first)
      names.all_codes.map { |code| observed(code, by_code.fetch(code, []).map(&:last), year) }
    end

    private

    attr_reader :fetcher

    def names = @names ||= EntityNames.load

    def latest_year_rows
      rows = CSV.parse(dataset_csv, headers: true).map(&:to_h)
      latest = rows.pluck("year").max
      rows.select { it["year"] == latest }
    end

    def dataset_csv
      zip = Zip::File.open_buffer(StringIO.new(fetcher.get_bytes(dataset_url)))
      zip.glob("*.csv").first.get_input_stream.read.force_encoding(Encoding::UTF_8).delete_prefix(BYTE_ORDER_MARK)
    end

    # The newest release linked from the downloads page.
    def dataset_url
      version = fetcher.get_text(DOWNLOADS).scan(/ucdp-prio-acd-(\d+)-csv\.zip/).flatten.max_by(&:to_i)
      "https://ucdp.uu.se/downloads/ucdpprio/ucdp-prio-acd-#{version}-csv.zip"
    end

    def locations(row)
      row["location"].split(",").map(&:strip).filter_map do |name|
        names.code_for(name).tap { Rails.logger.warn("UCDP location not matched: #{name}") unless it }
      end
    end

    def item(row)
      sides = [row["side_a"], row["side_b"]]
      territory = row["territory_name"].presence&.then { " over #{it}" }
      {"title" => "#{sides.join(" vs ")}#{territory}", "parties" => sides.flat_map { it.split(", ") },
       "status" => "active_conflict",
       "statusLabel" => format(INTENSITY.fetch(row["intensity_level"]), row["year"]),
       "sourceUrl" => "https://ucdp.uu.se/conflict/#{row["conflict_id"]}"}
    end

    def observed(code, items, year)
      ObservedValue.new(entity_code: code, field_key: "tensions.ucdp", value: items, source_key: "ucdp",
        source_url: DOWNLOADS, period: year)
    end
  end
end
