require "view_component/test_helpers"
require "capybara/rspec"

# render_inline, plus Capybara matchers (have_css, have_text) on the result.
RSpec.configure do |config|
  config.include ViewComponent::TestHelpers, type: :component
  config.include Capybara::RSpecMatchers, type: :component
end
