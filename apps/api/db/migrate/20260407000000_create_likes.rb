# frozen_string_literal: true

class CreateLikes < ActiveRecord::Migration[8.1]
  def change
    add_column :notes, :likes_count, :integer, default: 0, null: false

    create_table :likes do |t|
      t.uuid :note_id, null: false
      t.string :ip_address, null: false
      t.timestamps
    end

    add_index :likes, :note_id
    add_index :likes, [ :note_id, :ip_address ], unique: true
    add_foreign_key :likes, :notes, on_delete: :cascade
  end
end
