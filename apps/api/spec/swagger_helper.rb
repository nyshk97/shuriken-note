# frozen_string_literal: true

require 'rails_helper'

RSpec.configure do |config|
  # Specify a root folder where Swagger JSON files are generated
  # NOTE: If you're using the rswag-api to serve API descriptions, you'll need
  # to ensure that it's configured to serve Swagger from the same folder
  config.openapi_root = Rails.root.join('swagger').to_s

  # Define one or more Swagger documents and provide global metadata for each one
  # When you run the 'rswag:specs:swaggerize' rake task, the complete Swagger will
  # be generated at the provided relative path under openapi_root
  config.openapi_specs = {
    'swagger.yaml' => {
      openapi: '3.0.1',
      info: {
        title: 'Shuriken Note API',
        version: 'v1',
        description: 'API documentation for Shuriken Note'
      },
      paths: {},
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          bearer_auth: {
            type: :http,
            scheme: :bearer,
            bearerFormat: 'JWT'
          }
        },
        schemas: {
          error_response: {
            type: :object,
            properties: {
              error: {
                type: :object,
                properties: {
                  code: { type: :string },
                  message: { type: :string },
                  details: {
                    type: :array,
                    items: {
                      type: :object,
                      properties: {
                        field: { type: :string },
                        code: { type: :string },
                        message: { type: :string }
                      }
                    }
                  }
                },
                required: %w[code message]
              },
              request_id: { type: :string }
            },
            required: %w[error request_id]
          }
        }
      }
    }
  }

  # Specify the format of the output Swagger file when running 'rswag:specs:swaggerize'.
  config.openapi_format = :yaml
end
