module Sources
  # Current memberships (P463) in a fixed list of alliances and blocs, shown by
  # their common short names. QIDs were checked against live membership counts.
  class WikidataAlliances
    TRACKED = {
      "Q1065" => "UN", "Q7184" => "NATO", "Q458" => "EU", "Q1764511" => "G7", "Q19771" => "G20",
      "Q243630" => "BRICS", "Q485207" => "SCO", "Q318693" => "CSTO", "Q7779" => "CIS", "Q7159" => "African Union",
      "Q7768" => "ASEAN", "Q123759" => "OAS", "Q7172" => "Arab League", "Q217172" => "GCC", "Q47543" => "OIC",
      "Q7795" => "OPEC", "Q7785" => "Commonwealth", "Q8908" => "Council of Europe", "Q81299" => "OSCE",
      "Q193272" => "ECOWAS", "Q816706" => "SADC", "Q205995" => "CARICOM", "Q471690" => "Andean Community",
      "Q757276" => "Pacific Islands Forum"
    }

    def initialize(fetcher: HttpFetcher.new, entities: Entity.profiled)
      @query = Wikidata::Query.new(fetcher: fetcher)
      @codes = entities.to_h { [it.wikidata_qid, it.code] }
    end

    def observations
      query.rows(sparql).group_by { Wikidata::Query.qid(it["item"]) }.filter_map do |qid, rows|
        next unless codes.key?(qid)

        orgs = rows.map { Wikidata::Query.qid(it["org"]) }
        ObservedValue.new(entity_code: codes[qid], field_key: "politics.alliances", value: TRACKED.filter_map { |org, name| name if orgs.include?(org) },
          source_key: "wikidata", source_url: "https://www.wikidata.org/wiki/#{qid}#P463", period: nil)
      end
    end

    private

    attr_reader :query, :codes

    def sparql
      <<~SPARQL
        SELECT ?item ?org WHERE {
          VALUES ?item { #{codes.keys.map { "wd:#{it}" }.join(" ")} }
          VALUES ?org { #{TRACKED.keys.map { "wd:#{it}" }.join(" ")} }
          ?item p:P463 ?statement . ?statement ps:P463 ?org .
          FILTER NOT EXISTS { ?statement pq:P582 ?ended }
        }
      SPARQL
    end
  end
end
