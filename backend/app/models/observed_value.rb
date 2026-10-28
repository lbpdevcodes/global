# One value a source reported for one entity field, before it is recorded.
ObservedValue = Data.define(:entity_code, :field_key, :value, :source_key, :source_url, :period) do
  def fingerprint
    Digest::SHA256.hexdigest([value, source_url, period].to_json)
  end
end
