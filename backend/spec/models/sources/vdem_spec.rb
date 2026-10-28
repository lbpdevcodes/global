require "rails_helper"

RSpec.describe Sources::VDem do
  let(:fetcher) do
    Object.new.tap do |fake|
      fake.define_singleton_method(:get_text) { |_url, **| Rails.root.join("spec/fixtures/vdem/electoral-democracy-index.csv").read }
    end
  end
  let(:observed) { Sources::VDem.new(fetcher: fetcher, today: Date.new(2026, 10, 27)).observations }

  it_behaves_like "a source"

  def find(code) = observed.find { it.entity_code == code }

  it "reports the latest Electoral Democracy Index score with its scale and year" do
    expect([find("FRA").value, find("FRA").period]).to eq(
      [{"score" => 0.865, "index" => "V-Dem Electoral Democracy Index", "scaleMin" => 0, "scaleMax" => 1}, "2025"]
    )
  end

  it "reports Kosovo under XKX rather than Our World in Data's OWID_KOS" do
    expect(find("XKX")).to be_present
  end

  it "skips a country whose latest score is too old to describe it today" do
    expect(find("PSE")).to be_nil
  end

  it "skips Our World in Data's regional aggregates" do
    expect(observed.map(&:entity_code)).to all(match(/\A[A-Z]{3}\z/))
  end
end
