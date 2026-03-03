# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'Articles API', type: :request do
  let(:user) { create(:user) }

  path '/articles' do
    get 'List public articles' do
      tags 'Articles'
      description 'Returns paginated list of publicly listed articles. No authentication required.'
      produces 'application/json'

      parameter name: :page, in: :query, type: :integer, required: false, description: 'Page number (default: 1)'
      parameter name: :per_page, in: :query, type: :integer, required: false, description: 'Items per page (default: 20, max: 100)'

      response '200', 'articles returned' do
        schema type: :object,
          properties: {
            articles: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  id: { type: :string, format: :uuid },
                  title: { type: :string },
                  excerpt: { type: :string },
                  created_at: { type: :string, format: 'date-time' },
                  updated_at: { type: :string, format: 'date-time' }
                },
                required: %w[id title excerpt created_at updated_at]
              }
            },
            meta: {
              type: :object,
              properties: {
                current_page: { type: :integer },
                total_pages: { type: :integer },
                total_count: { type: :integer },
                per_page: { type: :integer }
              },
              required: %w[current_page total_pages total_count per_page]
            }
          },
          required: %w[articles meta]

        before do
          create_list(:note, 3, :public_listed, user: user)
        end

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['articles'].length).to eq(3)
          expect(data['meta']['total_count']).to eq(3)
        end
      end

      response '200', 'excludes non-public notes' do
        schema type: :object,
          properties: {
            articles: { type: :array },
            meta: { type: :object }
          }

        before do
          create(:note, :public_listed, user: user, title: 'Public Article')
          create(:note, user: user, title: 'Personal Note')
          create(:note, :unlisted, user: user, title: 'Unlisted Note')
          create(:note, :public_listed, :archived, user: user, title: 'Archived Public')
        end

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['articles'].length).to eq(1)
          expect(data['articles'][0]['title']).to eq('Public Article')
        end
      end

      response '200', 'returns empty list when no public articles exist' do
        schema type: :object,
          properties: {
            articles: { type: :array },
            meta: { type: :object }
          }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['articles']).to be_empty
          expect(data['meta']['total_count']).to eq(0)
        end
      end
    end
  end

  path '/articles/{id}' do
    parameter name: :id, in: :path, type: :string, format: :uuid, description: 'Article ID'

    get 'Get a public article' do
      tags 'Articles'
      description 'Returns a single publicly listed article. No authentication required.'
      produces 'application/json'

      response '200', 'article returned' do
        schema type: :object,
          properties: {
            article: {
              type: :object,
              properties: {
                id: { type: :string, format: :uuid },
                title: { type: :string },
                body: { type: :string },
                created_at: { type: :string, format: 'date-time' },
                updated_at: { type: :string, format: 'date-time' }
              },
              required: %w[id title body created_at updated_at]
            }
          },
          required: %w[article]

        let(:article) { create(:note, :public_listed, user: user, title: 'My Article', body: '# Hello World') }
        let(:id) { article.id }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['article']['title']).to eq('My Article')
          expect(data['article']['body']).to eq('# Hello World')
          expect(data['article']).not_to have_key('user_id')
        end
      end

      response '404', 'personal note returns not found' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:personal_note) { create(:note, user: user) }
        let(:id) { personal_note.id }

        run_test!
      end

      response '404', 'unlisted note returns not found' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:unlisted_note) { create(:note, :unlisted, user: user) }
        let(:id) { unlisted_note.id }

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
