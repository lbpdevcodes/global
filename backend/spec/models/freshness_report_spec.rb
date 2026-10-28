require "rails_helper"

RSpec.describe FreshnessReport do
  let!(:france) { create(:entity, code: "FRA", name: "France") }
  let(:today) { Date.new(2026, 10, 27) }

  def report = FreshnessReport.new(Snapshot::Facts.load(overrides: Overrides.new([])), today: today)

  it "lists a field confirmed longer ago than its refresh window plus a day" do
    observe(france, "leadership.headOfState", {"name" => "X", "title" => "President", "since" => "2017"},
      at: Time.zone.parse("2026-10-24 06:00"))

    expect(report.stale.map { [it.code, it.field.key, it.as_of] }).to eq([["FRA", "leadership.headOfState", Date.new(2026, 10, 24)]])
  end

  it "does not list a field still inside its window" do
    observe(france, "leadership.headOfState", {"name" => "X", "title" => "President", "since" => "2017"},
      at: Time.zone.parse("2026-10-25 06:00"))

    expect(report.stale).to be_empty
  end

  it "summarizes stale fields as Markdown for the daily alert" do
    observe(france, "people.population", 1, at: Time.zone.parse("2025-01-01 06:00"))

    expect(report.to_markdown).to include("| France | Population | 2025-01-01 | 366 days |")
  end
end
