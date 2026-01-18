# frozen_string_literal: true

class RenameImagesToAttachments < ActiveRecord::Migration[8.0]
  def up
    execute <<-SQL.squish
      UPDATE active_storage_attachments
      SET name = 'attachments'
      WHERE name = 'images' AND record_type = 'Note'
    SQL
  end

  def down
    execute <<-SQL.squish
      UPDATE active_storage_attachments
      SET name = 'images'
      WHERE name = 'attachments' AND record_type = 'Note'
    SQL
  end
end
