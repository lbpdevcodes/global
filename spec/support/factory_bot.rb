# Call build, create, attributes_for, etc. without the FactoryBot prefix.
RSpec.configure do |config|
  config.include FactoryBot::Syntax::Methods
end
