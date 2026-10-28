require "rails_helper"

RSpec.describe Sources::WorldBank do
  let(:fetcher) do
    FixtureFetcher.new do |url, _query|
      file = url.end_with?("/country") ? "countries" : url[%r{indicator/([^/]+)\z}, 1]
      FixtureFetcher.json("world_bank/#{file}.json")
    end
  end
  let(:observed) { Sources::WorldBank.new(fetcher: fetcher).observations }

  it_behaves_like "a source"

  def find(code, field_key) = observed.find { it.entity_code == code && it.field_key == field_key }

  it "reports the latest population with the year it describes" do
    population = find("FRA", "people.population")

    expect([population.value, population.period]).to eq([68_720_337, "2025"])
  end

  it "links each value to the indicator's page for that country" do
    expect(find("FRA", "people.population").source_url)
      .to eq("https://data.worldbank.org/indicator/SP.POP.TOTL?locations=FR")
  end

  it "reports GDP and GDP per person" do
    expect(find("FRA", "economy.gdpUsd").value).to be > 1e12
    expect(find("FRA", "economy.gdpPerCapitaUsd").value).to be_between(10_000, 100_000)
  end

  it "ranks merchandise exports by product group, largest share first" do
    exports = find("FRA", "economy.topExports")

    expect(exports.value.first).to eq("product" => "Manufactures", "sharePercent" => 78.5)
    expect(exports.value.pluck("sharePercent")).to eq(exports.value.pluck("sharePercent").sort.reverse)
  end

  it "uses Kosovo's World Bank code, which matches ours" do
    expect(find("XKX", "people.population")).to be_present
  end

  it "leaves out regional aggregates and missing values" do
    expect(observed.map(&:entity_code)).not_to include("WLD")
    expect(find("ERI", "people.population")).to be_nil
  end

  it "reports one value per field, the latest year, even when the API returns several years" do
    per_person = observed.select { it.entity_code == "FRA" && it.field_key == "economy.gdpPerCapitaUsd" }

    expect(per_person.map(&:period)).to eq(["2025"])
  end
end
