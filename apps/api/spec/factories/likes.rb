FactoryBot.define do
  factory :like do
    note
    ip_address { Faker::Internet.ip_v4_address }
  end
end
