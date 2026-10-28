module Snapshot
  # One profiled entity as contracts/v1/country.schema.json.
  class CountryProfile
    def initialize(entity, facts, generated_at:)
      @entity = entity
      @facts = facts
      @generated_at = generated_at
    end

    def to_h
      {"code" => entity.code, **sections, "tensions" => {"items" => []},
       "meta" => {"lastUpdated" => generated_at.utc.iso8601, "sources" => sources}}
    end

    private

    attr_reader :entity, :facts, :generated_at

    def sections
      FieldCatalog.by_section.to_h do |section, fields|
        [section, fields.to_h { [it, SourcedField.from(observation("#{section}.#{it}"))] }]
      end
    end

    def observation(field_key) = facts.for(entity, field_key)

    def sources
      FieldCatalog.all.map { observation(it.key) }
        .compact.map(&:source_key).uniq.sort.map { SourceCatalog.reference(it) }
    end
  end
end
