require "rails_helper"

RSpec.describe Wikidata::OfficeHolder do
  def candidate(name, rank: "NormalRank", start: nil)
    {"personLabel" => name, "rank" => "http://wikiba.se/ontology##{rank}", "start" => start}
  end

  it "takes the preferred-rank statement when Wikidata marks one" do
    picked = Wikidata::OfficeHolder.pick([candidate("Old", start: "2024-03-05T00:00:00Z"),
      candidate("New", rank: "PreferredRank", start: "2026-08-19T00:00:00Z")])

    expect(picked["personLabel"]).to eq("New")
  end

  it "otherwise takes the holder who started most recently" do
    picked = Wikidata::OfficeHolder.pick([candidate("Earlier", start: "1998-11-23T00:00:00Z"),
      candidate("Later", start: "2021-05-24T00:00:00Z")])

    expect(picked["personLabel"]).to eq("Later")
  end

  it "takes a lone holder even without a start date" do
    expect(Wikidata::OfficeHolder.pick([candidate("Only")])["personLabel"]).to eq("Only")
  end

  it "takes nobody when several undated holders compete and none is preferred" do
    expect(Wikidata::OfficeHolder.pick([candidate("A"), candidate("B")])).to be_nil
  end
end
