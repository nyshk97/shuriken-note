# frozen_string_literal: true

class DirectUploadsController < ApplicationController
  before_action :authenticate!

  ALLOWED_CONTENT_TYPES = Note::ALLOWED_IMAGE_TYPES
  MAX_FILE_SIZE = Note::MAX_IMAGE_SIZE

  # POST /direct_uploads
  def create
    validate_blob_params!

    blob = ActiveStorage::Blob.create_before_direct_upload!(**blob_args)

    render json: direct_upload_json(blob), status: :created
  end

  private

  def blob_params
    params.require(:blob).permit(:filename, :byte_size, :checksum, :content_type)
  end

  def blob_args
    blob_params.to_h.symbolize_keys
  end

  def validate_blob_params!
    content_type = blob_params[:content_type]
    byte_size = blob_params[:byte_size].to_i

    unless ALLOWED_CONTENT_TYPES.include?(content_type)
      raise ArgumentError, "Content type must be one of: #{ALLOWED_CONTENT_TYPES.join(', ')}"
    end

    if byte_size > MAX_FILE_SIZE
      raise ArgumentError, "File size must be less than #{MAX_FILE_SIZE / 1.megabyte}MB"
    end

    if byte_size <= 0
      raise ArgumentError, 'File size must be greater than 0'
    end
  end

  def direct_upload_json(blob)
    {
      direct_upload: {
        url: blob.service_url_for_direct_upload,
        headers: blob.service_headers_for_direct_upload
      },
      blob_signed_id: blob.signed_id,
      blob_id: blob.id
    }
  end
end
