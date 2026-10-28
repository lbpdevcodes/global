require "rails_helper"

RSpec.describe Publisher do
  around { |example| Dir.mktmpdir { |dir| @out = Pathname(dir) and example.run } }

  let(:validator) { instance_double(ContractValidator, validate!: true) }
  let(:publisher) { Publisher.new(validator: validator) }
  let(:published) { @out.join("data/v1") }

  it "writes every file under data/v1" do
    publisher.publish({"index.json" => {"a" => 1}, "countries/FRA.json" => {"b" => 2}}, to: @out)

    expect(JSON.parse(published.join("countries/FRA.json").read)).to eq("b" => 2)
  end

  it "replaces the previous snapshot, so a dropped file does not linger" do
    publisher.publish({"countries/OLD.json" => {}}, to: @out)
    publisher.publish({"countries/FRA.json" => {}}, to: @out)

    expect(published.glob("countries/*").map { it.basename.to_s }).to eq(["FRA.json"])
  end

  it "leaves the previous snapshot in place when any file is invalid" do
    publisher.publish({"index.json" => {"version" => 1}}, to: @out)
    allow(validator).to receive(:validate!).and_raise(ContractValidator::Invalid, "index.json: / bad")

    expect { publisher.publish({"index.json" => {"version" => 2}}, to: @out) }.to raise_error(ContractValidator::Invalid)
    expect(JSON.parse(published.join("index.json").read)).to eq("version" => 1)
  end

  it "refuses a country file over 20 KB" do
    big = {"padding" => "x" * 21_000}

    expect { publisher.publish({"countries/FRA.json" => big}, to: @out) }
      .to raise_error(Publisher::TooLarge, /countries\/FRA.json is \d+ bytes/)
  end
end
