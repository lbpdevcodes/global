# Profile fields in display order, with refresh windows, from the shared
# contracts/v1/fields.json.
module FieldCatalog
  Field = Data.define(:key, :label, :refresh_days) do
    def section = key.split(".").first

    def name = key.split(".").last
  end

  # Fields the index carries that are not shown as profile rows.
  INDEX_ONLY = %w[index.aliases index.centroid territory.status tensions.ucdp]

  def self.known?(key)
    INDEX_ONLY.include?(key) || all.any? { it.key == key }
  end

  def self.all
    @all ||= JSON.parse(Rails.root.join("../contracts/v1/fields.json").read).fetch("fields")
      .map { Field.new(key: it["key"], label: it["label"], refresh_days: it["refreshDays"]) }
  end

  # Everything the freshness check watches: the profile fields plus the
  # armed-conflict list, which the PRD refreshes daily.
  def self.monitored
    all + [Field.new(key: "tensions.ucdp", label: "Armed conflicts (UCDP)", refresh_days: 1)]
  end

  def self.by_section
    all.group_by(&:section).transform_values { |fields| fields.map(&:name) }
  end
end
