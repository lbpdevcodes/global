namespace :data do
  desc "Fetch every source and record what changed"
  task refresh: :environment do
    summary = Refresh.new(sources: Sources.all).call(at: Time.current)
    puts "Recorded #{summary.recorded} values."
    summary.unmatched_codes.each { |source, codes| puts "#{source}: skipped codes not in the seed: #{codes.join(", ")}" }
    summary.failures.each { |source, reason| warn "#{source} FAILED: #{reason}" }
  end

  desc "Build, validate and write the snapshot to OUT/data/v1 (default: ../web/public)"
  task publish: :environment do
    out = ENV.fetch("OUT", Rails.root.join("../web/public").to_s)
    files = Snapshot::Builder.new(generated_at: Time.current).files
    Publisher.new.publish(files, to: out)
    puts "Published #{files.size} files to #{File.join(out, "data/v1")}"
  end
end
