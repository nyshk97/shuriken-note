# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'Notes API', type: :request do
  let(:user) { create(:user) }
  let(:Authorization) { "Bearer #{JwtService.encode_access_token(user_id: user.id)}" }

  # Shared schemas
  let(:note_schema) do
    {
      type: :object,
      properties: {
        id: { type: :string, format: :uuid },
        title: { type: :string, nullable: true },
        body: { type: :string, nullable: true },
        status: { type: :string, enum: %w[personal published archived] },
        created_at: { type: :string, format: 'date-time' },
        updated_at: { type: :string, format: 'date-time' }
      },
      required: %w[id status created_at updated_at]
    }
  end

  path '/notes' do
    get 'List notes' do
      tags 'Notes'
      description 'Returns all notes for the current user with optional sorting and search'
      produces 'application/json'
      security [ bearer_auth: [] ]

      parameter name: :q, in: :query, type: :string, required: false,
                description: 'Search query to filter notes by title or body (case-insensitive)',
                example: 'meeting'
      parameter name: :sort, in: :query, type: :string, required: false,
                description: 'Sort field (created_at, updated_at). Prefix with - for descending. Default: -created_at',
                example: '-created_at'

      response '200', 'notes returned' do
        schema type: :object,
          properties: {
            notes: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  id: { type: :string, format: :uuid },
                  title: { type: :string, nullable: true },
                  body: { type: :string, nullable: true },
                  status: { type: :string, enum: %w[personal published archived] },
                  created_at: { type: :string, format: 'date-time' },
                  updated_at: { type: :string, format: 'date-time' }
                },
                required: %w[id status created_at updated_at]
              }
            }
          },
          required: %w[notes]

        before do
          create_list(:note, 3, user: user)
        end

        run_test!
      end

      response '200', 'notes sorted by created_at ascending' do
        schema type: :object,
          properties: {
            notes: { type: :array }
          }

        let(:sort) { 'created_at' }

        before do
          create_list(:note, 2, user: user)
        end

        run_test!
      end

      response '401', 'unauthorized' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:Authorization) { 'Bearer invalid_token' }

        run_test!
      end
    end

    post 'Create a note' do
      tags 'Notes'
      description 'Creates a new note for the current user'
      consumes 'application/json'
      produces 'application/json'
      security [ bearer_auth: [] ]

      parameter name: :note_params, in: :body, schema: {
        type: :object,
        properties: {
          note: {
            type: :object,
            properties: {
              title: { type: :string, example: 'My Note Title' },
              body: { type: :string, example: 'Note content here...' },
              status: { type: :string, enum: %w[personal published archived], example: 'personal' }
            }
          }
        },
        required: %w[note]
      }

      response '201', 'note created' do
        schema type: :object,
          properties: {
            note: {
              type: :object,
              properties: {
                id: { type: :string, format: :uuid },
                title: { type: :string, nullable: true },
                body: { type: :string, nullable: true },
                status: { type: :string, enum: %w[personal published archived] },
                created_at: { type: :string, format: 'date-time' },
                updated_at: { type: :string, format: 'date-time' }
              },
              required: %w[id status created_at updated_at]
            }
          },
          required: %w[note]

        let(:note_params) { { note: { title: 'Test Note', body: 'Test content', status: 'personal' } } }

        run_test!
      end

      response '201', 'note created without title' do
        schema type: :object,
          properties: {
            note: {
              type: :object,
              properties: {
                id: { type: :string, format: :uuid },
                title: { type: :string, nullable: true },
                body: { type: :string, nullable: true },
                status: { type: :string, enum: %w[personal published archived] }
              }
            }
          }

        let(:note_params) { { note: { body: 'Content only', status: 'personal' } } }

        run_test!
      end

      response '401', 'unauthorized' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:Authorization) { 'Bearer invalid_token' }
        let(:note_params) { { note: { title: 'Test' } } }

        run_test!
      end

      response '422', 'validation error - invalid status' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:note_params) { { note: { title: 'Test', status: 'invalid_status' } } }

        run_test!
      end
    end
  end

  path '/notes/{id}' do
    parameter name: :id, in: :path, type: :string, format: :uuid, description: 'Note ID'

    get 'Get a note' do
      tags 'Notes'
      description 'Returns a specific note by ID'
      produces 'application/json'
      security [ bearer_auth: [] ]

      response '200', 'note returned' do
        schema type: :object,
          properties: {
            note: {
              type: :object,
              properties: {
                id: { type: :string, format: :uuid },
                title: { type: :string, nullable: true },
                body: { type: :string, nullable: true },
                status: { type: :string, enum: %w[personal published archived] },
                created_at: { type: :string, format: 'date-time' },
                updated_at: { type: :string, format: 'date-time' }
              },
              required: %w[id status created_at updated_at]
            }
          },
          required: %w[note]

        let(:note) { create(:note, user: user) }
        let(:id) { note.id }

        run_test!
      end

      response '401', 'unauthorized' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:Authorization) { 'Bearer invalid_token' }
        let(:id) { SecureRandom.uuid }

        run_test!
      end

      response '404', 'note not found' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:id) { SecureRandom.uuid }

        run_test!
      end

      response '404', 'note belongs to another user' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:other_user) { create(:user) }
        let(:other_note) { create(:note, user: other_user) }
        let(:id) { other_note.id }

        run_test!
      end
    end

    patch 'Update a note' do
      tags 'Notes'
      description 'Updates an existing note'
      consumes 'application/json'
      produces 'application/json'
      security [ bearer_auth: [] ]

      parameter name: :note_params, in: :body, schema: {
        type: :object,
        properties: {
          note: {
            type: :object,
            properties: {
              title: { type: :string },
              body: { type: :string },
              status: { type: :string, enum: %w[personal published archived] }
            }
          }
        },
        required: %w[note]
      }

      response '200', 'note updated' do
        schema type: :object,
          properties: {
            note: {
              type: :object,
              properties: {
                id: { type: :string, format: :uuid },
                title: { type: :string, nullable: true },
                body: { type: :string, nullable: true },
                status: { type: :string, enum: %w[personal published archived] },
                created_at: { type: :string, format: 'date-time' },
                updated_at: { type: :string, format: 'date-time' }
              },
              required: %w[id status created_at updated_at]
            }
          },
          required: %w[note]

        let(:note) { create(:note, user: user, title: 'Original Title') }
        let(:id) { note.id }
        let(:note_params) { { note: { title: 'Updated Title', status: 'published' } } }

        run_test!
      end

      response '401', 'unauthorized' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:Authorization) { 'Bearer invalid_token' }
        let(:id) { SecureRandom.uuid }
        let(:note_params) { { note: { title: 'Test' } } }

        run_test!
      end

      response '404', 'note not found' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:id) { SecureRandom.uuid }
        let(:note_params) { { note: { title: 'Test' } } }

        run_test!
      end

      response '422', 'validation error' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:note) { create(:note, user: user) }
        let(:id) { note.id }
        let(:note_params) { { note: { status: 'invalid_status' } } }

        run_test!
      end
    end

    delete 'Delete a note' do
      tags 'Notes'
      description 'Deletes a note'
      security [ bearer_auth: [] ]

      response '204', 'note deleted' do
        let(:note) { create(:note, user: user) }
        let(:id) { note.id }

        run_test!
      end

      response '401', 'unauthorized' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:Authorization) { 'Bearer invalid_token' }
        let(:id) { SecureRandom.uuid }

        run_test!
      end

      response '404', 'note not found' do
        schema '$ref' => '#/components/schemas/error_response'

        let(:id) { SecureRandom.uuid }

        run_test!
      end
    end
  end
end
