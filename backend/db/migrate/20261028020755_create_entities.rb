class CreateEntities < ActiveRecord::Migration[8.1]
  def change
    create_table :entities do |t|
      t.string :code, null: false
      t.string :iso2
      t.string :wikidata_qid
      t.string :name, null: false
      t.string :kind, null: false
      t.references :parent, foreign_key: {to_table: :entities}
      t.timestamps
    end
    add_index :entities, :code, unique: true
  end
end
