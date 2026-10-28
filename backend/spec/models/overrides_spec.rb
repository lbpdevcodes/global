require "rails_helper"

RSpec.describe Overrides do
  let(:entry) do
    {"code" => "XKX", "field" => "government.recognitionStatus",
     "value" => {"status" => "partial", "note" => "Recognized by some UN member states"},
     "source_url" => "https://en.wikipedia.org/wiki/International_recognition_of_Kosovo",
     "reviewed_on" => "2026-10-27", "reason" => "No structured source"}
  end

  it "supplies the reviewed value with its source, dated by its review" do
    override = Overrides.new([entry]).for("XKX", "government.recognitionStatus")

    expect(Snapshot::SourcedField.from(override)).to eq(
      "value" => {"status" => "partial", "note" => "Recognized by some UN member states"},
      "source" => "https://en.wikipedia.org/wiki/International_recognition_of_Kosovo", "asOf" => "2026-10-27"
    )
  end

  it "supplies nothing for a field it does not cover" do
    expect(Overrides.new([entry]).for("XKX", "header.capital")).to be_nil
  end
end
