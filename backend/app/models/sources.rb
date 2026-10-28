# Every source the daily refresh runs, keyed as in config/sources.yml.
module Sources
  def self.all
    {"rest_countries" => RestCountries.new}
  end
end
