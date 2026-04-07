# frozen_string_literal: true

class Like < ApplicationRecord
  belongs_to :note, counter_cache: true

  validates :ip_address, presence: true
  validates :ip_address, uniqueness: { scope: :note_id }
end
