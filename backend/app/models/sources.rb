# Every source the daily refresh runs, keyed as in config/sources.yml.
module Sources
  def self.all
    {"rest_countries" => RestCountries.new, "world_bank" => WorldBank.new, "vdem" => VDem.new,
     "wikidata_government" => WikidataGovernment.new, "wikidata_leaders" => WikidataLeaders.new,
     "wikidata_alliances" => WikidataAlliances.new, "wikidata_elections" => WikidataElections.new,
     "ucdp" => Ucdp.new}
  end
end
