# Maps Wikidata "basic form of government" (P122) labels to a short neutral
# vocabulary for the panel and the government-type layer (docs/adr/0006).
# Rules apply in order, so the most specific system wins: a state described
# as both "one-party state" and "parliamentary republic" is a one-party
# state. Editor labels such as "communist dictatorship" are never shown.
module GovernmentType
  RULES = [
    ["Absolute monarchy", ["absolute monarchy"]],
    ["One-party state", ["one-party state", "communist dictatorship", "democratic centralism"]],
    ["Military government", ["military junta", "military dictatorship"]],
    ["Theocracy", ["theocracy", "islamic theocracy", "papacy"]],
    ["Provisional government", ["provisional government", "transitional government"]],
    ["Constitutional monarchy", ["constitutional monarchy", "parliamentary monarchy", "federal monarchy",
      "federal parliamentary monarchy", "parliamentary coprincipality"]],
    ["Semi-presidential republic", ["semi-presidential system", "parliamentary-presidential republic"]],
    ["Presidential republic", ["presidential system", "super-presidential republic"]],
    ["Parliamentary republic", ["parliamentary republic", "federal parliamentary republic", "parliamentary system",
      "Westminster system", "parliamentary democracy"]],
    ["Directorial republic", ["directorial system"]],
    ["Monarchy", ["monarchy", "hereditary monarchy", "elective monarchy", "Emirate"]],
    ["Republic", ["republic", "federal republic", "constitutional republic", "democratic republic", "people's republic",
      "Islamic Republic"]]
  ]

  def self.classify(labels)
    RULES.find { |_, matches| labels.intersect?(matches) }&.first
  end
end
