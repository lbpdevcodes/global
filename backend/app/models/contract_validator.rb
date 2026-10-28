# Checks a snapshot file against its schema in contracts/v1.
class ContractValidator
  class Invalid < StandardError; end

  CONTRACTS = Rails.root.join("../contracts/v1")

  def validate!(path, document)
    errors = schema_for(path).validate(document.as_json).first(3)
    return if errors.empty?

    raise Invalid, errors.map { "#{path}: #{it["data_pointer"].presence || "/"} #{it["error"]}" }.join("; ")
  end

  private

  def schema_for(path)
    name = path.start_with?("countries/") ? "country" : File.basename(path, ".json")
    (@schemas ||= {})[name] ||= JSONSchemer.schema(CONTRACTS.join("#{name}.schema.json"))
  end
end
