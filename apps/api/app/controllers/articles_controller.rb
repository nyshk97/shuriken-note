# frozen_string_literal: true

class ArticlesController < ApplicationController
  # No authentication required for public articles

  DEFAULT_PER_PAGE = 20
  MAX_PER_PAGE = 100

  # GET /articles
  def index
    articles = Note.where(visibility: :public).active.order(created_at: :desc)
    articles = articles.page(page).per(per_page)

    render json: {
      articles: articles.map { |note| article_summary(note) },
      meta: pagination_meta(articles)
    }
  end

  # GET /articles/:id
  def show
    article = Note.where(visibility: :public).active.find(params[:id])
    render json: { article: article_detail(article) }
  end

  private

  def article_summary(note)
    {
      id: note.id,
      title: note.title,
      excerpt: excerpt_from(note.body),
      created_at: note.created_at,
      updated_at: note.updated_at
    }
  end

  def article_detail(note)
    {
      id: note.id,
      title: note.title,
      body: note.body,
      created_at: note.created_at,
      updated_at: note.updated_at
    }
  end

  def excerpt_from(body)
    return '' if body.blank?

    body.gsub(/[#*`\[\]!>\-]/, '').squish.truncate(200)
  end

  def page
    [ (params[:page] || 1).to_i, 1 ].max
  end

  def per_page
    [ (params[:per_page] || DEFAULT_PER_PAGE).to_i, MAX_PER_PAGE ].min
  end

  def pagination_meta(collection)
    {
      current_page: collection.current_page,
      total_pages: collection.total_pages,
      total_count: collection.total_count,
      per_page: collection.limit_value
    }
  end
end
