# frozen_string_literal: true

class CreateNotes < ActiveRecord::Migration[8.0]
  def change
    enable_extension 'pgcrypto' unless extension_enabled?('pgcrypto')

    create_table :notes, id: :uuid do |t|
      t.uuid   :user_id, null: false
      t.string :title,   null: false, default: ''
      t.text   :body,    null: false, default: ''
      t.string :slug,    null: false
      t.string :status,  null: false, default: 'private'

      t.timestamps
    end

    add_index :notes, :user_id
    add_index :notes, :slug
    add_index :notes, :status
  end
end
