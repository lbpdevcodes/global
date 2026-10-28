module Sources
  # Heads of state (P35) and government (P6) with their office and start date,
  # and the head of government's party (P102) as the ruling party.
  class WikidataLeaders
    ROLES = {"state" => ["leadership.headOfState", "P35"], "government" => ["leadership.headOfGovernment", "P6"]}

    def initialize(fetcher: HttpFetcher.new, entities: Entity.profiled)
      @query = Wikidata::Query.new(fetcher: fetcher)
      @codes = entities.to_h { [it.wikidata_qid, it.code] }
    end

    def observations
      holders = current_holders
      holders.map { |(qid, role), row| holder_observation(qid, role, row) } + ruling_parties(holders)
    end

    private

    attr_reader :query, :codes

    def current_holders
      query.rows(holders_sparql).group_by { [Wikidata::Query.qid(it["item"]), it["role"]] }
        .transform_values { |candidates| Wikidata::OfficeHolder.pick(candidates.uniq { it["person"] }) }.compact
    end

    def holder_observation(qid, role, row)
      field_key, property = ROLES.fetch(role)
      value = {"name" => row["personLabel"], "title" => (row["officeLabel"] || "Head of #{role}").upcase_first,
               "since" => row["start"]&.slice(0, 10)}
      observed(qid, field_key, value, "https://www.wikidata.org/wiki/#{qid}##{property}")
    end

    def ruling_parties(holders)
      heads = holders.select { |(_, role), _| role == "government" }.to_h { |(qid, _), row| [Wikidata::Query.qid(row["person"]), qid] }
      return [] if heads.empty?

      query.rows(parties_sparql(heads.keys)).group_by { Wikidata::Query.qid(it["person"]) }.map do |person, rows|
        observed(heads[person], "politics.rulingPartyOrCoalition", rows.pluck("partyLabel").uniq.sort,
          "https://www.wikidata.org/wiki/#{person}#P102")
      end
    end

    def observed(qid, field_key, value, source_url)
      ObservedValue.new(entity_code: codes.fetch(qid), field_key: field_key, value: value, source_key: "wikidata",
        source_url: source_url, period: nil)
    end

    def holders_sparql
      <<~SPARQL
        SELECT ?item ?role ?person ?personLabel ?rank ?start ?officeLabel WHERE {
          VALUES ?item { #{codes.keys.map { "wd:#{it}" }.join(" ")} }
          VALUES (?claim ?role ?officeProperty) { (p:P35 "state" wdt:P1906) (p:P6 "government" wdt:P1313) }
          ?item ?claim ?statement . ?statement ?value ?person ; wikibase:rank ?rank .
          ?property wikibase:claim ?claim ; wikibase:statementProperty ?value .
          FILTER(?rank != wikibase:DeprecatedRank)
          FILTER NOT EXISTS { ?statement pq:P582 ?ended }
          OPTIONAL { ?statement pq:P580 ?start }
          OPTIONAL { ?item ?officeProperty ?office }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
      SPARQL
    end

    def parties_sparql(people)
      <<~SPARQL
        SELECT ?person ?party ?partyLabel WHERE {
          VALUES ?person { #{people.map { "wd:#{it}" }.join(" ")} }
          ?person p:P102 ?statement . ?statement ps:P102 ?party .
          FILTER NOT EXISTS { ?statement pq:P582 ?ended }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
      SPARQL
    end
  end
end
