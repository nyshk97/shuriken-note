# frozen_string_literal: true

class StripeCheckoutService
  def initialize(note:, amount:, message: nil, tipper_name: nil, success_url:, cancel_url:)
    @note = note
    @amount = amount
    @message = message
    @tipper_name = tipper_name
    @success_url = success_url
    @cancel_url = cancel_url
  end

  def call
    session = Stripe::Checkout::Session.create(
      payment_method_types: [ 'card' ],
      line_items: [ {
        price_data: {
          currency: 'jpy',
          product_data: {
            name: "Tip for: #{@note.title.presence || 'Untitled'}"
          },
          unit_amount: @amount
        },
        quantity: 1
      } ],
      mode: 'payment',
      success_url: @success_url,
      cancel_url: @cancel_url,
      metadata: {
        note_id: @note.id,
        message: @message,
        tipper_name: @tipper_name
      }
    )

    tip = Tip.create!(
      note: @note,
      amount: @amount,
      message: @message,
      tipper_name: @tipper_name,
      stripe_session_id: session.id,
      status: :pending
    )

    { session_url: session.url, tip_id: tip.id }
  end
end
