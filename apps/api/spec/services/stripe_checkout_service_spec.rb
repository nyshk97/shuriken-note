# frozen_string_literal: true

require 'rails_helper'

RSpec.describe StripeCheckoutService do
  let(:user) { create(:user) }
  let(:note) { create(:note, :public_listed, user: user, title: 'Test Article') }
  let(:fake_session) { double('Stripe::Checkout::Session', id: 'cs_test_abc', url: 'https://checkout.stripe.com/test') }

  before do
    allow(Stripe::Checkout::Session).to receive(:create).and_return(fake_session)
  end

  describe '#call' do
    subject do
      described_class.new(
        note: note,
        amount: 500,
        message: 'Great work!',
        tipper_name: 'Alice',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel'
      ).call
    end

    it 'creates a Stripe Checkout session with correct parameters' do
      subject

      expect(Stripe::Checkout::Session).to have_received(:create).with(
        hash_including(
          payment_method_types: [ 'card' ],
          mode: 'payment',
          success_url: 'https://example.com/success',
          cancel_url: 'https://example.com/cancel'
        )
      )
    end

    it 'creates a pending Tip record' do
      expect { subject }.to change(Tip, :count).by(1)

      tip = Tip.last
      expect(tip).to have_attributes(
        note_id: note.id,
        amount: 500,
        message: 'Great work!',
        tipper_name: 'Alice',
        stripe_session_id: 'cs_test_abc',
        status: 'pending'
      )
    end

    it 'returns session URL and tip ID' do
      result = subject
      expect(result[:session_url]).to eq('https://checkout.stripe.com/test')
      expect(result[:tip_id]).to eq(Tip.last.id)
    end
  end
end
