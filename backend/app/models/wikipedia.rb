# Reads English Wikipedia articles: used only to spot-check our values.
class Wikipedia
  HEADERS = {"User-Agent" => Wikidata::Query::HEADERS["User-Agent"]}

  def initialize(fetcher: HttpFetcher.new)
    @fetcher = fetcher
  end

  def article_for(qid)
    response = fetcher.get_json("https://www.wikidata.org/w/api.php", headers: HEADERS,
      query: {action: "wbgetentities", ids: qid, props: "sitelinks", sitefilter: "enwiki", format: "json"})
    response.dig("entities", qid, "sitelinks", "enwiki", "title")
  end

  # The article's lead section as wikitext (where infoboxes live), or nil.
  def wikitext(title)
    response = fetcher.get_json("https://en.wikipedia.org/w/api.php", headers: HEADERS,
      query: {action: "parse", page: title, prop: "wikitext", section: 0, redirects: 1, format: "json", formatversion: 2})
    response.dig("parse", "wikitext")
  end

  private

  attr_reader :fetcher
end
