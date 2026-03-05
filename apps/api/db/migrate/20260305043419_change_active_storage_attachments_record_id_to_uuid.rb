# frozen_string_literal: true

class ChangeActiveStorageAttachmentsRecordIdToUuid < ActiveRecord::Migration[8.1]
  def up
    remove_index :active_storage_attachments,
                 %i[record_type record_id name blob_id],
                 name: :index_active_storage_attachments_uniqueness

    change_column :active_storage_attachments, :record_id, :uuid, null: false,
                  using: "gen_random_uuid()"

    add_index :active_storage_attachments,
              %i[record_type record_id name blob_id],
              unique: true,
              name: :index_active_storage_attachments_uniqueness
  end

  def down
    remove_index :active_storage_attachments,
                 name: :index_active_storage_attachments_uniqueness

    change_column :active_storage_attachments, :record_id, :bigint, null: false

    add_index :active_storage_attachments,
              %i[record_type record_id name blob_id],
              unique: true,
              name: :index_active_storage_attachments_uniqueness
  end
end
