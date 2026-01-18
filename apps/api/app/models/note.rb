# frozen_string_literal: true

class Note < ApplicationRecord
  belongs_to :user
  belongs_to :parent, class_name: 'Note', foreign_key: :parent_note_id, optional: true, inverse_of: :children
  has_many :children, class_name: 'Note', foreign_key: :parent_note_id, dependent: :destroy, inverse_of: :parent
  has_many_attached :attachments

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
  validate :validate_attachments
  validate :parent_must_not_have_parent
  validate :parent_must_belong_to_same_user

  before_save :clear_favorite_on_archive

  # Returns the effective status considering parent inheritance
  # - If self is archived, return archived (child can be independently archived)
  # - If parent exists, inherit parent's effective_status
  # - Otherwise, return own status
  def effective_status
    return 'archived' if archived?
    return parent.effective_status if parent.present?

    status
  end

  def self.image_type?(content_type)
    ALLOWED_IMAGE_TYPES.include?(content_type)
  end

  private

  def parent_must_not_have_parent
    return unless parent.present? && parent.parent_note_id.present?

    errors.add(:parent_note_id, 'cannot create grandchild notes (max depth is 2)')
  end

  def parent_must_belong_to_same_user
    return unless parent.present? && parent.user_id != user_id

    errors.add(:parent_note_id, 'must belong to the same user')
  end

  def validate_attachments
    return unless attachments.attached?

    attachments.each do |attachment|
      unless ALLOWED_FILE_TYPES.include?(attachment.content_type)
        errors.add(:attachments, "has unsupported file type: #{attachment.content_type}")
      end

      if attachment.blob.byte_size > MAX_FILE_SIZE
        errors.add(:attachments, "must be less than #{MAX_FILE_SIZE / 1.megabyte}MB")
      end
    end
  end

  def clear_favorite_on_archive
    self.favorited_at = nil if status_changed? && archived?
  end

  # Full-text search using pg_bigm
  # Searches title and body with ILIKE for case-insensitive matching
  scope :search, ->(query) {
    return all if query.blank?

    sanitized = "%#{sanitize_sql_like(query)}%"
    where('title ILIKE :q OR body ILIKE :q', q: sanitized)
  }
end
