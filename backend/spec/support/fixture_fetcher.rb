# Plays the HttpFetcher role in specs: answers get_json from recorded files and
# remembers every request it was asked to make.
class FixtureFetcher
  attr_reader :requests

  def initialize(&responder)
    @responder = responder
    @requests = []
  end

  def get_json(url, query: {}, headers: {})
    requests << {url: url, query: query, headers: headers}
    @responder.call(url, query)
  end

  def self.json(path)
    JSON.parse(Rails.root.join("spec/fixtures", path).read)
  end
end
