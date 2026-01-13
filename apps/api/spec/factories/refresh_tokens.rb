FactoryBot.define do
  factory :refresh_token do
    user
    token { SecureRandom.hex(32) }
    expires_at { 30.days.from_now }

    trait :expired do
      expires_at { 1.day.ago }
    end
  end
end
