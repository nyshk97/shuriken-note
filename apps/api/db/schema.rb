# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_01_15_222937) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_bigm"
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "notes", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.text "body", default: "", null: false
    t.datetime "created_at", null: false
    t.string "status", default: "personal", null: false
    t.string "title", default: "", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index [ "body" ], name: "index_notes_on_body_bigm", opclass: :gin_bigm_ops, using: :gin
    t.index [ "status" ], name: "index_notes_on_status"
    t.index [ "title" ], name: "index_notes_on_title_bigm", opclass: :gin_bigm_ops, using: :gin
    t.index [ "user_id" ], name: "index_notes_on_user_id"
  end

  create_table "refresh_tokens", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "token", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index [ "token" ], name: "index_refresh_tokens_on_token", unique: true
    t.index [ "user_id" ], name: "index_refresh_tokens_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.datetime "updated_at", null: false
    t.index [ "email" ], name: "index_users_on_email", unique: true
  end

  add_foreign_key "notes", "users"
  add_foreign_key "refresh_tokens", "users"
end
