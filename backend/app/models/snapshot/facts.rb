module Snapshot
  # The latest observation of every entity field, loaded once per snapshot.
  class Facts
    def self.load
      new(Observation.order(:first_seen_at, :id).to_a)
    end

    def initialize(observations)
      @latest = observations.index_by { [it.entity_id, it.field_key] }
    end

    def for(entity, field_key)
      latest[[entity.id, field_key]]
    end

    private

    attr_reader :latest
  end
end
