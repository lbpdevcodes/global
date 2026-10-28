# Every source the daily refresh runs, keyed as in config/sources.yml.
module Sources
  def self.all
    {"rest_countries" => RestCountries.new, "world_bank" => WorldBank.new, "vdem" => VDem.new,
     "wikidata_government" => WikidataGovernment.new}
  end
end
