# The one way the engine talks HTTP. Sources receive a fetcher, so specs can
# hand them recorded responses instead of reaching the network.
class HttpFetcher
  class Error < StandardError; end

  def get_json(url, query: {}, headers: {})
    JSON.parse(get_text(url, query: query, headers: headers))
  end

  def get_text(url, query: {}, headers: {})
    response = HTTParty.get(url, query: query, headers: headers, timeout: 60)
    raise Error, "GET #{url} returned HTTP #{response.code}" unless response.success?

    response.body.dup.force_encoding(Encoding::UTF_8)
  end
end
