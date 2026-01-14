# frozen_string_literal: true

class EnablePgBigmAndAddSearchIndexes < ActiveRecord::Migration[8.1]
  def up
    # Enable pg_bigm extension for Japanese full-text search
    execute "CREATE EXTENSION IF NOT EXISTS pg_bigm"

    # Add GIN indexes for title and body using pg_bigm
    execute <<-SQL
      CREATE INDEX index_notes_on_title_bigm ON notes USING gin (title gin_bigm_ops);
    SQL

    execute <<-SQL
      CREATE INDEX index_notes_on_body_bigm ON notes USING gin (body gin_bigm_ops);
    SQL
  end

  def down
    execute "DROP INDEX IF EXISTS index_notes_on_body_bigm"
    execute "DROP INDEX IF EXISTS index_notes_on_title_bigm"
    execute "DROP EXTENSION IF EXISTS pg_bigm"
  end
end
