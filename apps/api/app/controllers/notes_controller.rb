# frozen_string_literal: true

class NotesController < ApplicationController
  include CloudfrontUrl

  before_action :authenticate!

  ALLOWED_SORT_FIELDS = %w[created_at updated_at].freeze
  DEFAULT_SORT = '-created_at'

  # GET /notes
  def index
    notes = current_user.notes.with_attached_attachments.search(params[:q]).order(sort_order)
    render json: { notes: notes.map { |note| note_response(note) } }
  end

  # GET /notes/:id
  def show
    note = current_user.notes.with_attached_attachments.find(params[:id])
    render json: { note: note_response(note) }
  end

  # POST /notes
  def create
    note = current_user.notes.build(note_attributes)
    attach_files(note)

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
    attach_files(note)

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

  # DELETE /notes/:note_id/attachments/:signed_id
  def detach_attachment
    note = current_user.notes.find(params[:note_id])
    attachment = note.attachments.find { |att| att.signed_id == params[:signed_id] }

    if attachment
      attachment.purge
      head :no_content
    else
      render_error(code: 'not_found', message: 'Attachment not found', status: :not_found)
    end
  end

  private

  def note_params
    params.fetch(:note, {}).permit(:title, :body, :status, :parent_note_id, :favorited_at, attachment_ids: [])
  end

  def note_attributes
    note_params.except(:attachment_ids)
  end

  def attach_files(note)
    attachment_ids = note_params[:attachment_ids]
    return if attachment_ids.blank?

    # attachment_ids are blob signed_ids from Direct Upload
    note.attachments.attach(attachment_ids)
  end

  def note_response(note)
    {
      id: note.id,
      title: note.title,
      body: note.body,
      status: note.status,
      effective_status: note.effective_status,
      parent_note_id: note.parent_note_id,
      favorited_at: note.favorited_at,
      attachments: note.attachments.map { |attachment| attachment_response(attachment) },
      created_at: note.created_at,
      updated_at: note.updated_at
    }
  end

  def attachment_response(attachment)
    {
      id: attachment.id,
      signed_id: attachment.signed_id,
      filename: attachment.filename.to_s,
      content_type: attachment.content_type,
      byte_size: attachment.byte_size,
      url: cdn_url_for(attachment)
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
