module Observations
  # Records an observed value: a new row when it differs from the field's
  # latest row, otherwise only the latest row's confirmation time moves.
  class Recorder
    def record(entity, observed, at:)
      latest = entity.observations.where(field_key: observed.field_key).newest_first.first
      return latest.update!(last_confirmed_at: at) if latest&.value_hash == observed.fingerprint

      entity.observations.create!(new_row(observed, at))
    end

    private

    def new_row(observed, at)
      observed.to_h.except(:entity_code).merge(value_hash: observed.fingerprint,
        first_seen_at: at, last_confirmed_at: at)
    end
  end
end
