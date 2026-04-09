# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SlackNotifyService do
  let(:user) { create(:user) }
  let(:note) { create(:note, :public_listed, user: user, title: 'Test Article') }
  let(:tip) { create(:tip, :completed, :with_message, note: note, amount: 500) }

  describe '#call' do
    let(:mock_http) { instance_double(Net::HTTP) }
    let(:mock_response) { instance_double(Net::HTTPResponse, code: '200') }

    context 'when SLACK_WEBHOOK_URL is set' do
      before do
        allow(ENV).to receive(:fetch).and_call_original
        allow(ENV).to receive(:fetch).with('SLACK_WEBHOOK_URL', nil).and_return('https://hooks.slack.com/services/test')
        allow(Net::HTTP).to receive(:new).and_return(mock_http)
        allow(mock_http).to receive(:use_ssl=)
        allow(mock_http).to receive(:request).and_return(mock_response)
      end

      it 'sends a POST request to the webhook URL' do
        described_class.new(tip).call

        expect(mock_http).to have_received(:request).with(
          an_instance_of(Net::HTTP::Post)
        )
      end
    end

    context 'when SLACK_WEBHOOK_URL is not set' do
      before do
        allow(ENV).to receive(:fetch).and_call_original
        allow(ENV).to receive(:fetch).with('SLACK_WEBHOOK_URL', nil).and_return(nil)
      end

      it 'does nothing' do
        expect(Net::HTTP).not_to receive(:new)
        described_class.new(tip).call
      end
    end

    context 'when the request fails' do
      before do
        allow(ENV).to receive(:fetch).and_call_original
        allow(ENV).to receive(:fetch).with('SLACK_WEBHOOK_URL', nil).and_return('https://hooks.slack.com/services/test')
        allow(Net::HTTP).to receive(:new).and_raise(StandardError.new('connection failed'))
      end

      it 'logs the error and does not raise' do
        expect(Rails.logger).to receive(:error).with(/Slack notification failed/)
        expect { described_class.new(tip).call }.not_to raise_error
      end
    end
  end
end
