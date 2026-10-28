# The sources declared in config/sources.yml.
module SourceCatalog
  def self.reference(key)
    source = Rails.application.config_for(:sources).fetch(key.to_sym)
    {"name" => source[:name], "url" => source[:url]}
  end
end
