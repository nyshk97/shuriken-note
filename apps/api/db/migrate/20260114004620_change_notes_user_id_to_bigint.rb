class ChangeNotesUserIdToBigint < ActiveRecord::Migration[8.1]
  def up
    # Remove the uuid column and add bigint column
    remove_column :notes, :user_id
    add_column :notes, :user_id, :bigint, null: false
    add_index :notes, :user_id
    add_foreign_key :notes, :users
  end

  def down
    remove_foreign_key :notes, :users
    remove_index :notes, :user_id
    remove_column :notes, :user_id
    add_column :notes, :user_id, :uuid, null: false
    add_index :notes, :user_id
  end
end
