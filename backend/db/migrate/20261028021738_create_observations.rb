class CreateObservations < ActiveRecord::Migration[8.1]
  def change
    # first_seen_at and last_confirmed_at are this table's timestamps.
    create_table :observations do |t| # rubocop:disable Rails/CreateTableWithTimestamps
      t.references :entity, null: false, foreign_key: true
      t.string :field_key, null: false
      t.json :value
      t.string :source_key, null: false
      t.string :source_url, null: false
      t.string :period
      t.string :value_hash, null: false
      t.datetime :first_seen_at, null: false
      t.datetime :last_confirmed_at, null: false
    end
    add_index :observations, [:entity_id, :field_key, :first_seen_at]
  end
end
