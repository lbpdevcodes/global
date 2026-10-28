module Snapshot
  # Every entity as contracts/v1/index.schema.json: what search and map
  # layers need before any country is opened.
  class Index
    def initialize(entities, facts, snapshot_id:)
      @entities = entities
      @facts = facts
      @snapshot_id = snapshot_id
    end

    def to_h
      {"snapshotId" => snapshot_id,
       "entities" => entities.includes(:parent).order(:code).map { IndexEntry.new(it, facts).to_h }}
    end

    private

    attr_reader :entities, :facts, :snapshot_id
  end
end
