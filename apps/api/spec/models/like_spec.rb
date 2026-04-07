# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Like, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:note).counter_cache(true) }
  end

  describe 'validations' do
    subject { build(:like, ip_address: 'fe80::1') }

    it { is_expected.to validate_presence_of(:ip_address) }
    it { is_expected.to validate_uniqueness_of(:ip_address).scoped_to(:note_id) }
  end

  describe 'counter cache' do
    it 'increments likes_count on the note when created' do
      note = create(:note, :public_listed)
      expect { create(:like, note: note) }.to change { note.reload.likes_count }.from(0).to(1)
    end

    it 'decrements likes_count on the note when destroyed' do
      note = create(:note, :public_listed)
      like = create(:like, note: note)
      expect { like.destroy }.to change { note.reload.likes_count }.from(1).to(0)
    end
  end
end
