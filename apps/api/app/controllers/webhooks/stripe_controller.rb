# frozen_string_literal: true

module Webhooks
  class StripeController < ApplicationController
    def create
      payload = request.body.read
      sig_header = request.env['HTTP_STRIPE_SIGNATURE']

      begin
        event = Stripe::Webhook.construct_event(payload, sig_header, stripe_webhook_secret)
      rescue JSON::ParserError, Stripe::SignatureVerificationError
        render_error(code: 'invalid_webhook', message: 'Invalid webhook signature', status: :bad_request)
        return
      end

      case event.type
      when 'checkout.session.completed'
        handle_checkout_completed(event.data.object)
      end

      head :ok
    end

    private

    def handle_checkout_completed(session)
      tip = Tip.find_by(stripe_session_id: session.id)
      return unless tip

      tip.update!(
        status: :completed,
        stripe_payment_intent_id: session.payment_intent
      )

      SlackNotifyService.new(tip).call
    end

    def stripe_webhook_secret
      Rails.application.credentials.dig(:stripe, :webhook_secret) || ENV.fetch('STRIPE_WEBHOOK_SECRET')
    end
  end
end
