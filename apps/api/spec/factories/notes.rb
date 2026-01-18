FactoryBot.define do
  factory :note do
    user
    title { Faker::Lorem.sentence(word_count: 3) }
    body { Faker::Lorem.paragraphs(number: 2).join("\n\n") }
    status { :personal }

    trait :published do
      status { :published }
    end

    trait :archived do
      status { :archived }
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
