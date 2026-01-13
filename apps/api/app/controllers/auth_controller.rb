class AuthController < ApplicationController
  # POST /auth/login
  def login
    user = User.find_by(email: params[:email]&.downcase)

    if user&.authenticate(params[:password])
      tokens = generate_tokens(user)
      render json: {
        user: user_response(user),
        access_token: tokens[:access_token],
        refresh_token: tokens[:refresh_token]
      }
    else
      render json: { error: 'invalid_credentials' }, status: :unauthorized
    end
  end

  # POST /auth/refresh
  def refresh
    refresh_token_record = RefreshToken.find_by(token: params[:refresh_token])

    if refresh_token_record.nil?
      render json: { error: 'invalid_refresh_token' }, status: :unauthorized
      return
    end

    if refresh_token_record.expired?
      refresh_token_record.destroy
      render json: { error: 'refresh_token_expired' }, status: :unauthorized
      return
    end

    user = refresh_token_record.user
    access_token = JwtService.encode_access_token(user_id: user.id)

    render json: {
      access_token: access_token
    }
  end

  # DELETE /auth/logout
  def logout
    refresh_token_record = RefreshToken.find_by(token: params[:refresh_token])
    refresh_token_record&.destroy

    render json: { message: 'logged_out' }
  end

  private

  def generate_tokens(user)
    access_token = JwtService.encode_access_token(user_id: user.id)
    refresh_token_value = SecureRandom.hex(32)

    user.refresh_tokens.create!(
      token: refresh_token_value,
      expires_at: 30.days.from_now
    )

    { access_token: access_token, refresh_token: refresh_token_value }
  end

  def user_response(user)
    {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    }
  end
end
