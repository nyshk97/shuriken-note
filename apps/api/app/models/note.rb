# frozen_string_literal: true

class Note < ApplicationRecord
  belongs_to :user

  enum :status, {
    personal: 'personal',
    published: 'published',
    archived: 'archived'
  }, default: :personal

  validates :slug, presence: true
  validates :status, presence: true

  before_validation :generate_slug, on: :create

  private

  def generate_slug
    return if slug.present?

    self.slug = if title.present?
                  parameterized = title.parameterize
                  parameterized.presence || SecureRandom.alphanumeric(12)
    else
                  SecureRandom.alphanumeric(12)
    end
  end
end
