namespace :data do
  desc "Fetch every source and record what changed"
  task refresh: :environment do
    summary = Refresh.new(sources: Sources.all).call(at: Time.current)
    puts "Recorded #{summary.recorded} values."
    summary.unmatched_codes.each { |source, codes| puts "#{source}: skipped codes not in the seed: #{codes.join(", ")}" }
    summary.failures.each { |source, reason| warn "#{source} FAILED: #{reason}" }
    failures = Rails.root.join("tmp/refresh-failures.md")
    summary.failures.any? ? failures.write(summary.failures_markdown) : FileUtils.rm_f(failures)
  end

  desc "Build, validate and write the snapshot to OUT/data/v1 (default: ../web)"
  task publish: :environment do
    out = ENV.fetch("OUT", Rails.root.join("../web").to_s)
    files = Snapshot::Builder.new(generated_at: Time.current).files
    Publisher.new.publish(files, to: out)
    puts "Published #{files.size} files to #{File.join(out, "data/v1")}"
  end

  desc "Report fields past their refresh window; writes tmp/freshness.md and fails when any are stale"
  task freshness: :environment do
    report = FreshnessReport.new(Snapshot::Facts.load)
    Rails.root.join("tmp/freshness.md").write(report.to_markdown)
    puts report.to_markdown.lines.first
    abort "Stale fields found: see tmp/freshness.md" if report.stale.any?
  end

  desc "List leadership and ruling-party changes from the last day; writes tmp/changes.md when there are any"
  task changes: :environment do
    report = ChangeReport.new(since: 23.hours.ago)
    path = Rails.root.join("tmp/changes.md")
    report.changes.any? ? path.write(report.to_markdown) : FileUtils.rm_f(path)
    puts report.to_markdown.lines.first
  end

  desc "Compare N random profiles' leaders and ruling party with Wikipedia; writes tmp/spot-check.md"
  task :spot_check, [:sample] => :environment do |_task, args|
    check = SpotCheck.new(sample: Integer(args.fetch(:sample, 20)))
    Rails.root.join("tmp/spot-check.md").write(check.to_markdown)
    puts check.to_markdown
  end
end
