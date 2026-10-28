require "rails_helper"

RSpec.describe Observations::Recorder do
  let(:france) { create(:entity, code: "FRA") }
  let(:recorder) { Observations::Recorder.new }

  def observed(value, source_url: "https://restcountries.com/", period: nil)
    ObservedValue.new(entity_code: "FRA", field_key: "header.capital", value: value,
      source_key: "rest_countries", source_url: source_url, period: period)
  end

  def history
    france.observations.where(field_key: "header.capital").order(:id)
      .pluck(:value, :first_seen_at, :last_confirmed_at)
  end

  let(:day1) { Time.zone.parse("2026-10-01 06:00") }
  let(:day2) { Time.zone.parse("2026-10-02 06:00") }
  let(:day3) { Time.zone.parse("2026-10-03 06:00") }

  it "records a first value as seen and confirmed now" do
    recorder.record(france, observed("Paris"), at: day1)

    expect(history).to eq([["Paris", day1, day1]])
  end

  it "only moves the confirmation time forward when the same value is seen again" do
    recorder.record(france, observed("Paris"), at: day1)
    recorder.record(france, observed("Paris"), at: day2)

    expect(history).to eq([["Paris", day1, day2]])
  end

  it "adds a row for a changed value and leaves the earlier row as it was" do
    recorder.record(france, observed("Paris"), at: day1)
    recorder.record(france, observed("Lyon"), at: day2)

    expect(history).to eq([["Paris", day1, day1], ["Lyon", day2, day2]])
  end

  it "adds a row when a value returns to an earlier one, so history stays in order" do
    recorder.record(france, observed("Paris"), at: day1)
    recorder.record(france, observed("Lyon"), at: day2)
    recorder.record(france, observed("Paris"), at: day3)

    expect(history.map(&:first)).to eq(%w[Paris Lyon Paris])
  end

  it "treats a new source or data period as a change" do
    recorder.record(france, observed("Paris"), at: day1)
    recorder.record(france, observed("Paris", source_url: "https://www.wikidata.org/wiki/Q142"), at: day2)
    recorder.record(france, observed("Paris", period: "2025"), at: day3)

    expect(history.size).to eq(3)
  end
end
