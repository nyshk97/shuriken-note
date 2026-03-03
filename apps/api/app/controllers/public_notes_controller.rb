# frozen_string_literal: true

class PublicNotesController < ApplicationController
  # No authentication required for public notes

  # GET /p/:id
  def show
    note = Note.not_personal.active.find(params[:id])
    render json: { note: public_note_response(note) }
  end

  private

  def public_note_response(note)
    {
      id: note.id,
      title: note.title,
      body: note.body,
      visibility: note.visibility,
      created_at: note.created_at,
      updated_at: note.updated_at
    }
  end
end
