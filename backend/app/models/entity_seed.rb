# Brings the entities table in line with the curated rows in db/seeds/entities.yml.
class EntitySeed
  class UnknownParent < StandardError; end

  def initialize(rows)
    @rows = rows
  end

  def apply
    Entity.transaction do
      parents_first.each do |row|
        Entity.find_or_initialize_by(code: row["code"]).update!(attributes_from(row))
      end
    end
  end

  private

  attr_reader :rows

  def parents_first
    rows.partition { it["parent"].nil? }.flatten(1)
  end

  def attributes_from(row)
    {code: row["code"], iso2: row["iso2"], wikidata_qid: row["wikidata"], name: row["name"],
     kind: row["kind"], parent: parent_of(row)}
  end

  def parent_of(row)
    return if row["parent"].nil?

    Entity.find_by(code: row["parent"]) ||
      raise(UnknownParent, "#{row["code"]} names parent #{row["parent"]}, which is not in the seed")
  end
end
