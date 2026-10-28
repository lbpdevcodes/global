require "rails_helper"

RSpec.describe EntitySeed do
  let(:france) { {"code" => "FRA", "iso2" => "FR", "wikidata" => "Q142", "name" => "France", "kind" => "sovereign"} }

  it "creates an entity for each row" do
    EntitySeed.new([france]).apply

    expect(Entity.find_by!(code: "FRA")).to have_attributes(
      iso2: "FR", wikidata_qid: "Q142", name: "France", kind: "sovereign"
    )
  end

  it "links a territory to its parent even when the parent's row comes later" do
    greenland = {"code" => "GRL", "iso2" => "GL", "wikidata" => "Q223", "name" => "Greenland",
                 "kind" => "territory", "parent" => "DNK"}
    denmark = {"code" => "DNK", "iso2" => "DK", "wikidata" => "Q35", "name" => "Denmark", "kind" => "sovereign"}

    EntitySeed.new([greenland, denmark]).apply

    expect(Entity.find_by!(code: "GRL").parent).to eq(Entity.find_by!(code: "DNK"))
  end

  it "updates existing entities in place when applied again" do
    EntitySeed.new([france]).apply

    EntitySeed.new([france.merge("name" => "French Republic")]).apply

    expect(Entity.where(code: "FRA").pluck(:name)).to eq(["French Republic"])
  end

  it "saves nothing and names the row when a parent code is unknown" do
    orphan = {"code" => "GRL", "iso2" => "GL", "wikidata" => "Q223", "name" => "Greenland",
              "kind" => "territory", "parent" => "ZZZ"}

    expect { EntitySeed.new([france, orphan]).apply }
      .to raise_error(EntitySeed::UnknownParent, "GRL names parent ZZZ, which is not in the seed")
    expect(Entity.count).to eq(0)
  end
end
