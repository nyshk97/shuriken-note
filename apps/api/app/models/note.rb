# frozen_string_literal: true

class Note < ApplicationRecord
  belongs_to :user
  has_many_attached :images # Named 'images' for legacy reasons, but supports all file types

  # Allowed file types (allowlist approach)
  ALLOWED_IMAGE_TYPES = %w[image/jpeg image/png image/gif image/webp].freeze
  ALLOWED_DOCUMENT_TYPES = %w[application/pdf].freeze
  ALLOWED_TEXT_TYPES = %w[text/plain text/csv application/json].freeze
  ALLOWED_ARCHIVE_TYPES = %w[application/zip].freeze

  ALLOWED_FILE_TYPES = (
    ALLOWED_IMAGE_TYPES +
    ALLOWED_DOCUMENT_TYPES +
    ALLOWED_TEXT_TYPES +
    ALLOWED_ARCHIVE_TYPES
  ).freeze

  MAX_FILE_SIZE = 30.megabytes

  enum :status, {
    personal: 'personal',
    published: 'published',
    archived: 'archived'
  }, default: :personal

  validates :status, presence: true
  validate :validate_images

  def self.image_type?(content_type)
    ALLOWED_IMAGE_TYPES.include?(content_type)
  end

  private

  def validate_images
    return unless images.attached?

    images.each do |image|
      unless ALLOWED_FILE_TYPES.include?(image.content_type)
        errors.add(:images, "has unsupported file type: #{image.content_type}")
      end

      if image.blob.byte_size > MAX_FILE_SIZE
        errors.add(:images, "must be less than #{MAX_FILE_SIZE / 1.megabyte}MB")
      end
    end
  end

  # Full-text search using pg_bigm
  # Searches title and body with ILIKE for case-insensitive matching
  scope :search, ->(query) {
    return all if query.blank?

    sanitized = "%#{sanitize_sql_like(query)}%"
    where('title ILIKE :q OR body ILIKE :q', q: sanitized)
  }
end
