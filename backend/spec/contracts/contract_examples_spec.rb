require "rails_helper"

RSpec.describe "Published contract v1" do
  contracts = Rails.root.join("../contracts")
  examples = contracts.join("examples")
  schema_for = ->(name) { JSONSchemer.schema(contracts.join("v1/#{name}.schema.json")) }
  errors_for = ->(name, document) { schema_for.call(name).validate(document).pluck("error") }
  example = ->(path) { JSON.parse(examples.join(path).read) }

  describe "examples" do
    it "include a profile for each fixture country" do
      codes = examples.glob("countries/*.json").map { it.basename(".json").to_s }

      expect(codes).to contain_exactly("DNK", "FRA", "NLD", "TWN", "XKX")
    end

    it "have a valid manifest" do
      expect(errors_for.call("manifest", example.call("manifest.json"))).to be_empty
    end

    it "have a valid index" do
      expect(errors_for.call("index", example.call("index.json"))).to be_empty
    end

    %w[DNK FRA NLD TWN XKX].each do |code|
      it "have a valid #{code} profile" do
        expect(errors_for.call("country", example.call("countries/#{code}.json"))).to be_empty
      end
    end
  end

  describe "country schema" do
    let(:profile) { example.call("countries/FRA.json") }

    it "rejects a fact without a source" do
      profile["header"]["capital"].delete("source")

      expect(errors_for.call("country", profile).join).to include("/header/capital")
    end

    it "rejects keys the contract does not define" do
      profile["header"]["capital"]["confidence"] = "high"

      expect(errors_for.call("country", profile).join).to include("/header/capital/confidence")
    end
  end

  describe "index schema" do
    it "rejects a territory without a parent" do
      index = example.call("index.json")
      greenland = index["entities"].find { it["code"] == "GRL" }
      greenland["parent"] = nil

      expect(errors_for.call("index", index).join).to match(%r{/entities/\d+/parent})
    end
  end

  describe "fields.json" do
    it "describes exactly the sourced fields of the country schema" do
      schema = JSON.parse(contracts.join("v1/country.schema.json").read)
      sections = %w[header leadership government people economy politics]
      schema_keys = sections.flat_map { |s| schema.dig("properties", s, "properties").keys.map { "#{s}.#{it}" } }
      field_keys = JSON.parse(contracts.join("v1/fields.json").read)["fields"].pluck("key")

      expect(field_keys).to match_array(schema_keys)
    end
  end
end
