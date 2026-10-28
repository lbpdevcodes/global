module Sources
  # Government type from Wikidata's current "basic form of government" (P122)
  # statements, classified into a neutral vocabulary by GovernmentType.
  class WikidataGovernment
    def initialize(fetcher: HttpFetcher.new, entities: Entity.profiled)
      @query = Wikidata::Query.new(fetcher: fetcher)
      @codes = entities.to_h { [it.wikidata_qid, it.code] }
    end

    def observations
      query.rows(sparql).filter_map do |row|
        qid = Wikidata::Query.qid(row["item"])
        type = GovernmentType.classify(row["forms"].split("|"))
        next unless type && codes.key?(qid)

        ObservedValue.new(entity_code: codes[qid], field_key: "government.governmentType", value: type,
          source_key: "wikidata", source_url: "https://www.wikidata.org/wiki/#{qid}#P122", period: nil)
      end
    end

    private

    attr_reader :query, :codes

    def sparql
      <<~SPARQL
        SELECT ?item (GROUP_CONCAT(DISTINCT ?label; separator="|") AS ?forms) WHERE {
          VALUES ?item { #{codes.keys.map { "wd:#{it}" }.join(" ")} }
          ?item p:P122 ?statement . ?statement ps:P122 ?form .
          FILTER NOT EXISTS { ?statement pq:P582 ?ended }
          ?form rdfs:label ?label FILTER(lang(?label) = "en")
        } GROUP BY ?item
      SPARQL
    end
  end
end
