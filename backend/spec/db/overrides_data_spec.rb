require "rails_helper"

RSpec.describe "config/overrides.yml" do
  entries = YAML.load_file(Rails.root.join("config/overrides.yml"), permitted_classes: [Date])
  seeded = YAML.load_file(Rails.root.join("db/seeds/entities.yml")).pluck("code")

  it "covers the recognition of every profiled entity that is not a UN member" do
    covered = entries.select { it["field"] == "government.recognitionStatus" }.pluck("code")

    expect(covered).to contain_exactly("PSE", "VAT", "TWN", "XKX", "ESH")
  end

  entries.each do |entry|
    it "#{entry["code"]} #{entry["field"]}: names a seeded entity, a known field, an https source, a review date and a reason" do
      expect(seeded).to include(entry["code"])
      expect(FieldCatalog.known?(entry["field"])).to be(true)
      expect(entry["source_url"]).to start_with("https://")
      expect(Date.iso8601(entry["reviewed_on"].to_s)).to be_a(Date)
      expect(entry["reason"]).to be_present
    end
  end
end
