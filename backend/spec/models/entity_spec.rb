require "rails_helper"

RSpec.describe Entity do
  it "is valid as a sovereign state with a three-letter code" do
    expect(build(:entity, code: "FRA", kind: "sovereign")).to be_valid
  end

  it "rejects a code that is not three capital letters" do
    entity = build(:entity, code: "fr")

    expect(entity).not_to be_valid
    expect(entity.errors[:code]).to include("is invalid")
  end

  it "rejects a code another entity already has" do
    create(:entity, code: "FRA")

    expect(build(:entity, code: "FRA")).not_to be_valid
  end

  it "is kept unique by the database even when validations are skipped" do
    create(:entity, code: "FRA")

    expect { build(:entity, code: "FRA").save(validate: false) }.to raise_error(ActiveRecord::RecordNotUnique)
  end

  it "rejects a kind outside sovereign, partially recognized and territory" do
    entity = build(:entity, kind: "colony")

    expect(entity).not_to be_valid
    expect(entity.errors[:kind]).to include("is not included in the list")
  end

  it "requires a territory to name the profile it folds into" do
    territory = build(:territory, parent: nil)

    expect(territory).not_to be_valid
    expect(territory.errors[:parent]).to include("can't be blank")
  end

  it "rejects a parent on anything other than a territory" do
    entity = build(:entity, kind: "sovereign", parent: build(:entity))

    expect(entity).not_to be_valid
    expect(entity.errors[:parent]).to include("must be blank")
  end

  describe ".profiled" do
    it "includes sovereign and partially recognized entities but not territories" do
      denmark = create(:entity, code: "DNK", kind: "sovereign")
      kosovo = create(:entity, code: "XKX", kind: "partially_recognized")
      create(:territory, code: "GRL", parent: denmark)

      expect(Entity.profiled).to contain_exactly(denmark, kosovo)
    end
  end
end
