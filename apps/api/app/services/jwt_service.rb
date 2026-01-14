class JwtService
  ALGORITHM = 'HS256'
  ACCESS_TOKEN_EXPIRY = 15.minutes
  REFRESH_TOKEN_EXPIRY = 30.days

  class << self
    def encode_access_token(user_id:)
      encode(
        payload: { user_id: user_id, type: 'access' },
        expiry: ACCESS_TOKEN_EXPIRY
      )
    end

    def encode_refresh_token(user_id:)
      encode(
        payload: { user_id: user_id, type: 'refresh' },
        expiry: REFRESH_TOKEN_EXPIRY
      )
    end

    def decode(token)
      JWT.decode(token, secret_key, true, { algorithm: ALGORITHM }).first
    rescue JWT::ExpiredSignature
      raise TokenExpiredError
    rescue JWT::DecodeError
      raise InvalidTokenError
    end

    private

    def encode(payload:, expiry:)
      payload = payload.merge(
        exp: expiry.from_now.to_i,
        iat: Time.current.to_i
      )
      JWT.encode(payload, secret_key, ALGORITHM)
    end

    # Environment variable fallback allows CI to run without master.key
    # See: docs/adr/0008-secret-management.md
    def secret_key
      ENV['JWT_SECRET_KEY'] ||
        Rails.application.credentials.dig(:jwt, :secret_key) ||
        raise('JWT secret_key is not set in credentials or JWT_SECRET_KEY environment variable')
    end
  end

  class TokenExpiredError < StandardError; end
  class InvalidTokenError < StandardError; end
end
