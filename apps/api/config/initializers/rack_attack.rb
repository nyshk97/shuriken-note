# frozen_string_literal: true

Rack::Attack.throttle('likes/ip', limit: 30, period: 1.hour) do |req|
  req.ip if req.path.match?(%r{/articles/.+/like}) && req.post?
end

Rack::Attack.throttle('tips/ip', limit: 10, period: 1.hour) do |req|
  req.ip if req.path.match?(%r{/articles/.+/tip}) && req.post?
end
