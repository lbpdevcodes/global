module Snapshot
  # The latest observation of every entity field, loaded once per snapshot,
  # with reviewed overrides taking precedence.
  class Facts
    def self.load(overrides: Overrides.load)
      new(Observation.order(:first_seen_at, :id).to_a, overrides: overrides)
    end

    def initialize(observations, overrides: Overrides.new([]))
      @latest = observations.index_by { [it.entity_id, it.field_key] }
      @overrides = overrides
    end

    # A reviewed override wins over anything a source reported.
    def for(entity, field_key)
      overrides.for(entity.code, field_key) || latest[[entity.id, field_key]]
    end

    private

    attr_reader :latest, :overrides
  end
end
