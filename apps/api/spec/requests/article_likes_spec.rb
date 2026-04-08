# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'Article Likes API', type: :request do
  let(:user) { create(:user) }

  path '/articles/{id}/like' do
    parameter name: :id, in: :path, type: :string, format: :uuid, description: 'Article ID'

    post 'Like a public article' do
      tags 'Articles'
      description 'Adds an anonymous like to a public article. One like per IP per article.'
      produces 'application/json'

      response '201', 'like created' do
        schema type: :object,
          properties: {
            likes_count: { type: :integer }
          },
          required: %w[likes_count]

        let(:article) { create(:note, :public_listed, user: user) }
        let(:id) { article.id }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['likes_count']).to eq(1)
          expect(article.reload.likes_count).to eq(1)
        end
      end

      response '200', 'duplicate like from same IP returns current count' do
        schema type: :object,
          properties: {
            likes_count: { type: :integer }
          },
          required: %w[likes_count]

        let(:article) { create(:note, :public_listed, user: user) }
        let(:id) { article.id }

        before do
          create(:like, note: article, ip_address: '127.0.0.1')
        end

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['likes_count']).to eq(1)
          expect(article.reload.likes_count).to eq(1)
        end
      end

      response '404', 'personal note returns not found' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:personal_note) { create(:note, user: user) }
        let(:id) { personal_note.id }

        run_test!
      end

      response '404', 'archived public note returns not found' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:archived_article) { create(:note, :public_listed, :archived, user: user) }
        let(:id) { archived_article.id }

        run_test!
      end

      response '404', 'non-existent note returns not found' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:id) { SecureRandom.uuid }

        run_test!
      end
    end
  end
end
