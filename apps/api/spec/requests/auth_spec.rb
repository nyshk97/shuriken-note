require 'rails_helper'

RSpec.describe 'Auth' do
  describe 'POST /auth/login' do
    let(:password) { 'password123' }
    let(:user) { create(:user, password: password) }

    context 'with valid credentials' do
      it 'returns user and tokens' do
        post '/auth/login', params: { email: user.email, password: password }

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json['user']['id']).to eq(user.id)
        expect(json['user']['email']).to eq(user.email)
        expect(json['access_token']).to be_present
        expect(json['refresh_token']).to be_present
      end

      it 'creates a refresh token record' do
        expect {
          post '/auth/login', params: { email: user.email, password: password }
        }.to change(RefreshToken, :count).by(1)
      end

      it 'handles case-insensitive email' do
        post '/auth/login', params: { email: user.email.upcase, password: password }

        expect(response).to have_http_status(:ok)
      end
    end

    context 'with invalid credentials' do
      it 'returns unauthorized for wrong password' do
        post '/auth/login', params: { email: user.email, password: 'wrongpassword' }

        expect(response).to have_http_status(:unauthorized)
        expect(response.parsed_body['error']).to eq('invalid_credentials')
      end

      it 'returns unauthorized for non-existent user' do
        post '/auth/login', params: { email: 'nonexistent@example.com', password: password }

        expect(response).to have_http_status(:unauthorized)
        expect(response.parsed_body['error']).to eq('invalid_credentials')
      end
    end
  end

  describe 'POST /auth/refresh' do
    let(:user) { create(:user) }

    context 'with valid refresh token' do
      let(:refresh_token) { create(:refresh_token, user: user) }

      it 'returns a new access token' do
        post '/auth/refresh', params: { refresh_token: refresh_token.token }

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body['access_token']).to be_present
      end
    end

    context 'with invalid refresh token' do
      it 'returns unauthorized' do
        post '/auth/refresh', params: { refresh_token: 'invalid_token' }

        expect(response).to have_http_status(:unauthorized)
        expect(response.parsed_body['error']).to eq('invalid_refresh_token')
      end
    end

    context 'with expired refresh token' do
      let(:expired_token) { create(:refresh_token, :expired, user: user) }

      it 'returns unauthorized and destroys the token' do
        post '/auth/refresh', params: { refresh_token: expired_token.token }

        expect(response).to have_http_status(:unauthorized)
        expect(response.parsed_body['error']).to eq('refresh_token_expired')
        expect(RefreshToken.find_by(id: expired_token.id)).to be_nil
      end
    end
  end

  describe 'DELETE /auth/logout' do
    let(:user) { create(:user) }
    let(:refresh_token) { create(:refresh_token, user: user) }

    it 'destroys the refresh token' do
      delete '/auth/logout', params: { refresh_token: refresh_token.token }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['message']).to eq('logged_out')
      expect(RefreshToken.find_by(id: refresh_token.id)).to be_nil
    end

    it 'returns success even with invalid token' do
      delete '/auth/logout', params: { refresh_token: 'invalid_token' }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['message']).to eq('logged_out')
    end
  end
end
