require "rails_helper"

RSpec.describe Snapshot::Builder do
  let!(:denmark) { create(:entity, code: "DNK") }
  let!(:greenland) { create(:territory, code: "GRL", parent: denmark) }
  let(:files) { Snapshot::Builder.new(generated_at: Time.zone.parse("2026-10-27 07:00:00")).files }

  it "writes one country file per profiled entity and none for territories" do
    expect(files.keys).to contain_exactly("manifest.json", "index.json", "countries/DNK.json")
  end

  it "describes the snapshot in the manifest" do
    expect(files["manifest.json"]).to eq(
      "snapshotId" => "2026-10-27T070000Z", "schemaVersion" => "1.0",
      "generatedAt" => "2026-10-27T07:00:00Z", "counts" => {"entities" => 2, "profiles" => 1}
    )
  end
end
