module Snapshot
  # One profiled entity as contracts/v1/country.schema.json.
  class CountryProfile
    def initialize(entity, facts, generated_at:)
      @entity = entity
      @facts = facts
      @generated_at = generated_at
    end

    TENSION_FIELDS = %w[tensions.ucdp]

    def to_h
      {"code" => entity.code, **sections, "tensions" => {"items" => tension_items},
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

    # Each item is dated by when its source last confirmed it.
    def tension_items
      TENSION_FIELDS.filter_map { observation(it) }.flat_map do |observed|
        observed.value.map { it.merge("asOf" => SourcedField.from(observed)["asOf"]) }
      end
    end

    def sources
      (FieldCatalog.all.map(&:key) + TENSION_FIELDS).filter_map { observation(it) }
        .map(&:source_key).uniq.sort.map { SourceCatalog.reference(it) }
    end
  end
end
