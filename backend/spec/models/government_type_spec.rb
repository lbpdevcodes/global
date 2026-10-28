require "rails_helper"

RSpec.describe GovernmentType do
  def classify(labels) = GovernmentType.classify(labels.split("|"))

  {
    "republic|presidential system|democratic republic|federal republic|constitutional republic" => "Presidential republic",
    "republic|one-party state|unitary state|democratic centralism|communist dictatorship|parliamentary republic" => "One-party state",
    "monarchy|absolute monarchy|islamic theocracy" => "Absolute monarchy",
    "semi-presidential system|unitary state|decentralization" => "Semi-presidential republic",
    "constitutional monarchy|unitary state|hereditary monarchy" => "Constitutional monarchy",
    "constitutional monarchy|theocracy|papacy" => "Theocracy",
    "presidential system|unitary state|islamic theocracy|Islamic Republic" => "Theocracy",
    "directorial system|federal republic" => "Directorial republic",
    "parliamentary republic|people's republic" => "Parliamentary republic",
    "Islamic Republic|federal parliamentary republic" => "Parliamentary republic",
    "parliamentary coprincipality|diarchy" => "Constitutional monarchy",
    "republic|unitary state" => "Republic"
  }.each do |labels, expected|
    it "classifies #{labels.tr("|", ", ")} as #{expected}" do
      expect(classify(labels)).to eq(expected)
    end
  end

  it "leaves a combination it cannot place unclassified rather than guessing" do
    expect(classify("unitary state|decentralization")).to be_nil
  end
end
