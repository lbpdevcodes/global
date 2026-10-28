module Sources
  # Basic facts for every country from REST Countries v5 (names, capital, flag,
  # codes, languages, aliases, centroid, territory status).
  class RestCountries
    URL = "https://api.restcountries.com/countries/v5"
    SOURCE_URL = "https://restcountries.com/"
    PAGE_SIZE = 100
    FIELDS = %w[names codes capitals flag.emoji languages coordinates classification].join(",")

    def initialize(fetcher: HttpFetcher.new, api_key: Rails.application.credentials.dig(:rest_countries, :api_key))
      @fetcher = fetcher
      @api_key = api_key
    end

    def observations
      countries.select(&:code).flat_map { |country| observed_values(country) }
    end

    private

    attr_reader :fetcher, :api_key

    def countries
      pages.flat_map { it.dig("data", "objects") }.map { Country.new(it) }
    end

    def pages(offset = 0)
      page = fetcher.get_json(URL, query: {limit: PAGE_SIZE, offset: offset, response_fields: FIELDS},
        headers: {"Authorization" => "Bearer #{api_key}"})
      return [page] unless page.dig("data", "meta", "more")

      [page, *pages(offset + PAGE_SIZE)]
    end

    def observed_values(country)
      country.facts.compact.map do |field_key, value|
        ObservedValue.new(entity_code: country.code, field_key: field_key, value: value,
          source_key: "rest_countries", source_url: SOURCE_URL, period: nil)
      end
    end
  end
end
