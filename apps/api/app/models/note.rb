# frozen_string_literal: true

class Note < ApplicationRecord
  enum :status, {
    private: 'private',
    public: 'public',
    archived: 'archived'
  }, default: :private

  validates :slug, presence: true
  validates :status, presence: true
end
