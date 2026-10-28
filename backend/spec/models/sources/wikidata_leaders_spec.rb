require "rails_helper"

RSpec.describe Sources::WikidataLeaders do
  let(:fetcher) do
    FixtureFetcher.new do |_url, query|
      FixtureFetcher.json(query[:query].include?("P102") ? "wikidata/parties.json" : "wikidata/leaders.json")
    end
  end
  let(:entities) do
    {"FRA" => "Q142", "HUN" => "Q28", "WSM" => "Q683", "LUX" => "Q32", "USA" => "Q30"}
      .map { |code, qid| Entity.new(code: code, wikidata_qid: qid) }
  end
  let(:observed) { Sources::WikidataLeaders.new(fetcher: fetcher, entities: entities).observations }

  it_behaves_like "a source"

  def find(code, field_key) = observed.find { it.entity_code == code && it.field_key == field_key }

  it "reports the head of state with their office and start date" do
    expect(find("FRA", "leadership.headOfState").value)
      .to eq("name" => "Emmanuel Macron", "title" => "President of the French Republic", "since" => "2017-05-14")
  end

  it "links each holder to the country's statement on Wikidata" do
    expect(find("FRA", "leadership.headOfGovernment").source_url).to eq("https://www.wikidata.org/wiki/Q142#P6")
  end

  it "follows Wikidata's preferred holder when former holders were never closed" do
    expect(find("HUN", "leadership.headOfState").value["name"]).to eq("András Baka")
  end

  it "finds the current holder among many former ones Wikidata never closed" do
    expect(find("LUX", "leadership.headOfGovernment").value)
      .to include("name" => "Luc Frieden", "since" => "2023-11-17")
  end

  it "reports the head of government's party as the ruling party" do
    expect(find("FRA", "politics.rulingPartyOrCoalition").value).to eq(["Renaissance"])
    expect(find("USA", "politics.rulingPartyOrCoalition").source_url).to eq("https://www.wikidata.org/wiki/Q22686#P102")
  end
end
