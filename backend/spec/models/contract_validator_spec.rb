require "rails_helper"

RSpec.describe ContractValidator do
  let(:manifest) do
    {"snapshotId" => "s", "schemaVersion" => "1.0", "generatedAt" => "2026-10-27T07:00:00Z",
     "counts" => {"entities" => 1, "profiles" => 1}}
  end

  it "accepts a file that matches its schema" do
    expect { ContractValidator.new.validate!("manifest.json", manifest) }.not_to raise_error
  end

  it "picks the country schema for files under countries/" do
    expect { ContractValidator.new.validate!("countries/FRA.json", manifest) }
      .to raise_error(ContractValidator::Invalid, /countries\/FRA.json/)
  end

  it "names the file and the failing location" do
    expect { ContractValidator.new.validate!("manifest.json", manifest.merge("schemaVersion" => "2.0")) }
      .to raise_error(ContractValidator::Invalid, %r{manifest.json: /schemaVersion})
  end
end
