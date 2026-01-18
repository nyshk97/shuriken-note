# frozen_string_literal: true

class Note < ApplicationRecord
  belongs_to :user
  has_many_attached :images

  ALLOWED_IMAGE_TYPES = %w[image/jpeg image/png image/gif image/webp].freeze
  MAX_IMAGE_SIZE = 10.megabytes

  enum :status, {
    personal: 'personal',
    published: 'published',
    archived: 'archived'
  }, default: :personal

  validates :status, presence: true
  validate :validate_images

  private

  def validate_images
    return unless images.attached?

    images.each do |image|
      unless ALLOWED_IMAGE_TYPES.include?(image.content_type)
        errors.add(:images, "must be JPEG, PNG, GIF, or WebP (got #{image.content_type})")
      end

      if image.blob.byte_size > MAX_IMAGE_SIZE
        errors.add(:images, "must be less than #{MAX_IMAGE_SIZE / 1.megabyte}MB")
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
