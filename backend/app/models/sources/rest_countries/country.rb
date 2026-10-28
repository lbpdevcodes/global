module Sources
  class RestCountries
    # One country row from REST Countries v5, translated to our field keys.
    class Country
      CODES = {"UNK" => "XKX"}

      def initialize(data)
        @data = data
      end

      def code
        raw = data.dig("codes", "alpha_3")
        CODES.fetch(raw, raw) if raw.present?
      end

      def facts
        {"header.name" => names["common"], "header.officialName" => names["official"],
         "header.capital" => capital, "header.flagEmoji" => data.dig("flag", "emoji"),
         "header.iso2" => data.dig("codes", "alpha_2"), "header.iso3" => data.dig("codes", "alpha_3"),
         "people.officialLanguages" => data["languages"]&.pluck("name"),
         "index.aliases" => names["alternates"], "index.centroid" => data["coordinates"]&.slice("lat", "lng"),
         "territory.status" => data.dig("classification", "dependency_type").presence}
      end

      private

      attr_reader :data

      def names
        data.fetch("names", {})
      end

      def capital
        capitals = data.fetch("capitals", [])
        return capitals.first&.fetch("name") if capitals.size < 2

        capitals.map { |capital| labelled_capital(capital) }.join(", ")
      end

      def labelled_capital(capital)
        roles = capital.fetch("attributes", {}).select { |_, held| held }.keys
        roles.empty? ? capital["name"] : "#{capital["name"]} (#{roles.join(", ")})"
      end
    end
  end
end
