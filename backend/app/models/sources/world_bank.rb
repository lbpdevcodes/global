module Sources
  # Population, GDP and merchandise exports by product group from the World
  # Bank Indicators API (WDI, CC BY 4.0). Each value is the latest non-empty
  # year; regional aggregates are left out.
  class WorldBank
    API = "https://api.worldbank.org/v2"
    FIELDS = {"SP.POP.TOTL" => "people.population", "NY.GDP.MKTP.CD" => "economy.gdpUsd",
              "NY.GDP.PCAP.CD" => "economy.gdpPerCapitaUsd"}
    EXPORT_GROUPS = {"TX.VAL.MANF.ZS.UN" => "Manufactures", "TX.VAL.FUEL.ZS.UN" => "Fuels",
                     "TX.VAL.FOOD.ZS.UN" => "Food", "TX.VAL.MMTL.ZS.UN" => "Ores and metals",
                     "TX.VAL.AGRI.ZS.UN" => "Agricultural raw materials"}

    def initialize(fetcher: HttpFetcher.new)
      @fetcher = fetcher
    end

    def observations
      FIELDS.flat_map { |indicator, field_key| single_values(indicator, field_key) } + exports
    end

    private

    attr_reader :fetcher

    def single_values(indicator, field_key)
      rows(indicator).map { |row| observed(row, field_key, row["value"], indicator) }
    end

    def exports
      EXPORT_GROUPS.keys.flat_map { rows(it) }.group_by { it["countryiso3code"] }.map do |_, shares|
        observed(shares.max_by { it["date"] }, "economy.topExports", export_shares(shares), EXPORT_GROUPS.keys.first)
      end
    end

    def export_shares(rows)
      rows.map { {"product" => EXPORT_GROUPS.fetch(it.dig("indicator", "id")), "sharePercent" => it["value"].round(1)} }
        .sort_by { -it["sharePercent"] }
    end

    def observed(row, field_key, value, indicator)
      ObservedValue.new(entity_code: row["countryiso3code"], field_key: field_key, value: value, source_key: "world_bank",
        source_url: "https://data.worldbank.org/indicator/#{indicator}?locations=#{row.dig("country", "id")}", period: row["date"])
    end

    # The latest non-empty row per country. mrnev=1 asks for exactly that, but
    # some indicators answer with several years anyway.
    def rows(indicator)
      fetcher.get_json("#{API}/country/all/indicator/#{indicator}", query: {format: "json", per_page: 20_000, mrnev: 1})
        .last.to_a.select { |row| row["value"] && countries.include?(row["countryiso3code"]) }
        .group_by { it["countryiso3code"] }.map { |_, years| years.max_by { it["date"] } }
    end

    def countries
      @countries ||= fetcher.get_json("#{API}/country", query: {format: "json", per_page: 400}).last
        .reject { it.dig("region", "value") == "Aggregates" }.to_set { it["id"] }
    end
  end
end
