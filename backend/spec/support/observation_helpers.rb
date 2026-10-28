module ObservationHelpers
  def observe(entity, field_key, value, at: Time.zone.parse("2026-10-27 06:00"), period: nil,
    source_key: "rest_countries", source_url: "https://restcountries.com/")
    observed = ObservedValue.new(entity_code: entity.code, field_key: field_key, value: value,
      source_key: source_key, source_url: source_url, period: period)
    Observations::Recorder.new.record(entity, observed, at: at)
  end

  def contract_errors(schema, document)
    JSONSchemer.schema(Rails.root.join("../contracts/v1/#{schema}.schema.json"))
      .validate(document.as_json).map { "#{it["data_pointer"]} #{it["type"]}" }
  end
end

RSpec.configure { it.include ObservationHelpers }
