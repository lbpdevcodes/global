# Profile fields in display order, with refresh windows, from the shared
# contracts/v1/fields.json.
module FieldCatalog
  Field = Data.define(:key, :label, :refresh_days) do
    def section = key.split(".").first

    def name = key.split(".").last
  end

  def self.all
    @all ||= JSON.parse(Rails.root.join("../contracts/v1/fields.json").read).fetch("fields")
      .map { Field.new(key: it["key"], label: it["label"], refresh_days: it["refreshDays"]) }
  end

  def self.by_section
    all.group_by(&:section).transform_values { |fields| fields.map(&:name) }
  end
end
