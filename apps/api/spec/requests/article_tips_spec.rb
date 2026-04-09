# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'Article Tips API', type: :request do
  let(:user) { create(:user) }

  path '/articles/{id}/tip' do
    parameter name: :id, in: :path, type: :string, format: :uuid, description: 'Article ID'

    post 'Create a tip checkout session for a public article' do
      tags 'Articles'
      description 'Creates a Stripe Checkout session for tipping a public article.'
      consumes 'application/json'
      produces 'application/json'
      parameter name: :tip, in: :body, schema: {
        type: :object,
        properties: {
          tip: {
            type: :object,
            properties: {
              amount: { type: :integer },
              tipper_name: { type: :string },
              message: { type: :string },
              success_url: { type: :string },
              cancel_url: { type: :string }
            },
            required: %w[amount success_url cancel_url]
          }
        }
      }

      let(:article) { create(:note, :public_listed, user: user) }
      let(:id) { article.id }
      let(:fake_session) { double('Stripe::Checkout::Session', id: 'cs_test_123', url: 'https://checkout.stripe.com/test') }

      before do
        allow(Stripe::Checkout::Session).to receive(:create).and_return(fake_session)
      end

      response '201', 'tip session created' do
        schema type: :object,
          properties: {
            session_url: { type: :string }
          },
          required: %w[session_url]

        let(:tip) do
          {
            tip: {
              amount: 500,
              tipper_name: 'Alice',
              message: 'Great article!',
              success_url: 'https://example.com/success',
              cancel_url: 'https://example.com/cancel'
            }
          }
        end

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['session_url']).to eq('https://checkout.stripe.com/test')
          expect(Tip.last).to have_attributes(
            amount: 500,
            tipper_name: 'Alice',
            message: 'Great article!',
            status: 'pending'
          )
        end
      end

      response '404', 'personal note returns not found' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:personal_note) { create(:note, user: user) }
        let(:id) { personal_note.id }
        let(:tip) do
          {
            tip: {
              amount: 500,
              success_url: 'https://example.com/success',
              cancel_url: 'https://example.com/cancel'
            }
          }
        end

        run_test!
      end

      response '404', 'archived public note returns not found' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:archived_article) { create(:note, :public_listed, :archived, user: user) }
        let(:id) { archived_article.id }
        let(:tip) do
          {
            tip: {
              amount: 500,
              success_url: 'https://example.com/success',
              cancel_url: 'https://example.com/cancel'
            }
          }
        end

        run_test!
      end

      response '404', 'non-existent note returns not found' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:id) { SecureRandom.uuid }
        let(:tip) do
          {
            tip: {
              amount: 500,
              success_url: 'https://example.com/success',
              cancel_url: 'https://example.com/cancel'
            }
          }
        end

        run_test!
      end
    end
  end
end
