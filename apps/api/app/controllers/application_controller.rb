class ApplicationController < ActionController::API
  include Authenticatable

  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
  rescue_from ActionController::ParameterMissing, with: :render_bad_request

  private

  def render_error(code:, message:, status:, details: nil)
    body = {
      error: {
        code: code,
        message: message
      },
      request_id: request.request_id
    }
    body[:error][:details] = details if details.present?

    render json: body, status: status
  end

  def render_not_found
    render_error(
      code: 'not_found',
      message: 'Resource not found',
      status: :not_found
    )
  end

  def render_bad_request(exception)
    render_error(
      code: 'invalid_request',
      message: exception.message,
      status: :bad_request
    )
  end

  def render_validation_error(record)
    details = record.errors.map do |error|
      {
        field: error.attribute.to_s,
        code: error.type.to_s,
        message: error.full_message
      }
    end

    render_error(
      code: 'validation_failed',
      message: 'Validation failed',
      status: :unprocessable_entity,
      details: details
    )
  end
end
