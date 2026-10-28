require "rails_helper"

RSpec.describe Sources::WikidataGovernment do
  let(:fetcher) { FixtureFetcher.new { FixtureFetcher.json("wikidata/government_type.json") } }
  let(:entities) do
    [["FRA", "Q142"], ["USA", "Q30"], ["GHA", "Q117"]].map { |code, qid| Entity.new(code: code, wikidata_qid: qid) }
  end
  let(:observed) { Sources::WikidataGovernment.new(fetcher: fetcher, entities: entities).observations }

  it_behaves_like "a source"

  def find(code) = observed.find { it.entity_code == code }

  it "reports each country's classified government type, linked to its Wikidata statement" do
    expect([find("FRA").value, find("FRA").source_url])
      .to eq(["Semi-presidential republic", "https://www.wikidata.org/wiki/Q142#P122"])
  end

  it "asks Wikidata about every entity it was given" do
    observed

    expect(fetcher.requests.first[:query][:query]).to include("wd:Q142", "wd:Q30", "wd:Q117")
  end

  it "identifies itself to Wikidata as its policy asks" do
    observed

    expect(fetcher.requests.first[:headers]["User-Agent"]).to match(/GeoGlobe/)
  end

  it "reports nothing for a country whose forms of government cannot be classified" do
    expect(find("GHA")).to be_nil
  end
end
