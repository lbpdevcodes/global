require "rails_helper"

RSpec.describe Sources::RestCountries do
  let(:fetcher) do
    FixtureFetcher.new { |_url, query| FixtureFetcher.json("rest_countries/page-#{query[:offset] / 100}.json") }
  end
  let(:source) { Sources::RestCountries.new(fetcher: fetcher, api_key: "test-key") }
  let(:observed) { source.observations }

  it_behaves_like "a source"

  def value(code, field_key)
    observed.find { it.entity_code == code && it.field_key == field_key }&.value
  end

  it "pages through the list until the API says there is no more" do
    observed

    expect(fetcher.requests.map { it[:query][:offset] }).to eq([0, 100])
  end

  it "authenticates with the API key as a bearer token" do
    observed

    expect(fetcher.requests.first[:headers]).to eq("Authorization" => "Bearer test-key")
  end

  it "reports a country's header facts" do
    expect([value("FRA", "header.name"), value("FRA", "header.officialName"), value("FRA", "header.capital"),
      value("FRA", "header.flagEmoji"), value("FRA", "header.iso2"), value("FRA", "header.iso3")])
      .to eq(["France", "French Republic", "Paris", "🇫🇷", "FR", "FRA"])
  end

  it "reports official languages, search aliases and the centroid" do
    expect(value("FRA", "people.officialLanguages")).to eq(["French"])
    expect(value("FRA", "index.aliases")).to include("France métropolitaine")
    expect(value("FRA", "index.centroid")).to eq("lat" => 46, "lng" => 2)
  end

  it "lists every capital with the role the source gives it when there are several" do
    expect(value("BOL", "header.capital")).to eq("Sucre (constitutional), La Paz (administrative)")
  end

  it "reports Kosovo under XKX rather than the source's UNK" do
    expect(value("XKX", "header.name")).to eq("Kosovo")
    expect(observed.map(&:entity_code)).not_to include("UNK")
  end

  it "reports a territory's dependency type as its status" do
    expect(value("GRL", "territory.status")).to eq("autonomous_region")
    expect(value("FRA", "territory.status")).to be_nil
  end

  it "skips rows that have no three-letter code" do
    expect(observed.map(&:entity_code)).to all(match(/\A[A-Z]{3}\z/))
  end

  it "attributes every value to REST Countries" do
    expect(observed.map { [it.source_key, it.source_url] }.uniq)
      .to eq([["rest_countries", "https://restcountries.com/"]])
  end

  it "reports UN members as fully recognized and leaves others' recognition to editorial review" do
    expect(value("FRA", "government.recognitionStatus")).to eq("status" => "full", "note" => nil)
    expect(value("XKX", "government.recognitionStatus")).to be_nil
  end
end
