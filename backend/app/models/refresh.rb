# Runs every source and records what it reports. A failing source is reported
# and skipped, so its fields keep their last good values.
class Refresh
  Summary = Data.define(:recorded, :unmatched_codes, :failures) do
    def failures_markdown
      lines = failures.map { |source, reason| "- **#{source}**: #{reason}" }
      ["Sources that failed today kept their last good values:", "", *lines].join("\n")
    end
  end

  def initialize(sources:, recorder: Observations::Recorder.new)
    @sources = sources
    @recorder = recorder
  end

  def call(at:)
    entities = Entity.all.index_by(&:code)
    results = sources.to_h { |name, source| [name, run(source, entities, at)] }
    Summary.new(recorded: results.values.sum { it[:recorded].to_i },
      unmatched_codes: collect(results, :unmatched), failures: collect(results, :failure))
  end

  private

  attr_reader :sources, :recorder

  def run(source, entities, at)
    matched, unmatched = source.observations.partition { entities.key?(it.entity_code) }
    Entity.transaction { matched.each { recorder.record(entities[it.entity_code], it, at: at) } }
    {recorded: matched.size, unmatched: unmatched.map(&:entity_code).uniq.sort}
  rescue => error
    {failure: "#{error.class}: #{error.message}"}
  end

  def collect(results, key)
    results.transform_values { it[key] }.compact_blank
  end
end
