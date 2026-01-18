# frozen_string_literal: true

class NotesController < ApplicationController
  include Rails.application.routes.url_helpers

  before_action :authenticate!

  ALLOWED_SORT_FIELDS = %w[created_at updated_at].freeze
  DEFAULT_SORT = '-created_at'

  # GET /notes
  def index
    notes = current_user.notes.with_attached_images.search(params[:q]).order(sort_order)
    render json: { notes: notes.map { |note| note_response(note) } }
  end

  # GET /notes/:id
  def show
    note = current_user.notes.with_attached_images.find(params[:id])
    render json: { note: note_response(note) }
  end

  # POST /notes
  def create
    note = current_user.notes.build(note_attributes)
    attach_images(note)

    if note.save
      render json: { note: note_response(note) }, status: :created
    else
      render_validation_error(note)
    end
  end

  # PATCH /notes/:id
  def update
    note = current_user.notes.find(params[:id])
    note.assign_attributes(note_attributes)
    attach_images(note)

    if note.save
      render json: { note: note_response(note) }
    else
      render_validation_error(note)
    end
  end

  # DELETE /notes/:id
  def destroy
    note = current_user.notes.find(params[:id])
    note.destroy
    head :no_content
  end

  # DELETE /notes/:note_id/images/:signed_id
  def detach_image
    note = current_user.notes.find(params[:note_id])
    attachment = note.images.find { |img| img.signed_id == params[:signed_id] }

    if attachment
      attachment.purge
      head :no_content
    else
      render_error(code: 'not_found', message: 'Attachment not found', status: :not_found)
    end
  end

  private

  def note_params
    params.fetch(:note, {}).permit(:title, :body, :status, image_ids: [])
  end

  def note_attributes
    note_params.except(:image_ids)
  end

  def attach_images(note)
    image_ids = note_params[:image_ids]
    return if image_ids.blank?

    # image_ids are blob signed_ids from Direct Upload
    note.images.attach(image_ids)
  end

  def note_response(note)
    {
      id: note.id,
      title: note.title,
      body: note.body,
      status: note.status,
      images: note.images.map { |image| image_response(image) },
      created_at: note.created_at,
      updated_at: note.updated_at
    }
  end

  def image_response(image)
    {
      id: image.id,
      signed_id: image.signed_id,
      filename: image.filename.to_s,
      content_type: image.content_type,
      byte_size: image.byte_size,
      url: url_for(image)
    }
  end

  def sort_order
    sort_param = params[:sort].presence || DEFAULT_SORT
    direction = sort_param.start_with?('-') ? :desc : :asc
    field = sort_param.delete_prefix('-')

    return { created_at: :desc } unless ALLOWED_SORT_FIELDS.include?(field)

    { field => direction }
  end
end
