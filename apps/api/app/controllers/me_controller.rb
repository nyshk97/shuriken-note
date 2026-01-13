class MeController < ApplicationController
  before_action :authenticate!

  # GET /me
  def show
    render json: {
      id: current_user.id,
      email: current_user.email,
      created_at: current_user.created_at
    }
  end
end
