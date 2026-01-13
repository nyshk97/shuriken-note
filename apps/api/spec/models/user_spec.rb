require 'rails_helper'

RSpec.describe User do
  describe 'validations' do
    subject { build(:user) }

    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_uniqueness_of(:email).case_insensitive }
    it { is_expected.to allow_value('user@example.com').for(:email) }
    it { is_expected.not_to allow_value('invalid-email').for(:email) }
    it { is_expected.to have_secure_password }
  end

  describe 'associations' do
    it { is_expected.to have_many(:refresh_tokens).dependent(:destroy) }
  end

  describe 'factory' do
    it 'creates a valid user' do
      user = build(:user)
      expect(user).to be_valid
    end

    it 'persists a user' do
      user = create(:user)
      expect(user).to be_persisted
    end
  end
end
