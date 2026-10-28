module Snapshot
  # One entity's row in the index.
  class IndexEntry
    LAYERS = {"governmentType" => "government.governmentType", "democracyScore" => "government.democracyScore",
              "population" => "people.population", "conflictStatus" => "tensions.conflictStatus"}

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

      LAYERS.transform_values { |field_key| layer(facts.for(entity, field_key)) }
    end

    def layer(observation)
      return if observation.nil?

      SourcedField.from(observation).slice("value", "asOf")
    end

    def note
      status = facts.for(entity, "territory.status")
      return if status.nil? || !entity.territory?

      SourcedField.from(status).merge("value" => "#{status.value.humanize} of #{name_of(entity.parent)}")
    end
  end
end
