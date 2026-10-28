module Sources
  # The earliest upcoming national election: one whose jurisdiction (P1001) is
  # the country itself and whose type descends from presidential, general or
  # legislative election. Countries are queried in batches to stay well inside
  # the query service's 60-second limit.
  class WikidataElections
    KINDS = {"Q858439" => "Presidential", "Q1076105" => "General", "Q2618461" => "Legislative"}
    BATCH = 50
    PRECISION = {"9" => 4, "10" => 7} # year, month; anything finer keeps the day

    def initialize(fetcher: HttpFetcher.new, entities: Entity.profiled)
      @query = Wikidata::Query.new(fetcher: fetcher)
      @codes = entities.to_h { [it.wikidata_qid, it.code] }
    end

    def observations
      kinds = national_types
      upcoming.select { kinds.key?(it["type"]) }.group_by { Wikidata::Query.qid(it["item"]) }.filter_map do |qid, rows|
        next unless codes.key?(qid)

        nearest = rows.min_by { it["date"] }
        observed(qid, nearest, kinds.fetch(nearest["type"]))
      end
    end

    private

    attr_reader :query, :codes

    def observed(qid, row, kind)
      ObservedValue.new(entity_code: codes[qid], field_key: "leadership.nextNationalElection", source_key: "wikidata",
        value: {"type" => kind, "date" => row["date"][0, PRECISION.fetch(row["precision"], 10)]},
        source_url: "https://www.wikidata.org/wiki/#{Wikidata::Query.qid(row["election"])}", period: nil)
    end

    def national_types
      sparql = "SELECT ?type ?base WHERE { VALUES ?base { #{KINDS.keys.map { "wd:#{it}" }.join(" ")} } ?type wdt:P279* ?base . }"
      # A type under several bases takes the first in KINDS' order.
      query.rows(sparql).group_by { it["type"] }
        .transform_values { |rows| KINDS.values_at(*rows.map { Wikidata::Query.qid(it["base"]) }).min_by { KINDS.values.index(it) } }
    end

    def upcoming
      codes.keys.each_slice(BATCH).flat_map do |batch|
        query.rows(<<~SPARQL)
          SELECT ?item ?election ?type ?date ?precision WHERE {
            VALUES ?item { #{batch.map { "wd:#{it}" }.join(" ")} }
            ?election wdt:P1001 ?item ; wdt:P585 ?date . FILTER(?date > NOW())
            ?election wdt:P31 ?type ; p:P585/psv:P585 ?time . ?time wikibase:timePrecision ?precision .
          }
        SPARQL
      end
    end
  end
end
