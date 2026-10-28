require "rails_helper"

RSpec.describe HttpFetcher do
  let(:url) { "https://api.example.test/countries" }

  it "returns the parsed JSON body as UTF-8 even when the server names no charset" do
    stub_request(:get, url).to_return(
      body: {name: "Côte d'Ivoire"}.to_json.b, headers: {"Content-Type" => "application/json"}
    )

    expect(HttpFetcher.new.get_json(url)).to eq("name" => "Côte d'Ivoire")
  end

  it "sends the query and headers it is given" do
    stub_request(:get, url).with(query: {limit: "100"}, headers: {"Authorization" => "Bearer k"})
      .to_return(body: "{}")

    HttpFetcher.new.get_json(url, query: {limit: 100}, headers: {"Authorization" => "Bearer k"})

    expect(a_request(:get, url).with(query: {limit: "100"})).to have_been_made
  end

  it "raises with the status and URL when the response is not successful" do
    stub_request(:get, url).to_return(status: 403, body: "frozen")

    expect { HttpFetcher.new.get_json(url) }
      .to raise_error(HttpFetcher::Error, "GET #{url} returned HTTP 403")
  end

  it "returns a text body as UTF-8" do
    stub_request(:get, url).to_return(body: "entity,code\nCôte d'Ivoire,CIV\n".b)

    expect(HttpFetcher.new.get_text(url)).to eq("entity,code\nCôte d'Ivoire,CIV\n")
  end
end
