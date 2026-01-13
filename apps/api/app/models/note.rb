# frozen_string_literal: true

class Note < ApplicationRecord
  enum :status, {
    personal: 'personal',
    published: 'published',
    archived: 'archived'
  }, default: :personal

  validates :slug, presence: true
  validates :status, presence: true
end
