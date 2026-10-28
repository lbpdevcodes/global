# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_10_28_021738) do
  create_table "entities", force: :cascade do |t|
    t.string "code", null: false
    t.string "iso2"
    t.string "wikidata_qid"
    t.string "name", null: false
    t.string "kind", null: false
    t.integer "parent_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_entities_on_code", unique: true
    t.index ["parent_id"], name: "index_entities_on_parent_id"
  end

  create_table "observations", force: :cascade do |t|
    t.integer "entity_id", null: false
    t.string "field_key", null: false
    t.json "value"
    t.string "source_key", null: false
    t.string "source_url", null: false
    t.string "period"
    t.string "value_hash", null: false
    t.datetime "first_seen_at", null: false
    t.datetime "last_confirmed_at", null: false
    t.index ["entity_id", "field_key", "first_seen_at"], name: "idx_on_entity_id_field_key_first_seen_at_3c295c49ec"
    t.index ["entity_id"], name: "index_observations_on_entity_id"
  end

  add_foreign_key "entities", "entities", column: "parent_id"
  add_foreign_key "observations", "entities"
end
