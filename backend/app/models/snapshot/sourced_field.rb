module Snapshot
  # An observation as the contract's sourced field: value, source, asOf and,
  # when the data describes an earlier period, that period.
  module SourcedField
    def self.from(observation)
      return if observation.nil?

      {"value" => observation.value, "source" => observation.source_url,
       "asOf" => observation.last_confirmed_at.to_date.iso8601, "period" => observation.period}.compact
    end
  end
end
