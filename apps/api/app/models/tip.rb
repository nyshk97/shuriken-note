# frozen_string_literal: true

class Tip < ApplicationRecord
  belongs_to :note

  enum :status, { pending: 'pending', completed: 'completed', failed: 'failed' }, default: :pending

  validates :amount, presence: true,
                     numericality: { only_integer: true, greater_than_or_equal_to: 100, less_than_or_equal_to: 10_000 }
  validates :currency, presence: true, inclusion: { in: %w[jpy] }
  validates :stripe_session_id, presence: true, uniqueness: true
  validates :message, length: { maximum: 500 }
  validates :tipper_name, length: { maximum: 100 }
end
