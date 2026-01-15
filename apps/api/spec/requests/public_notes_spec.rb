# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'Public Notes API', type: :request do
  let(:user) { create(:user) }

  path '/p/{id}' do
    parameter name: :id, in: :path, type: :string, format: :uuid, description: 'Note ID'

    get 'Get a published note' do
      tags 'Public Notes'
      description 'Returns a published note by ID. No authentication required.'
      produces 'application/json'

      response '200', 'published note returned' do
        schema type: :object,
          properties: {
            note: {
              type: :object,
              properties: {
                id: { type: :string, format: :uuid },
                title: { type: :string, nullable: true },
                body: { type: :string, nullable: true },
                status: { type: :string, enum: %w[published] },
                created_at: { type: :string, format: 'date-time' },
                updated_at: { type: :string, format: 'date-time' }
              },
              required: %w[id status created_at updated_at]
            }
          },
          required: %w[note]

        let(:published_note) { create(:note, user: user, status: :published, title: 'Public Note', body: 'This is public') }
        let(:id) { published_note.id }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['note']['id']).to eq(published_note.id)
          expect(data['note']['title']).to eq('Public Note')
          expect(data['note']['body']).to eq('This is public')
          expect(data['note']['status']).to eq('published')
          # Ensure user_id is not exposed
          expect(data['note']).not_to have_key('user_id')
        end
      end

      response '404', 'personal note returns not found' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:personal_note) { create(:note, user: user, status: :personal) }
        let(:id) { personal_note.id }

        run_test!
      end

      response '404', 'archived note returns not found' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:archived_note) { create(:note, user: user, status: :archived) }
        let(:id) { archived_note.id }

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
