module Authenticatable
  extend ActiveSupport::Concern

  private

  def current_user
    return @current_user if defined?(@current_user)

    @current_user = authenticate_from_token
  end

  def authenticate!
    render_unauthorized unless current_user
  end

  def authenticate_from_token
    token = extract_token_from_header
    return nil unless token

    payload = JwtService.decode(token)
    return nil unless payload["type"] == "access"

    User.find_by(id: payload["user_id"])
  rescue JwtService::TokenExpiredError
    nil
  rescue JwtService::InvalidTokenError
    nil
  end

  def extract_token_from_header
    header = request.headers["Authorization"]
    return nil unless header&.start_with?("Bearer ")

    header.split(" ").last
  end

  def render_unauthorized
    render json: { error: "unauthorized" }, status: :unauthorized
  end
end
