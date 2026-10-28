# Profile fields past their refresh window plus a day of grace
# (docs/adr/0005-freshness.md). Any entry means the daily job should alert.
class FreshnessReport
  Stale = Data.define(:code, :name, :field, :as_of)
  GRACE_DAYS = 1

  def initialize(facts, today: Date.current)
    @facts = facts
    @today = today
  end

  def stale
    Entity.profiled.order(:code).flat_map do |entity|
      FieldCatalog.all.filter_map { |field| stale_field(entity, field) }
    end
  end

  def to_markdown
    rows = stale.map { "| #{it.name} | #{it.field.label} | #{it.as_of.iso8601} | #{it.field.refresh_days} days |" }
    ["#{rows.size} fields are past their refresh window.", "", "| Country | Field | Last confirmed | Window |",
      "|---|---|---|---|", *rows].join("\n")
  end

  private

  attr_reader :facts, :today

  def stale_field(entity, field)
    observation = facts.for(entity, field.key)
    return if observation.nil?

    as_of = observation.last_confirmed_at.to_date
    Stale.new(code: entity.code, name: entity.name, field: field, as_of: as_of) if (today - as_of).to_i > field.refresh_days + GRACE_DAYS
  end
end
