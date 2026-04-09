# frozen_string_literal: true

class SlackNotifyService
  def initialize(tip)
    @tip = tip
  end

  def call
    return unless webhook_url.present?

    fields = [
      { title: 'Amount', value: format_amount, short: true },
      { title: 'Article', value: @tip.note.title.presence || 'Untitled', short: true }
    ]
    fields << { title: 'From', value: @tip.tipper_name, short: true } if @tip.tipper_name.present?
    fields << { title: 'Message', value: @tip.message, short: false } if @tip.message.present?

    payload = {
      attachments: [ {
        color: '#00b894',
        pretext: 'New Tip Received!',
        fields: fields,
        ts: @tip.created_at.to_i
      } ]
    }

    uri = URI.parse(webhook_url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Post.new(uri.path)
    request['Content-Type'] = 'application/json'
    request.body = payload.to_json

    http.request(request)
  rescue StandardError => e
    Rails.logger.error("Slack notification failed: #{e.message}")
  end

  private

  def webhook_url
    ENV.fetch('SLACK_WEBHOOK_URL', nil)
  end

  def format_amount
    "¥#{ActiveSupport::NumberHelper.number_to_delimited(@tip.amount)}"
  end
end
