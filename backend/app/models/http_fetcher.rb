# The one way the engine talks HTTP. Sources receive a fetcher, so specs can
# hand them recorded responses instead of reaching the network.
class HttpFetcher
  class Error < StandardError; end

  def get_json(url, query: {}, headers: {})
    response = HTTParty.get(url, query: query, headers: headers, timeout: 30)
    raise Error, "GET #{url} returned HTTP #{response.code}" unless response.success?

    JSON.parse(response.body.dup.force_encoding(Encoding::UTF_8))
  end
end
