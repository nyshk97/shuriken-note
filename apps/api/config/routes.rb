Rails.application.routes.draw do
  mount Rswag::Ui::Engine => '/api-docs'
  mount Rswag::Api::Engine => '/api-docs'
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get 'up' => 'rails/health#show', as: :rails_health_check

  # Authentication
  post 'auth/login', to: 'auth#login'
  post 'auth/refresh', to: 'auth#refresh'
  delete 'auth/logout', to: 'auth#logout'

  # Current user
  get 'me', to: 'me#show'

  # Notes
  resources :notes, only: %i[index show create update destroy] do
    # Detach file attachment from note
    delete 'images/:signed_id', to: 'notes#detach_image', as: :detach_image
  end

  # Direct uploads for images (authenticated)
  post 'direct_uploads', to: 'direct_uploads#create'

  # Public notes (no authentication required)
  get 'p/:id', to: 'public_notes#show', as: :public_note
end
