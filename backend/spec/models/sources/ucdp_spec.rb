require "rails_helper"

RSpec.describe Sources::Ucdp do
  let(:fetcher) do
    Object.new.tap do |fake|
      fake.define_singleton_method(:get_text) { |_url, **| Rails.root.join("spec/fixtures/ucdp/downloads.html").read }
      fake.define_singleton_method(:get_bytes) do |url, **|
        raise "unexpected #{url}" unless url.end_with?("ucdp-prio-acd-261-csv.zip")
        Rails.root.join("spec/fixtures/ucdp/ucdp-prio-acd-261-csv.zip").binread
      end
    end
  end
  let(:names) { EntityNames.new({"India" => "IND", "Pakistan" => "PAK", "Myanmar" => "MMR", "Nepal" => "NPL"}) }
  let(:observed) { Sources::Ucdp.new(fetcher: fetcher, names: names).observations }

  it_behaves_like "a source"

  def items(code) = observed.find { it.entity_code == code }.value

  it "describes each armed conflict active in the latest year in UCDP's own terms" do
    expect(items("IND")).to eq([{
      "title" => "Government of India vs Government of Pakistan over Kashmir",
      "parties" => ["Government of India", "Government of Pakistan"], "status" => "active_conflict",
      "statusLabel" => "Minor armed conflict (25–999 battle-related deaths in 2025)",
      "sourceUrl" => "https://ucdp.uu.se/conflict/218"
    }])
  end

  it "labels a conflict at war intensity as a war" do
    expect(items("MMR").pluck("statusLabel")).to include("War (1,000+ battle-related deaths in 2025)")
  end

  it "lists an interstate conflict under every country where it is fought" do
    expect(items("PAK").pluck("sourceUrl")).to eq(["https://ucdp.uu.se/conflict/218"])
  end

  it "confirms an empty list for a country with no conflict recorded in the latest year" do
    expect(items("NPL")).to eq([])
  end

  it "dates each list by the year UCDP describes" do
    expect(observed.map(&:period).uniq).to eq(["2025"])
  end

  it "lists each actor on a side as its own party" do
    myanmar_war = items("MMR").find { it["sourceUrl"].end_with?("/222") }

    expect(myanmar_war["parties"]).to eq(["Government of Myanmar (Burma)", "NUG", "PSLF"])
  end
end
