# frozen_string_literal: true

class Note < ApplicationRecord
  belongs_to :user

  enum :status, {
    personal: 'personal',
    published: 'published',
    archived: 'archived'
  }, default: :personal

  validates :status, presence: true

  # Full-text search using pg_bigm
  # Searches title and body with ILIKE for case-insensitive matching
  scope :search, ->(query) {
    return all if query.blank?

    sanitized = "%#{sanitize_sql_like(query)}%"
    where('title ILIKE :q OR body ILIKE :q', q: sanitized)
  }
end
