require "rails_helper"

RSpec.describe Snapshot::CountryProfile do
  let(:france) { create(:entity, code: "FRA", name: "France") }
  let(:generated_at) { Time.zone.parse("2026-10-27 07:00") }

  def profile = Snapshot::CountryProfile.new(france, Snapshot::Facts.load, generated_at: generated_at).to_h

  it "fills a field from its latest observation, with source and the date it was last confirmed" do
    observe(france, "header.capital", "Lyon", at: Time.zone.parse("2026-10-20 06:00"))
    observe(france, "header.capital", "Paris", at: Time.zone.parse("2026-10-26 06:00"))
    observe(france, "header.capital", "Paris", at: Time.zone.parse("2026-10-27 06:00"))

    expect(profile.dig("header", "capital"))
      .to eq("value" => "Paris", "source" => "https://restcountries.com/", "asOf" => "2026-10-27")
  end

  it "carries the data period when the observation has one" do
    observe(france, "people.population", 68_170_000, period: "2024")

    expect(profile.dig("people", "population", "period")).to eq("2024")
  end

  it "leaves a field with no observation null" do
    expect(profile.dig("leadership", "headOfState")).to be_nil
  end

  it "lists the sources its fields came from" do
    observe(france, "header.name", "France")

    expect(profile.dig("meta", "sources")).to eq([{"name" => "REST Countries", "url" => "https://restcountries.com/"}])
  end

  it "is a document the country contract accepts" do
    observe(france, "header.name", "France")
    observe(france, "people.officialLanguages", ["French"])

    expect(contract_errors("country", profile)).to be_empty
  end

  it "prefers a reviewed editorial override to a recorded observation" do
    observe(france, "government.recognitionStatus", {"status" => "full", "note" => nil})
    override = {"code" => "FRA", "field" => "government.recognitionStatus",
                "value" => {"status" => "full", "note" => "Reviewed note"}, "source_url" => "https://example.org/fr",
                "reviewed_on" => "2026-10-20", "reason" => "test"}
    facts = Snapshot::Facts.load(overrides: Overrides.new([override]))

    profile = Snapshot::CountryProfile.new(france, facts, generated_at: generated_at).to_h

    expect(profile.dig("government", "recognitionStatus", "value", "note")).to eq("Reviewed note")
    expect(profile.dig("meta", "sources")).to include("name" => "Editorial review", "url" => a_string_including("overrides.yml"))
  end

  it "lists armed conflicts with each item dated by when its source last confirmed it" do
    item = {"title" => "A vs B", "parties" => ["A", "B"], "status" => "active_conflict",
            "statusLabel" => "War (1,000+ battle-related deaths in 2025)", "sourceUrl" => "https://ucdp.uu.se/conflict/1"}
    observe(france, "tensions.ucdp", [item], period: "2025", source_key: "ucdp", source_url: "https://ucdp.uu.se/downloads/")

    expect(profile.dig("tensions", "items")).to eq([item.merge("asOf" => "2026-10-27")])
    expect(profile.dig("meta", "sources")).to include("name" => "UCDP/PRIO Armed Conflict Dataset", "url" => "https://ucdp.uu.se/downloads/")
  end
end
