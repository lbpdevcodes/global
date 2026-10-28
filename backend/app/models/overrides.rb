# Reviewed editorial values from config/overrides.yml. They stand in for an
# observation, dated by their review rather than by the daily run.
class Overrides
  Value = Data.define(:value, :source_url, :last_confirmed_at, :period, :source_key)

  def self.load(path = Rails.root.join("config/overrides.yml"))
    new(YAML.load_file(path, permitted_classes: [Date]))
  end

  def initialize(entries)
    @values = entries.to_h { [[it["code"], it["field"]], value_from(it)] }
  end

  def for(code, field_key)
    values[[code, field_key]]
  end

  private

  attr_reader :values

  def value_from(entry)
    Value.new(value: entry["value"].deep_stringify_keys, source_url: entry["source_url"], period: nil,
      last_confirmed_at: Date.iso8601(entry["reviewed_on"].to_s).in_time_zone("UTC"), source_key: "editorial")
  end
end
