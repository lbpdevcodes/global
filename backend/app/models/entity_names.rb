# Finds an entity code from a country name as another source writes it:
# case- and accent-insensitive, ignoring a former name in parentheses
# ("Myanmar (Burma)").
class EntityNames
  def self.load(facts = Snapshot::Facts.load)
    names = Entity.profiled.flat_map do |entity|
      sourced = %w[header.name header.officialName index.aliases].flat_map { Array(facts.for(entity, it)&.value) }
      [entity.name, *sourced].map { [it, entity.code] }
    end
    new(names.to_h)
  end

  def initialize(names_to_codes)
    @codes = names_to_codes.transform_keys { normalize(it) }
  end

  def code_for(name)
    codes[normalize(name)]
  end

  def all_codes = codes.values.uniq

  private

  attr_reader :codes

  def normalize(name)
    ActiveSupport::Inflector.transliterate(name.gsub(/\(.*?\)/, "")).downcase.squish
  end
end
