# Append-only history: a row per distinct value of an entity field over time.
class Observation < ApplicationRecord
  belongs_to :entity

  scope :newest_first, -> { order(first_seen_at: :desc, id: :desc) }
end
