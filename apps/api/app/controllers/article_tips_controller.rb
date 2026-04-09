# frozen_string_literal: true

class ArticleTipsController < ApplicationController
  # POST /articles/:id/tip
  def create
    article = Note.where(visibility: :public).active.find(params[:id])

    result = StripeCheckoutService.new(
      note: article,
      amount: tip_params[:amount].to_i,
      message: tip_params[:message],
      tipper_name: tip_params[:tipper_name],
      success_url: tip_params[:success_url],
      cancel_url: tip_params[:cancel_url]
    ).call

    render json: { session_url: result[:session_url] }, status: :created
  rescue Stripe::StripeError => e
    render_error(code: 'payment_error', message: e.message, status: :unprocessable_entity)
  end

  private

  def tip_params
    params.require(:tip).permit(:amount, :message, :tipper_name, :success_url, :cancel_url)
  end
end
