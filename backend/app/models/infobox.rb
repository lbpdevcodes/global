# Pulls plain-text values out of a Wikipedia infobox's wikitext.
module Infobox
  def self.values(wikitext, field)
    wikitext.to_s.scan(/^\s*\|\s*#{field}\s*=\s*(.+)$/).flatten.map { plain(it) }.reject(&:empty?)
  end

  def self.plain(markup)
    markup.gsub(/<ref[^>]*\/>|<ref.*?<\/ref>/m, "").gsub(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/, '\1')
      .gsub(/\{\{[^{}]*\}\}/, "").gsub(/<[^>]+>/, "").gsub(/\(.*?\)/, "").squish
  end
end
