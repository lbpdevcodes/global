require "webmock/rspec"

# Specs read recorded source responses; they never reach the network.
WebMock.disable_net_connect!
