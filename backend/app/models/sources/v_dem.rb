require "csv"

module Sources
  # The V-Dem Electoral Democracy Index (0 to 1), as republished by Our World
  # in Data. Scores older than MAX_AGE_YEARS no longer describe a country and
  # are left out (V-Dem's Palestine series, for one, ends in 1948).
  class VDem
    URL = "https://ourworldindata.org/grapher/electoral-democracy-index.csv"
    PAGE = "https://ourworldindata.org/grapher/electoral-democracy-index"
    MAX_AGE_YEARS = 5
    CODES = {"OWID_KOS" => "XKX"}
    INDEX = {"index" => "V-Dem Electoral Democracy Index", "scaleMin" => 0, "scaleMax" => 1}

    def initialize(fetcher: HttpFetcher.new, today: Date.current)
      @fetcher = fetcher
      @today = today
    end

    def observations
      latest_rows.filter_map do |row|
        code = CODES.fetch(row["code"], row["code"])
        next unless code.match?(/\A[A-Z]{3}\z/) && row["year"].to_i >= today.year - MAX_AGE_YEARS

        ObservedValue.new(entity_code: code, field_key: "government.democracyScore", source_key: "vdem",
          value: {"score" => row["electdem_vdem__estimate_best"].to_f, **INDEX}, source_url: PAGE, period: row["year"])
      end
    end

    private

    attr_reader :fetcher, :today

    def latest_rows
      csv = fetcher.get_text(URL, query: {v: 1, csvType: "full", useColumnShortNames: true})
      CSV.parse(csv, headers: true).map(&:to_h).group_by { it["code"] }
        .filter_map { |code, rows| rows.max_by { it["year"].to_i } if code.present? }
    end
  end
end
