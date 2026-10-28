# travel_to, freeze_time and friends, for deterministic specs involving time.
RSpec.configure do |config|
  config.include ActiveSupport::Testing::TimeHelpers
end
