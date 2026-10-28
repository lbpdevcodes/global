require "rails_helper"

RSpec.describe "db/seeds/entities.yml" do
  rows = YAML.load_file(Rails.root.join("db/seeds/entities.yml"))

  it "loads cleanly and profiles 198 entities" do
    EntitySeed.new(rows).apply

    expect(Entity.profiled.count).to eq(198)
  end

  it "profiles the five entities beyond the UN members (ADR 0003)" do
    profiled = rows.reject { it["kind"] == "territory" }.pluck("code")

    expect(profiled).to include("VAT", "PSE", "TWN", "XKX", "ESH")
  end
end
