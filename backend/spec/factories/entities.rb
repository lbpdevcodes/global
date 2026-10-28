FactoryBot.define do
  factory :entity do
    sequence(:code, "AAA")
    name { "Testland" }
    kind { "sovereign" }

    factory :territory do
      kind { "territory" }
      parent factory: :entity
    end
  end
end
