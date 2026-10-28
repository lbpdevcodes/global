require "rails_helper"

RSpec.describe Refresh do
  let!(:france) { create(:entity, code: "FRA") }
  let(:at) { Time.zone.parse("2026-10-27 06:00") }

  def observed(code, value)
    ObservedValue.new(entity_code: code, field_key: "header.name", value: value,
      source_key: "test", source_url: "https://example.test/", period: nil)
  end

  def source(*values) = Struct.new(:observations).new(values)

  def failing_source(message)
    Object.new.tap { |s| s.define_singleton_method(:observations) { raise HttpFetcher::Error, message } }
  end

  it "records each source's values against the matching entity" do
    Refresh.new(sources: {"test" => source(observed("FRA", "France"))}).call(at: at)

    expect(france.observations.pluck(:field_key, :value)).to eq([["header.name", "France"]])
  end

  it "reports codes that are not in the seed instead of recording them" do
    summary = Refresh.new(sources: {"test" => source(observed("FRA", "France"), observed("ATA", "Antarctica"))}).call(at: at)

    expect(summary.unmatched_codes).to eq("test" => ["ATA"])
    expect(Observation.count).to eq(1)
  end

  it "keeps going past a failing source and reports why it failed" do
    sources = {"broken" => failing_source("GET x returned HTTP 503"), "test" => source(observed("FRA", "France"))}

    summary = Refresh.new(sources: sources).call(at: at)

    expect(summary.failures).to eq("broken" => "HttpFetcher::Error: GET x returned HTTP 503")
    expect(Observation.count).to eq(1)
  end

  it "counts the values it recorded" do
    summary = Refresh.new(sources: {"test" => source(observed("FRA", "France"))}).call(at: at)

    expect(summary.recorded).to eq(1)
  end

  it "describes failed sources as Markdown for the daily alert" do
    summary = Refresh::Summary.new(recorded: 3, unmatched_codes: {}, failures: {"vdem" => "HttpFetcher::Error: GET x returned HTTP 503"})

    expect(summary.failures_markdown).to eq("Sources that failed today kept their last good values:\n\n" \
      "- **vdem**: HttpFetcher::Error: GET x returned HTTP 503")
  end
end
