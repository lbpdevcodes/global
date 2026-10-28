# Values a person should review: leaders and ruling parties that changed since
# a given time. A new row in a series that already had one is a change; the
# first value ever recorded is not.
class ChangeReport
  WATCHED = %w[leadership.headOfState leadership.headOfGovernment politics.rulingPartyOrCoalition]
  Change = Data.define(:entity, :field_key, :before, :after, :source_url)

  def initialize(since:)
    @since = since
  end

  def changes
    Observation.includes(:entity).where(field_key: WATCHED).where(first_seen_at: since..).order(:entity_id, :field_key)
      .filter_map { |row| change_from(row) }
  end

  def to_markdown
    rows = changes.map { |c| "| #{c.entity.name} | #{label(c.field_key)} | #{describe(c.before)} | #{describe(c.after)} | [source](#{c.source_url}) |" }
    ["#{rows.size} leadership or ruling-party changes to review.", "", "| Country | Field | Before | After | Check |",
      "|---|---|---|---|---|", *rows].join("\n")
  end

  private

  attr_reader :since

  def change_from(row)
    before = Observation.where(entity_id: row.entity_id, field_key: row.field_key).where(first_seen_at: ...row.first_seen_at)
      .newest_first.first
    Change.new(entity: row.entity, field_key: row.field_key, before: before.value, after: row.value, source_url: row.source_url) if before
  end

  def label(field_key) = FieldCatalog.all.find { it.key == field_key }.label

  def describe(value) = value.is_a?(Hash) ? value["name"] : Array(value).join(", ")
end
