# frozen_string_literal: true

class SeparateVisibilityFromLifecycle < ActiveRecord::Migration[8.1]
  def up
    add_column :notes, :visibility, :string, null: false, default: 'personal'
    add_column :notes, :archived, :boolean, null: false, default: false

    # Migrate existing data
    execute <<~SQL
      UPDATE notes SET visibility = 'personal', archived = false WHERE status = 'personal';
      UPDATE notes SET visibility = 'unlisted', archived = false WHERE status = 'published';
      UPDATE notes SET visibility = 'personal', archived = true  WHERE status = 'archived';
    SQL

    add_index :notes, :visibility
    add_index :notes, :archived

    remove_index :notes, :status
    remove_column :notes, :status
  end

  def down
    add_column :notes, :status, :string, null: false, default: 'personal'

    execute <<~SQL
      UPDATE notes SET status = 'personal'  WHERE visibility = 'personal' AND archived = false;
      UPDATE notes SET status = 'published' WHERE visibility = 'unlisted' AND archived = false;
      UPDATE notes SET status = 'published' WHERE visibility = 'public'   AND archived = false;
      UPDATE notes SET status = 'archived'  WHERE archived = true;
    SQL

    add_index :notes, :status

    remove_index :notes, :visibility
    remove_index :notes, :archived
    remove_column :notes, :visibility
    remove_column :notes, :archived
  end
end
