# frozen_string_literal: true

class ArticleLikesController < ApplicationController
  # POST /articles/:article_id/like
  def create
    article = Note.where(visibility: :public).active.find(params[:id])

    like = article.likes.new(ip_address: request.remote_ip)

    if like.save
      render json: { likes_count: article.reload.likes_count }, status: :created
    else
      render json: { likes_count: article.likes_count }, status: :ok
    end
  end
end
