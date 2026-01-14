# frozen_string_literal: true

class NotesController < ApplicationController
  before_action :authenticate!

  ALLOWED_SORT_FIELDS = %w[created_at updated_at].freeze
  DEFAULT_SORT = '-created_at'

  # GET /notes
  def index
    notes = current_user.notes.order(sort_order)
    render json: { notes: notes.map { |note| note_response(note) } }
  end

  # GET /notes/:id
  def show
    note = current_user.notes.find(params[:id])
    render json: { note: note_response(note) }
  end

  # POST /notes
  def create
    note = current_user.notes.build(note_params)

    if note.save
      render json: { note: note_response(note) }, status: :created
    else
      render_validation_error(note)
    end
  end

  # PATCH /notes/:id
  def update
    note = current_user.notes.find(params[:id])

    if note.update(note_params)
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

  private

  def note_params
    params.require(:note).permit(:title, :body, :status)
  end

  def note_response(note)
    {
      id: note.id,
      title: note.title,
      body: note.body,
      slug: note.slug,
      status: note.status,
      created_at: note.created_at,
      updated_at: note.updated_at
    }
  end

  def sort_order
    sort_param = params[:sort].presence || DEFAULT_SORT
    direction = sort_param.start_with?('-') ? :desc : :asc
    field = sort_param.delete_prefix('-')

    return { created_at: :desc } unless ALLOWED_SORT_FIELDS.include?(field)

    { field => direction }
  end

  def render_validation_error(record)
    details = record.errors.map do |error|
      {
        field: error.attribute.to_s,
        code: error.type.to_s,
        message: error.full_message
      }
    end

    render json: {
      error: {
        code: 'validation_failed',
        message: 'Validation failed',
        details: details
      },
      request_id: request.request_id
    }, status: :unprocessable_entity
  end
end
