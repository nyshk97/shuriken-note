# frozen_string_literal: true

class RemoveSlugFromNotes < ActiveRecord::Migration[8.1]
  def change
    remove_index :notes, :slug
    remove_column :notes, :slug, :string, null: false
  end
end
