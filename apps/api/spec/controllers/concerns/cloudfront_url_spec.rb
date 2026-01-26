# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CloudfrontUrl do
  let(:test_class) do
    Class.new do
      include CloudfrontUrl

      # Mock url_for for testing fallback behavior
      def url_for(attachment)
        blob = attachment.respond_to?(:blob) ? attachment.blob : attachment
        "http://localhost/rails/active_storage/#{blob.key}"
      end
    end
  end

  let(:instance) { test_class.new }
  let(:blob_key) { 'abc123def456' }

  # Create mock objects that properly respond to type checks
  let(:blob) do
    double('Blob', key: blob_key).tap do |b|
      allow(b).to receive(:is_a?).with(ActiveStorage::Attachment).and_return(false)
    end
  end

  let(:attachment) do
    double('Attachment', blob: blob).tap do |a|
      allow(a).to receive(:is_a?).with(ActiveStorage::Attachment).and_return(true)
    end
  end

  describe '#cdn_url_for' do
    context 'when CLOUDFRONT_HOST is set' do
      before do
        stub_const('ENV', ENV.to_h.merge('CLOUDFRONT_HOST' => 'd123456.cloudfront.net'))
      end

      it 'returns CloudFront URL for an attachment' do
        url = instance.cdn_url_for(attachment)
        expect(url).to eq("https://d123456.cloudfront.net/#{blob_key}")
      end

      it 'returns CloudFront URL for a blob' do
        url = instance.cdn_url_for(blob)
        expect(url).to eq("https://d123456.cloudfront.net/#{blob_key}")
      end
    end

    context 'when CLOUDFRONT_HOST is not set' do
      before do
        stub_const('ENV', ENV.to_h.except('CLOUDFRONT_HOST'))
      end

      it 'falls back to Rails URL helper' do
        url = instance.cdn_url_for(attachment)
        expect(url).to include('localhost')
        expect(url).to include(blob_key)
      end
    end

    context 'with nil attachment' do
      it 'returns nil' do
        expect(instance.cdn_url_for(nil)).to be_nil
      end
    end

    context 'with blank attachment' do
      it 'returns nil for empty string' do
        expect(instance.cdn_url_for('')).to be_nil
      end
    end
  end
end
