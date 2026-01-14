# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'Authentication API', type: :request do
  path '/auth/login' do
    post 'User login' do
      tags 'Authentication'
      description 'Authenticates a user and returns access and refresh tokens'
      consumes 'application/json'
      produces 'application/json'

      parameter name: :credentials, in: :body, schema: {
        type: :object,
        properties: {
          email: { type: :string, format: :email, example: 'user@example.com' },
          password: { type: :string, example: 'password123' }
        },
        required: %w[email password]
      }

      response '200', 'login successful' do
        schema type: :object,
          properties: {
            user: {
              type: :object,
              properties: {
                id: { type: :integer },
                email: { type: :string },
                created_at: { type: :string, format: 'date-time' }
              },
              required: %w[id email created_at]
            },
            access_token: { type: :string },
            refresh_token: { type: :string }
          },
          required: %w[user access_token refresh_token]

        let(:user) { create(:user, password: 'password123') }
        let(:credentials) { { email: user.email, password: 'password123' } }

        run_test!
      end

      response '401', 'invalid credentials' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:credentials) { { email: 'wrong@example.com', password: 'wrong' } }

        run_test!
      end
    end
  end

  path '/auth/refresh' do
    post 'Refresh access token' do
      tags 'Authentication'
      description 'Exchanges a valid refresh token for a new access token'
      consumes 'application/json'
      produces 'application/json'

      parameter name: :body, in: :body, schema: {
        type: :object,
        properties: {
          refresh_token: { type: :string }
        },
        required: %w[refresh_token]
      }

      response '200', 'token refreshed' do
        schema type: :object,
          properties: {
            access_token: { type: :string }
          },
          required: %w[access_token]

        let(:user) { create(:user) }
        let(:refresh_token_record) { create(:refresh_token, user: user) }
        let(:body) { { refresh_token: refresh_token_record.token } }

        run_test!
      end

      response '401', 'invalid refresh token' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:body) { { refresh_token: 'invalid_token' } }

        run_test!
      end

      response '401', 'expired refresh token' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:user) { create(:user) }
        let(:expired_token) { create(:refresh_token, :expired, user: user) }
        let(:body) { { refresh_token: expired_token.token } }

        run_test!
      end
    end
  end

  path '/auth/logout' do
    delete 'User logout' do
      tags 'Authentication'
      description 'Invalidates the refresh token'
      consumes 'application/json'
      produces 'application/json'

      parameter name: :body, in: :body, schema: {
        type: :object,
        properties: {
          refresh_token: { type: :string }
        },
        required: %w[refresh_token]
      }

      response '200', 'logged out' do
        schema type: :object,
          properties: {
            message: { type: :string, example: 'logged_out' }
          },
          required: %w[message]

        let(:user) { create(:user) }
        let(:refresh_token_record) { create(:refresh_token, user: user) }
        let(:body) { { refresh_token: refresh_token_record.token } }

        run_test!
      end
    end
  end
end
