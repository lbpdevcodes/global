require "csv"
require "zip"

module Sources
  # Armed conflicts from UCDP (CC BY 4.0), listed under each country involved:
  # every conflict active in the yearly Armed Conflict Dataset's latest year,
  # plus the current year's preliminary figures from the monthly candidate
  # events. Every known country gets a list, so an empty one confirms "none
  # recorded". Place names are matched against the names known when the source
  # runs, so the ones REST Countries records earlier in the same refresh count.
  class Ucdp
    DOWNLOADS = "https://ucdp.uu.se/downloads/"
    BYTE_ORDER_MARK = "﻿"

    # One conflict as an item, and the places whose countries list it.
    Listing = Data.define(:conflict_id, :places, :item)

    def initialize(fetcher: HttpFetcher.new, names: nil)
      @fetcher = fetcher
      @names = names
    end

    def observations
      by_code = listings.flat_map { |listing| codes(listing.places).map { [it, listing.item] } }.group_by(&:first)
      names.all_codes.map { |code| observed(code, by_code.fetch(code, []).map(&:last)) }
    end

    private

    attr_reader :fetcher

    def names = @names ||= EntityNames.load

    # This year's figures replace last year's for a conflict both datasets have.
    def listings
      current = candidate.listings
      current + yearly.listings.reject { |last_year| current.any? { it.conflict_id == last_year.conflict_id } }
    end

    def yearly = @yearly ||= YearlyConflicts.from(downloads_page, fetcher)

    def candidate = @candidate ||= CandidateEvents.from(downloads_page, fetcher)

    def downloads_page = @downloads_page ||= fetcher.get_text(DOWNLOADS)

    def codes(places)
      places.filter_map do |name|
        names.code_for(name).tap { Rails.logger.warn("UCDP location not matched: #{name}") unless it }
      end
    end

    def observed(code, items)
      ObservedValue.new(entity_code: code, field_key: "tensions.ucdp", value: items, source_key: "ucdp",
        source_url: DOWNLOADS, period: candidate.year)
    end
  end
end
