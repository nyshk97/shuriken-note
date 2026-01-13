# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'Current User API', type: :request do
  path '/me' do
    get 'Get current user' do
      tags 'User'
      description 'Returns the currently authenticated user information'
      produces 'application/json'
      security [ bearer_auth: [] ]

      response '200', 'current user returned' do
        schema type: :object,
          properties: {
            id: { type: :integer },
            email: { type: :string },
            created_at: { type: :string, format: 'date-time' }
          },
          required: %w[id email created_at]

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{JwtService.encode_access_token(user_id: user.id)}" }

        run_test!
      end

      response '401', 'unauthorized' do
        schema type: :object,
          properties: {
            error: { type: :string, example: 'unauthorized' }
          },
          required: %w[error]

        let(:Authorization) { 'Bearer invalid_token' }

        run_test!
      end
    end
  end
end
