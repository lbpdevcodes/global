module Wikidata
  # Runs SPARQL against the Wikidata Query Service, identifying the app as
  # Wikimedia's User-Agent policy requires.
  class Query
    ENDPOINT = "https://query.wikidata.org/sparql"
    HEADERS = {"Accept" => "application/sparql-results+json",
               "User-Agent" => "GeoGlobe/0.1 (https://github.com/lbpdevcodes/global)"}

    def initialize(fetcher: HttpFetcher.new)
      @fetcher = fetcher
    end

    # Each result row as {"variable" => "value"}.
    def rows(sparql)
      fetcher.get_json(ENDPOINT, query: {query: sparql}, headers: HEADERS)
        .dig("results", "bindings").map { |binding| binding.transform_values { it["value"] } }
    end

    def self.qid(uri) = uri.split("/").last

    private

    attr_reader :fetcher
  end
end
