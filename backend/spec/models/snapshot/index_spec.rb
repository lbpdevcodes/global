require "rails_helper"

RSpec.describe Snapshot::Index do
  let!(:denmark) { create(:entity, code: "DNK", name: "Denmark (seed)") }
  let!(:greenland) { create(:territory, code: "GRL", name: "Greenland", parent: denmark) }

  def entry(code)
    Snapshot::Index.new(Entity.all, Snapshot::Facts.load, snapshot_id: "s1").to_h["entities"].find { it["code"] == code }
  end

  it "names an entity from its sourced name, falling back to the seed name" do
    observe(greenland, "header.name", "Greenland")

    expect([entry("GRL")["name"], entry("DNK")["name"]]).to eq(["Greenland", "Denmark (seed)"])
  end

  it "makes the official name and the source's alternates searchable, without repeating the name" do
    observe(denmark, "header.name", "Denmark")
    observe(denmark, "header.officialName", "Kingdom of Denmark")
    observe(denmark, "index.aliases", ["DK", "Danmark", "Denmark"])

    expect(entry("DNK")["aliases"]).to eq(["Kingdom of Denmark", "DK", "Danmark"])
  end

  it "points a territory at its parent and describes its status with its source" do
    observe(denmark, "header.name", "Denmark")
    observe(greenland, "territory.status", "autonomous_region")

    expect(entry("GRL").slice("kind", "parent", "layers")).to eq("kind" => "territory", "parent" => "DNK", "layers" => nil)
    expect(entry("GRL")["note"]).to eq(
      "value" => "Autonomous region of Denmark", "source" => "https://restcountries.com/", "asOf" => "2026-10-27"
    )
  end

  it "uses the sourced centroid" do
    observe(denmark, "index.centroid", {"lat" => 56, "lng" => 10})

    expect(entry("DNK")["centroid"]).to eq("lat" => 56, "lng" => 10)
  end

  it "is a document the index contract accepts" do
    observe(denmark, "index.centroid", {"lat" => 56, "lng" => 10})
    observe(greenland, "territory.status", "autonomous_region")

    expect(contract_errors("index", Snapshot::Index.new(Entity.all, Snapshot::Facts.load, snapshot_id: "s1").to_h)).to be_empty
  end

  it "gives a profiled entity no territory note even when the source reports a status for it" do
    western_sahara = create(:entity, code: "ESH", kind: "partially_recognized")
    observe(western_sahara, "territory.status", "disputed")

    expect(entry("ESH")["note"]).to be_nil
  end

  it "colors the democracy layer by the score alone" do
    observe(denmark, "government.democracyScore",
      {"score" => 0.91, "index" => "V-Dem Electoral Democracy Index", "scaleMin" => 0, "scaleMax" => 1}, period: "2025")

    expect(entry("DNK").dig("layers", "democracyScore")).to eq("value" => 0.91, "asOf" => "2026-10-27")
  end

  it "puts a country with an armed conflict in the active-conflict class of the conflict layer" do
    observe(denmark, "tensions.ucdp", [{"title" => "x", "status" => "active_conflict"}], source_key: "ucdp")

    expect(entry("DNK").dig("layers", "conflictStatus")).to eq("value" => "active_conflict", "asOf" => "2026-10-27")
  end

  it "records 'none' when the conflict source confirms no conflict" do
    observe(denmark, "tensions.ucdp", [], source_key: "ucdp")

    expect(entry("DNK").dig("layers", "conflictStatus", "value")).to eq("none")
  end

  it "colors the GDP per person layer by the figure" do
    observe(denmark, "economy.gdpPerCapitaUsd", 68_453.2, period: "2024")

    expect(entry("DNK").dig("layers", "gdpPerCapita")).to eq("value" => 68_453.2, "asOf" => "2026-10-27")
  end

  it "carries a country's alliances and blocs for the bloc layer" do
    observe(denmark, "politics.alliances", ["UN", "NATO", "EU"])

    expect(entry("DNK").dig("layers", "alliances")).to eq("value" => ["UN", "NATO", "EU"], "asOf" => "2026-10-27")
  end

  it "carries the next national election's type and date for the elections layer" do
    observe(denmark, "leadership.nextNationalElection", {"type" => "Legislative", "date" => "2026-11"})

    expect(entry("DNK").dig("layers", "nextElection"))
      .to eq("value" => {"type" => "Legislative", "date" => "2026-11"}, "asOf" => "2026-10-27")
  end
end
