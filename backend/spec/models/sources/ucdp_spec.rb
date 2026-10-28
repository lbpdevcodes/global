require "rails_helper"

RSpec.describe Sources::Ucdp do
  let(:fetcher) do
    Object.new.tap do |fake|
      fake.define_singleton_method(:get_text) do |url, **|
        fixture = {Sources::Ucdp::DOWNLOADS => "downloads.html",
                   "https://ucdp.uu.se/downloads/candidateged/GEDEvent_v26_01_26_09.csv" => "GEDEvent_v26_01_26_09.csv"}
        Rails.root.join("spec/fixtures/ucdp", fixture.fetch(url) { raise "unexpected #{url}" }).read
      end
      fake.define_singleton_method(:get_bytes) do |url, **|
        raise "unexpected #{url}" unless url.end_with?("ucdp-prio-acd-261-csv.zip")
        Rails.root.join("spec/fixtures/ucdp/ucdp-prio-acd-261-csv.zip").binread
      end
    end
  end
  let(:names) do
    EntityNames.new({"India" => "IND", "Pakistan" => "PAK", "Myanmar" => "MMR", "Nepal" => "NPL", "Iran" => "IRN",
                     "Israel" => "ISR", "United States of America" => "USA", "Sri Lanka" => "LKA", "Iraq" => "IRQ"})
  end
  let(:observed) { Sources::Ucdp.new(fetcher: fetcher, names: names).observations }

  it_behaves_like "a source"

  def items(code) = observed.find { it.entity_code == code }.value

  it "describes each armed conflict active in the latest year in UCDP's own terms" do
    expect(items("IND")).to eq([{
      "title" => "Government of India vs Government of Pakistan over Kashmir",
      "parties" => ["Government of India", "Government of Pakistan"], "status" => "active_conflict",
      "statusLabel" => "Minor armed conflict (25–999 battle-related deaths in 2025)",
      "sourceUrl" => "https://ucdp.uu.se/conflict/218"
    }])
  end

  it "labels a conflict at war intensity as a war" do
    expect(items("MMR").pluck("statusLabel")).to include("War (1,000+ battle-related deaths in 2025)")
  end

  it "lists an interstate conflict under every country where it is fought" do
    expect(items("PAK").pluck("sourceUrl")).to eq(["https://ucdp.uu.se/conflict/218"])
  end

  it "confirms an empty list for a country with no conflict recorded in the latest year" do
    expect(items("NPL")).to eq([])
  end

  it "dates each list by the newest year it describes" do
    expect(observed.map(&:period).uniq).to eq(["2026"])
  end

  it "matches places by names that earlier sources record in the same refresh" do
    myanmar = create(:entity, code: "MMR", name: "Burma")
    source = Sources::Ucdp.new(fetcher: fetcher)
    observe(myanmar, "index.aliases", ["Myanmar"])

    conflicts = source.observations.find { it.entity_code == "MMR" }.value

    expect(conflicts).not_to be_empty
  end

  it "lists a conflict from this year's candidate events under each country whose government fights in it" do
    war = "https://ucdp.uu.se/conflict/16905"

    expect(%w[IRN ISR USA].map { items(it).pluck("sourceUrl") }).to all(include(war))
  end

  it "labels this year's conflicts as preliminary, with the deaths so far and the months covered" do
    war = items("USA").find { it["sourceUrl"].end_with?("/16905") }

    expect(war["statusLabel"]).to eq("War, preliminary (2,000 battle-related deaths in January–September 2026)")
  end

  it "labels this year's conflicts below war intensity as minor" do
    iraq = items("IRQ").find { it["sourceUrl"].end_with?("/77") }

    expect(iraq["statusLabel"]).to eq("Minor armed conflict, preliminary (110 battle-related deaths in January–September 2026)")
  end

  it "leaves out this year's figures for a conflict below 25 battle-related deaths so far" do
    iran_israel = items("IRN").select { it["sourceUrl"].end_with?("/14609") }

    expect(iran_israel.pluck("statusLabel")).to eq(["War (1,000+ battle-related deaths in 2025)"])
  end

  it "lists a conflict in both datasets once, with this year's figures" do
    iran_government = items("IRN").select { it["sourceUrl"].end_with?("/338") }

    expect(iran_government.pluck("statusLabel"))
      .to eq(["Minor armed conflict, preliminary (30 battle-related deaths in January–September 2026)"])
  end

  it "names every actor fighting in this year's conflict as a party" do
    iran_government = items("IRN").find { it["sourceUrl"].end_with?("/338") }

    expect(iran_government["parties"]).to contain_exactly("Government of Iran", "Jaish al-Adl", "PJAK")
  end

  it "leaves out the placeholders UCDP uses for actors it has not identified yet" do
    iraq = items("IRQ").find { it["sourceUrl"].end_with?("/77") }

    expect(iraq["parties"]).to eq(["Government of Iraq", "Government of Israel", "Government of United States of America"])
  end

  it "titles this year's conflict by its deadliest pairing of sides" do
    iran_government = items("IRN").find { it["sourceUrl"].end_with?("/338") }

    expect(iran_government["title"]).to eq("Government of Iran vs Jaish al-Adl")
  end

  it "titles this year's conflict by identified sides when unidentified ones fought more" do
    iraq = items("IRQ").find { it["sourceUrl"].end_with?("/77") }

    expect(iraq["title"]).to eq("Government of Iraq vs Government of Israel, Government of United States of America")
  end

  it "does not list a conflict under a country where it was fought by other governments" do
    expect(items("LKA")).to eq([])
  end

  it "counts only fighting between organized sides, not violence against civilians" do
    expect(items("NPL")).to eq([])
  end

  it "names the governments that sent troops to support a side as parties" do
    iran_israel = items("ISR").find { it["sourceUrl"].end_with?("/14609") }

    expect(iran_israel["parties"]).to eq(["Government of Iran", "Government of Israel", "Government of United States of America"])
  end

  it "fails naming the missing file when the downloads page lists no candidate events release" do
    page = Rails.root.join("spec/fixtures/ucdp/downloads.html").read.gsub(/.*candidateged.*\n/, "")
    fetcher.define_singleton_method(:get_text) { |_url, **| page }

    expect { Sources::Ucdp.new(fetcher: fetcher, names: names).observations }
      .to raise_error(KeyError, "UCDP's downloads page lists no January-to-date candidate events CSV")
  end

  it "lists each actor on a side as its own party" do
    myanmar_war = items("MMR").find { it["sourceUrl"].end_with?("/222") }

    expect(myanmar_war["parties"]).to eq(["Government of Myanmar (Burma)", "NUG", "PSLF"])
  end
end
