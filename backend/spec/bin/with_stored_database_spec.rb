require "rails_helper"
require "open3"

RSpec.describe "bin/with-stored-database" do
  around do |example|
    Dir.mktmpdir do |dir|
      @store = Pathname(dir).join("store").tap(&:mkpath)
      @work = Pathname(dir).join("work").tap(&:mkpath)
      example.run
    end
  end

  let(:script) { Rails.root.join("bin/with-stored-database").to_s }
  let(:local_db) { @work.join("engine.sqlite3") }
  let(:stored_db) { @store.join("engine.sqlite3") }
  let(:backups) { @store.glob("backups/*.sqlite3") }

  def run_with_store(command, env = {})
    env = {"DATABASE_STORE" => @store.to_s, "ENGINE_DATABASE" => local_db.to_s}.merge(env)
    Open3.capture3(env, script, *command)
  end

  def marks_in(path)
    SQLite3::Database.new(path.to_s).execute("SELECT name FROM marks ORDER BY name").flatten
  end

  def insert_mark(name, then_exit: 0)
    ["ruby", "-rsqlite3", "-e",
      "SQLite3::Database.new(ENV['ENGINE_DATABASE']).execute(\"INSERT INTO marks VALUES ('#{name}')\"); exit #{then_exit}"]
  end

  context "with a stored database" do
    before do
      SQLite3::Database.new(stored_db.to_s).execute_batch(<<~SQL)
        CREATE TABLE marks (name TEXT);
        INSERT INTO marks VALUES ('yesterday');
      SQL
    end

    it "uploads the database after a successful run" do
      _, _, status = run_with_store(insert_mark("today"))

      expect(status).to be_success
      expect(marks_in(stored_db)).to eq(%w[today yesterday])
    end

    it "keeps a dated backup of every successful run" do
      run_with_store(insert_mark("today"))

      expect(backups.size).to eq(1)
      expect(marks_in(backups.first)).to eq(%w[today yesterday])
    end

    it "keeps the storage keys from the command it runs" do
      keys = {"AWS_ACCESS_KEY_ID" => "id", "AWS_SECRET_ACCESS_KEY" => "secret"}
      report_keys = ["ruby", "-e", "print ENV.keys.grep(/\\AAWS_(ACCESS|SECRET)/).join(',')"]

      stdout, _, status = run_with_store(report_keys, keys)

      expect(status).to be_success
      expect(stdout).to be_empty
    end

    it "leaves the stored database untouched when the run fails" do
      before_bytes = stored_db.binread

      _, _, status = run_with_store(insert_mark("today", then_exit: 3))

      expect(status.exitstatus).to eq(3)
      expect(stored_db.binread).to eq(before_bytes)
      expect(backups).to be_empty
    end
  end

  context "without a stored database" do
    it "refuses to run rather than start from an empty database" do
      _, stderr, status = run_with_store(["touch", @work.join("ran").to_s])

      expect(status).not_to be_success
      expect(stderr).to include("ALLOW_EMPTY_DATABASE")
      expect(@work.join("ran")).not_to exist
      expect(stored_db).not_to exist
    end

    it "starts from an empty database when explicitly allowed" do
      create_table = ["ruby", "-rsqlite3", "-e",
        "SQLite3::Database.new(ENV['ENGINE_DATABASE']).execute('CREATE TABLE marks (name TEXT)')"]

      _, _, status = run_with_store(create_table, "ALLOW_EMPTY_DATABASE" => "1")

      expect(status).to be_success
      expect(marks_in(stored_db)).to eq([])
    end
  end
end
