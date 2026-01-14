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
  resources :notes, only: %i[index show create update destroy]
end
