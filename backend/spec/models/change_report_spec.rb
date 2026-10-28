require "rails_helper"

RSpec.describe ChangeReport do
  let!(:france) { create(:entity, code: "FRA", name: "France") }
  let(:yesterday) { Time.zone.parse("2026-10-26 06:00") }
  let(:today) { Time.zone.parse("2026-10-27 06:00") }
  let(:holder) { ->(name) { {"name" => name, "title" => "Prime Minister", "since" => nil} } }

  def report = ChangeReport.new(since: today.beginning_of_day)

  it "lists a head of government replaced today, with the old and new holder" do
    observe(france, "leadership.headOfGovernment", holder.call("Old PM"), at: yesterday)
    observe(france, "leadership.headOfGovernment", holder.call("New PM"), at: today)

    expect(report.changes.map { [it.entity.code, it.field_key, it.before["name"], it.after["name"]] })
      .to eq([["FRA", "leadership.headOfGovernment", "Old PM", "New PM"]])
  end

  it "does not count a field's first value as a change" do
    observe(france, "leadership.headOfGovernment", holder.call("New PM"), at: today)

    expect(report.changes).to be_empty
  end

  it "ignores fields that do not need a person's review" do
    observe(france, "people.population", 1, at: yesterday)
    observe(france, "people.population", 2, at: today)

    expect(report.changes).to be_empty
  end

  it "summarizes the changes as Markdown with a link to check each one" do
    observe(france, "politics.rulingPartyOrCoalition", ["Old Party"], at: yesterday)
    observe(france, "politics.rulingPartyOrCoalition", ["New Party"], at: today, source_url: "https://www.wikidata.org/wiki/Q1#P102")

    expect(report.to_markdown).to include("| France | Ruling party or coalition | Old Party | New Party | [source](https://www.wikidata.org/wiki/Q1#P102) |")
  end
end
