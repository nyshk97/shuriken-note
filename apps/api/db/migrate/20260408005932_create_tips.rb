# frozen_string_literal: true

class CreateTips < ActiveRecord::Migration[8.1]
  def change
    create_table :tips do |t|
      t.uuid :note_id, null: false
      t.integer :amount_cents, null: false
      t.string :currency, null: false, default: 'usd'
      t.string :message, limit: 500
      t.string :tipper_name, limit: 100
      t.string :stripe_session_id, null: false
      t.string :stripe_payment_intent_id
      t.string :status, null: false, default: 'pending'

      t.timestamps
    end

    add_index :tips, :note_id
    add_index :tips, :stripe_session_id, unique: true
    add_index :tips, :status
    add_foreign_key :tips, :notes, on_delete: :cascade
  end
end
