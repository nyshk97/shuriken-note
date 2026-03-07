# frozen_string_literal: true

class OgpController < ApplicationController
  def show
    url = params.require(:url)

    cache_key = "ogp:#{Digest::SHA256.hexdigest(url)}"
    data = Rails.cache.fetch(cache_key, expires_in: 24.hours) do
      OgpFetcher.new(url:).call.to_h
    end

    render json: { ogp: data }
  rescue ActionController::ParameterMissing
    raise
  rescue ArgumentError => e
    render_error(code: 'invalid_url', message: e.message, status: :bad_request)
  rescue StandardError
    render_error(code: 'fetch_failed', message: 'Failed to fetch OGP data', status: :unprocessable_entity)
  end
end
