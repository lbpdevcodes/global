# The Source role: anything Refresh can run. Include in every source's spec
# with `let(:observed)` set to the source's observations.
RSpec.shared_examples "a source" do
  it "reports values only for three-letter entity codes" do
    expect(observed.map(&:entity_code)).to all(match(/\A[A-Z]{3}\z/))
  end

  it "uses field keys the snapshot knows" do
    expect(observed.map(&:field_key).uniq).to all(satisfy { FieldCatalog.known?(it) })
  end

  it "attributes every value to a declared source with an https link" do
    expect(observed.map(&:source_key).uniq).to all(satisfy { SourceCatalog.reference(it) })
    expect(observed.map(&:source_url).uniq).to all(start_with("https://"))
  end
end
