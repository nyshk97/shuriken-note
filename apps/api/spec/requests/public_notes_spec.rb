# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'Public Notes API', type: :request do
  let(:user) { create(:user) }

  path '/p/{id}' do
    parameter name: :id, in: :path, type: :string, format: :uuid, description: 'Note ID'

    get 'Get a published note' do
      tags 'Public Notes'
      description 'Returns a non-personal, non-archived note by ID. No authentication required.'
      produces 'application/json'

      response '200', 'unlisted note returned' do
        schema type: :object,
          properties: {
            note: {
              type: :object,
              properties: {
                id: { type: :string, format: :uuid },
                title: { type: :string, nullable: true },
                body: { type: :string, nullable: true },
                visibility: { type: :string, enum: %w[unlisted public] },
                created_at: { type: :string, format: 'date-time' },
                updated_at: { type: :string, format: 'date-time' }
              },
              required: %w[id visibility created_at updated_at]
            }
          },
          required: %w[note]

        let(:unlisted_note) { create(:note, user: user, visibility: :unlisted, title: 'Public Note', body: 'This is public') }
        let(:id) { unlisted_note.id }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['note']['id']).to eq(unlisted_note.id)
          expect(data['note']['title']).to eq('Public Note')
          expect(data['note']['body']).to eq('This is public')
          expect(data['note']['visibility']).to eq('unlisted')
          expect(data['note']).not_to have_key('user_id')
        end
      end

      response '200', 'public note returned' do
        schema type: :object,
          properties: {
            note: {
              type: :object,
              properties: {
                id: { type: :string, format: :uuid },
                visibility: { type: :string, enum: %w[unlisted public] }
              }
            }
          }

        let(:public_note) { create(:note, user: user, visibility: :public, title: 'Blog Post') }
        let(:id) { public_note.id }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['note']['visibility']).to eq('public')
        end
      end

      response '404', 'personal note returns not found' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:personal_note) { create(:note, user: user, visibility: :personal) }
        let(:id) { personal_note.id }

        run_test!
      end

      response '404', 'archived note returns not found' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:archived_note) { create(:note, user: user, visibility: :unlisted, archived: true) }
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
