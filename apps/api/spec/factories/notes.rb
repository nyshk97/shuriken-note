FactoryBot.define do
  factory :note do
    user
    title { Faker::Lorem.sentence(word_count: 3) }
    body { Faker::Lorem.paragraphs(number: 2).join("\n\n") }
    visibility { :personal }

    trait :unlisted do
      visibility { :unlisted }
    end

    trait :published do
      visibility { :unlisted }
    end

    trait :public_listed do
      visibility { :public }
    end

    trait :archived do
      archived { true }
    end

    trait :untitled do
      title { '' }
    end

    trait :with_parent do
      association :parent, factory: :note
      user { parent.user }
    end
  end
end
