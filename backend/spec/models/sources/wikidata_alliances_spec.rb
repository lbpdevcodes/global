require "rails_helper"

RSpec.describe Sources::WikidataAlliances do
  let(:fetcher) { FixtureFetcher.new { FixtureFetcher.json("wikidata/alliances.json") } }
  let(:entities) { {"FRA" => "Q142", "CHN" => "Q148", "IND" => "Q668"}.map { |c, q| Entity.new(code: c, wikidata_qid: q) } }
  let(:observed) { Sources::WikidataAlliances.new(fetcher: fetcher, entities: entities).observations }

  it_behaves_like "a source"

  def alliances(code) = observed.find { it.entity_code == code }&.value

  it "lists a country's current memberships among the tracked alliances, in a fixed order with the UN first" do
    expect(alliances("FRA")).to eq(["UN", "NATO", "EU", "G7", "G20"])
  end

  it "uses each alliance's common short name" do
    expect(alliances("CHN")).to eq(["UN", "G20", "BRICS", "SCO"])
  end
end
