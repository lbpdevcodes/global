module Snapshot
  # One entity's row in the index.
  class IndexEntry
    # The conflict layer's class: the most serious status among a country's items.
    CONFLICT_CLASS = lambda do |items|
      return "active_conflict" if items.any? { it["status"] == "active_conflict" }

      items.any? ? "tension" : "none"
    end

    # Each layer's field, and how to reduce the field's value to what the map colors by.
    LAYERS = {"governmentType" => ["government.governmentType", :itself.to_proc],
              "democracyScore" => ["government.democracyScore", ->(value) { value["score"] }],
              "population" => ["people.population", :itself.to_proc],
              "conflictStatus" => ["tensions.ucdp", CONFLICT_CLASS]}

    def initialize(entity, facts)
      @entity = entity
      @facts = facts
    end

    def to_h
      {"code" => entity.code, "name" => name_of(entity), "kind" => entity.kind, "parent" => entity.parent&.code,
       "aliases" => aliases, "centroid" => value("index.centroid"),
       "recognition" => value("government.recognitionStatus"), "layers" => layers, "note" => note}
    end

    private

    attr_reader :entity, :facts

    def value(field_key, of: entity) = facts.for(of, field_key)&.value

    def name_of(subject) = value("header.name", of: subject) || subject.name

    def aliases
      [value("header.officialName"), *value("index.aliases")].compact.uniq - [name_of(entity)]
    end

    def layers
      return if entity.territory?

      LAYERS.transform_values { |field_key, reduce| layer(facts.for(entity, field_key), reduce) }
    end

    def layer(observation, reduce)
      return if observation.nil?

      SourcedField.from(observation).slice("asOf").merge("value" => reduce.call(observation.value))
    end

    def note
      status = facts.for(entity, "territory.status")
      return if status.nil? || !entity.territory?

      SourcedField.from(status).merge("value" => "#{status.value.humanize} of #{name_of(entity.parent)}")
    end
  end
end
