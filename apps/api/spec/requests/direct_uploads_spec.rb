# frozen_string_literal: true

require 'rails_helper'
require 'digest'

RSpec.describe 'Direct Uploads API', type: :request do
  let(:user) { create(:user) }
  let(:auth_headers) { { 'Authorization' => "Bearer #{JwtService.encode_access_token(user_id: user.id)}" } }

  describe 'POST /direct_uploads' do
    # Active Storage expects MD5 checksum in Base64 format
    let(:valid_checksum) { Digest::MD5.base64digest('fake content') }

    let(:valid_params) do
      {
        blob: {
          filename: 'test_image.jpg',
          byte_size: 1024,
          checksum: valid_checksum,
          content_type: 'image/jpeg'
        }
      }
    end

    context 'with valid parameters' do
      it 'creates a direct upload and returns signed URL' do
        post '/direct_uploads', params: valid_params, headers: auth_headers, as: :json

        expect(response).to have_http_status(:created)

        json = response.parsed_body
        expect(json['direct_upload']).to be_present
        expect(json['direct_upload']['url']).to be_present
        expect(json['direct_upload']['headers']).to be_a(Hash)
        expect(json['blob_signed_id']).to be_present
        expect(json['blob_id']).to be_present
      end

      it 'creates an ActiveStorage::Blob record' do
        expect {
          post '/direct_uploads', params: valid_params, headers: auth_headers, as: :json
        }.to change(ActiveStorage::Blob, :count).by(1)
      end
    end

    context 'with invalid content type' do
      it 'returns unprocessable entity error' do
        params = valid_params.deep_dup
        params[:blob][:content_type] = 'application/pdf'

        post '/direct_uploads', params: params, headers: auth_headers, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        json = response.parsed_body
        expect(json['error']['code']).to eq('invalid_parameter')
      end
    end

    context 'with file size exceeding limit' do
      it 'returns unprocessable entity error' do
        params = valid_params.deep_dup
        params[:blob][:byte_size] = 11 * 1024 * 1024 # 11MB

        post '/direct_uploads', params: params, headers: auth_headers, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        json = response.parsed_body
        expect(json['error']['code']).to eq('invalid_parameter')
      end
    end

    context 'with zero byte size' do
      it 'returns unprocessable entity error' do
        params = valid_params.deep_dup
        params[:blob][:byte_size] = 0

        post '/direct_uploads', params: params, headers: auth_headers, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        json = response.parsed_body
        expect(json['error']['code']).to eq('invalid_parameter')
      end
    end

    context 'without authentication' do
      it 'returns unauthorized error' do
        post '/direct_uploads', params: valid_params, as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with all allowed image types' do
      %w[image/jpeg image/png image/gif image/webp].each do |content_type|
        it "accepts #{content_type}" do
          params = valid_params.deep_dup
          params[:blob][:content_type] = content_type

          post '/direct_uploads', params: params, headers: auth_headers, as: :json

          expect(response).to have_http_status(:created)
        end
      end
    end
  end
end
