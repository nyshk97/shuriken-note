# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Webhooks::Stripe', type: :request do
  let(:user) { create(:user) }
  let(:article) { create(:note, :public_listed, user: user) }
  let(:tip) { create(:tip, note: article, stripe_session_id: 'cs_test_webhook_123') }
  let(:webhook_secret) { 'whsec_test_secret' }

  before do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with('STRIPE_WEBHOOK_SECRET').and_return(webhook_secret)
  end

  describe 'POST /webhooks/stripe' do
    context 'with valid checkout.session.completed event' do
      let(:event_payload) do
        {
          id: 'evt_test_123',
          type: 'checkout.session.completed',
          data: {
            object: {
              id: tip.stripe_session_id,
              payment_intent: 'pi_test_456'
            }
          }
        }
      end

      before do
        allow(Stripe::Webhook).to receive(:construct_event).and_return(
          Stripe::Event.construct_from(event_payload)
        )
        allow_any_instance_of(SlackNotifyService).to receive(:call)
      end

      it 'updates tip to completed' do
        post '/webhooks/stripe', params: event_payload.to_json, headers: {
          'Content-Type' => 'application/json',
          'HTTP_STRIPE_SIGNATURE' => 'valid_sig'
        }

        expect(response).to have_http_status(:ok)
        expect(tip.reload).to have_attributes(
          status: 'completed',
          stripe_payment_intent_id: 'pi_test_456'
        )
      end

      it 'sends Slack notification' do
        expect_any_instance_of(SlackNotifyService).to receive(:call)

        post '/webhooks/stripe', params: event_payload.to_json, headers: {
          'Content-Type' => 'application/json',
          'HTTP_STRIPE_SIGNATURE' => 'valid_sig'
        }
      end
    end

    context 'with invalid signature' do
      before do
        allow(Stripe::Webhook).to receive(:construct_event).and_raise(
          Stripe::SignatureVerificationError.new('Invalid signature', 'sig')
        )
      end

      it 'returns bad request' do
        post '/webhooks/stripe', params: '{}', headers: {
          'Content-Type' => 'application/json',
          'HTTP_STRIPE_SIGNATURE' => 'invalid_sig'
        }

        expect(response).to have_http_status(:bad_request)
        data = JSON.parse(response.body)
        expect(data['error']['code']).to eq('invalid_webhook')
      end
    end

    context 'with unknown tip session' do
      let(:event_payload) do
        {
          id: 'evt_test_unknown',
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_nonexistent',
              payment_intent: 'pi_test_789'
            }
          }
        }
      end

      before do
        allow(Stripe::Webhook).to receive(:construct_event).and_return(
          Stripe::Event.construct_from(event_payload)
        )
      end

      it 'returns ok without updating any record' do
        post '/webhooks/stripe', params: event_payload.to_json, headers: {
          'Content-Type' => 'application/json',
          'HTTP_STRIPE_SIGNATURE' => 'valid_sig'
        }

        expect(response).to have_http_status(:ok)
      end
    end
  end
end
