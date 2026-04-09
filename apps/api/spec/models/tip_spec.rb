# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Tip, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:note) }
  end

  describe 'validations' do
    subject { build(:tip) }

    it { is_expected.to validate_presence_of(:amount) }
    it { is_expected.to validate_numericality_of(:amount).only_integer.is_greater_than_or_equal_to(100).is_less_than_or_equal_to(10_000) }
    it { is_expected.to validate_presence_of(:currency) }
    it { is_expected.to validate_inclusion_of(:currency).in_array(%w[jpy]) }
    it { is_expected.to validate_presence_of(:stripe_session_id) }
    it { is_expected.to validate_uniqueness_of(:stripe_session_id) }
    it { is_expected.to validate_length_of(:message).is_at_most(500) }
    it { is_expected.to validate_length_of(:tipper_name).is_at_most(100) }
  end

  describe 'enum' do
    it { is_expected.to define_enum_for(:status).with_values(pending: 'pending', completed: 'completed', failed: 'failed').backed_by_column_of_type(:string) }
  end
end
