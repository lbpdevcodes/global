require "webmock/rspec"

# Fail any spec that makes a real HTTP request. Localhost stays open for
# system specs, where Selenium talks to the browser driver over 127.0.0.1.
WebMock.disable_net_connect!(allow_localhost: true)
