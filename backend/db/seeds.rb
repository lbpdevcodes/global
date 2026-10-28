# Loads the curated entity list (docs/adr/0003-coverage.md). Safe to run repeatedly.
EntitySeed.new(YAML.load_file(Rails.root.join("db/seeds/entities.yml"))).apply
