module Snapshot
  # Every file of one snapshot, keyed by its path under data/v1.
  class Builder
    SCHEMA_VERSION = "1.0"

    def initialize(generated_at:)
      @generated_at = generated_at.utc
    end

    def files
      facts = Facts.load
      {"manifest.json" => manifest, "index.json" => Index.new(Entity.all, facts, snapshot_id: snapshot_id).to_h,
       **Entity.profiled.order(:code).to_h { ["countries/#{it.code}.json", CountryProfile.new(it, facts, generated_at:).to_h] }}
    end

    private

    attr_reader :generated_at

    def snapshot_id = generated_at.strftime("%Y-%m-%dT%H%M%SZ")

    def manifest
      {"snapshotId" => snapshot_id, "schemaVersion" => SCHEMA_VERSION, "generatedAt" => generated_at.iso8601,
       "counts" => {"entities" => Entity.count, "profiles" => Entity.profiled.count}}
    end
  end
end
