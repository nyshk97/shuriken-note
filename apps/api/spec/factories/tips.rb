FactoryBot.define do
  factory :tip do
    note
    amount { 500 }
    currency { 'jpy' }
    stripe_session_id { "cs_test_#{SecureRandom.hex(16)}" }
    status { :pending }

    trait :completed do
      status { :completed }
      stripe_payment_intent_id { "pi_test_#{SecureRandom.hex(16)}" }
    end

    trait :with_message do
      tipper_name { Faker::Name.first_name }
      message { Faker::Lorem.sentence }
    end
  end
end
