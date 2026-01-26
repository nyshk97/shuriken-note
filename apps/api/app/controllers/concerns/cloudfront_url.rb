# frozen_string_literal: true

# Generates CloudFront CDN URLs for Active Storage attachments in production.
# Falls back to Rails URL helpers in development/test environments.
#
# Usage:
#   include CloudfrontUrl
#   cdn_url_for(attachment)
#
module CloudfrontUrl
  extend ActiveSupport::Concern

  included do
    include Rails.application.routes.url_helpers
  end

  # Returns the CDN URL for an attachment when CLOUDFRONT_HOST is configured,
  # otherwise falls back to the standard Rails URL helper.
  #
  # @param attachment [ActiveStorage::Attachment, ActiveStorage::Blob] the attachment or blob
  # @return [String, nil] the URL or nil if attachment is blank
  def cdn_url_for(attachment)
    return nil if attachment.blank?

    blob = attachment.is_a?(ActiveStorage::Attachment) ? attachment.blob : attachment

    if ENV['CLOUDFRONT_HOST'].present?
      "https://#{ENV['CLOUDFRONT_HOST']}/#{blob.key}"
    else
      url_for(attachment)
    end
  end
end
