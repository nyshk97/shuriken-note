# frozen_string_literal: true

class AddParentNoteIdToNotes < ActiveRecord::Migration[8.1]
  def change
    add_column :notes, :parent_note_id, :uuid, null: true
    add_index :notes, :parent_note_id
    add_foreign_key :notes, :notes, column: :parent_note_id, on_delete: :cascade
  end
end
