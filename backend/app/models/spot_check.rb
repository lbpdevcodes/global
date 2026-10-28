# Compares a random sample of profiles with Wikipedia: leaders against the
# country's infobox, the ruling party against the head of government's own
# infobox. A tool for people (the M3 acceptance check), not a daily gate.
class SpotCheck
  Result = Data.define(:entity, :article, :verdicts)
  CHECKS = {"Head of state" => "leadership.headOfState", "Head of government" => "leadership.headOfGovernment"}

  def initialize(wikipedia: Wikipedia.new, sample: 20, seed: Random.new_seed)
    @wikipedia = wikipedia
    @entities = Entity.profiled.order(:code).to_a.sample(sample, random: Random.new(seed))
    @facts = Snapshot::Facts.load
  end

  def results
    @results ||= entities.map { |entity| check(entity) }
  end

  def to_markdown
    verdicts = results.flat_map { it.verdicts.values }
    rows = results.map { |r| "| #{r.entity.name} | #{r.verdicts.values.join(" | ")} | #{link(r.article)} |" }
    ["#{verdicts.count(:match)} of #{verdicts.count { %i[match mismatch].include?(it) }} checks match Wikipedia.", "",
      "| Country | #{CHECKS.keys.join(" | ")} | Ruling party | Article |", "|---|---|---|---|---|", *rows].join("\n")
  end

  private

  attr_reader :wikipedia, :entities, :facts

  def check(entity)
    article = wikipedia.article_for(entity.wikidata_qid)
    leaders = Infobox.values(wikipedia.wikitext(article), "leader_name\\d*")
    verdicts = CHECKS.transform_values { |field_key| verdict(name_of(entity, field_key), leaders) }
    Result.new(entity: entity, article: article, verdicts: verdicts.merge("Ruling party" => party_verdict(entity)))
  rescue HttpFetcher::Error
    Result.new(entity: entity, article: nil, verdicts: (CHECKS.keys + ["Ruling party"]).index_with(:unverifiable))
  end

  def party_verdict(entity)
    head = name_of(entity, "leadership.headOfGovernment")
    parties = Infobox.values(head && wikipedia.wikitext(head), "party")
    ours = facts.for(entity, "politics.rulingPartyOrCoalition")&.value
    if ours
      ours.map { verdict(it, parties) }.min_by { (it == :match) ? 0 : 1 }
    else
      :missing
    end
  end

  def name_of(entity, field_key) = facts.for(entity, field_key)&.value&.fetch("name")

  def verdict(ours, theirs)
    return :missing if ours.nil?
    return :unverifiable if theirs.empty?

    (theirs.any? { same?(ours, it) }) ? :match : :mismatch
  end

  def same?(a, b)
    a, b = [a, b].map { ActiveSupport::Inflector.transliterate(it).downcase.gsub(/[^a-z ]/, "").squish }
    a.present? && b.present? && (a.include?(b) || b.include?(a))
  end

  def link(article) = article ? "[#{article}](https://en.wikipedia.org/wiki/#{article.tr(" ", "_")})" : "none"
end
