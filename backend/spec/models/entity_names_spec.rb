require "rails_helper"

RSpec.describe EntityNames do
  let(:names) { EntityNames.new({"Myanmar" => "MMR", "United States of America" => "USA", "Côte d'Ivoire" => "CIV"}) }

  it "finds a code by name, ignoring case and accents" do
    expect(names.code_for("cote d'ivoire")).to eq("CIV")
  end

  it "ignores a former name given in parentheses" do
    expect(names.code_for("Myanmar (Burma)")).to eq("MMR")
  end

  it "returns nil for a name it does not know" do
    expect(names.code_for("Atlantis")).to be_nil
  end
end
