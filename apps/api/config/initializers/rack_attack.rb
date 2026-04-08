# frozen_string_literal: true

Rack::Attack.throttle('likes/ip', limit: 30, period: 1.hour) do |req|
  req.ip if req.path.match?(%r{/articles/.+/like}) && req.post?
end
