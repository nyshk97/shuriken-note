# frozen_string_literal: true

Stripe.api_key = Rails.application.credentials.dig(:stripe, :secret_key) || ENV.fetch('STRIPE_SECRET_KEY', nil)
