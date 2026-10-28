require "rails_helper"

RSpec.describe SpotCheck do
  let!(:france) { create(:entity, code: "FRA", name: "France", wikidata_qid: "Q142") }
  let(:wikipedia) do
    Object.new.tap do |fake|
      fake.define_singleton_method(:article_for) { |_qid| "France" }
      fake.define_singleton_method(:wikitext) do |title|
        path = Rails.root.join("spec/fixtures/wikipedia/#{title.tr(" ", "_")}.wikitext")
        path.exist? ? path.read : nil
      end
    end
  end

  def holder(name) = {"name" => name, "title" => "x", "since" => nil}

  def check = SpotCheck.new(wikipedia: wikipedia, sample: 1).results.first

  before do
    observe(france, "leadership.headOfState", holder("Emmanuel Macron"))
    observe(france, "leadership.headOfGovernment", holder("Sébastien Lecornu"))
    observe(france, "politics.rulingPartyOrCoalition", ["Renaissance"])
  end

  it "confirms leaders that the country's infobox names" do
    expect(check.verdicts.slice("Head of state", "Head of government").values).to all(be(:match))
  end

  it "flags a head of government the infobox does not name" do
    observe(france, "leadership.headOfGovernment", holder("Someone Else"))

    expect(check.verdicts["Head of government"]).to eq(:mismatch)
  end

  it "checks the ruling party against the head of government's own infobox" do
    expect(check.verdicts["Ruling party"]).to eq(:match)
  end

  it "renders a checklist naming each country, verdict and article" do
    markdown = SpotCheck.new(wikipedia: wikipedia, sample: 1).to_markdown

    expect(markdown).to include("3 of 3 checks match Wikipedia.").and include("| France | match | match | match | [France](https://en.wikipedia.org/wiki/France) |")
  end

  it "marks a country unverifiable instead of stopping when Wikipedia cannot be reached" do
    wikipedia.define_singleton_method(:wikitext) { |_title| raise HttpFetcher::Error, "GET x returned HTTP 503" }

    expect(check.verdicts.values).to all(be(:unverifiable))
  end
end
