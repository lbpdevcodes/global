require "rails_helper"

RSpec.describe Sources::WikidataElections do
  let(:fetcher) do
    FixtureFetcher.new do |_url, query|
      FixtureFetcher.json(query[:query].include?("P279") ? "wikidata/election_types.json" : "wikidata/upcoming_elections.json")
    end
  end
  let(:entities) { {"FRA" => "Q142", "IND" => "Q668"}.map { |c, q| Entity.new(code: c, wikidata_qid: q) } }
  let(:observed) { Sources::WikidataElections.new(fetcher: fetcher, entities: entities).observations }

  it_behaves_like "a source"

  def election(code) = observed.find { it.entity_code == code }

  it "reports the earliest upcoming national election with its type and day" do
    expect(election("FRA").value).to eq("type" => "Presidential", "date" => "2027-04-18")
  end

  it "keeps only the year when Wikidata knows only the year" do
    expect(election("IND").value).to eq("type" => "General", "date" => "2029")
  end

  it "asks about countries in batches small enough for the query service" do
    many = Array.new(120) { |i| Entity.new(code: "A%02d" % i, wikidata_qid: "Q#{i + 1}") }
    Sources::WikidataElections.new(fetcher: fetcher, entities: many).observations

    upcoming = fetcher.requests.reject { it[:query][:query].include?("P279") }
    expect(upcoming.size).to eq(3)
  end
end
