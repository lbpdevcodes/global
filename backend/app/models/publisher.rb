# Writes a snapshot to <to>/data/v1. Every file is validated and size-checked
# first, and the new snapshot replaces the old one in a single rename, so a
# failed publish leaves the previous snapshot untouched.
class Publisher
  class TooLarge < StandardError; end

  COUNTRY_FILE_LIMIT = 20 * 1024

  def initialize(validator: ContractValidator.new)
    @validator = validator
  end

  def publish(files, to:)
    bodies = files.to_h { |path, document| [path, checked_body(path, document)] }
    staging = Pathname(to).join("data/.v1-staging").tap { FileUtils.rm_rf(it) }
    bodies.each { |path, body| staging.join(path).tap { it.dirname.mkpath }.write(body) }
    swap_into_place(staging, Pathname(to).join("data/v1"))
  end

  private

  attr_reader :validator

  def checked_body(path, document)
    validator.validate!(path, document)
    JSON.generate(document).tap do |body|
      raise TooLarge, "#{path} is #{body.bytesize} bytes" if path.start_with?("countries/") && body.bytesize > COUNTRY_FILE_LIMIT
    end
  end

  def swap_into_place(staging, target)
    retired = target.sub_ext(".retired")
    FileUtils.rm_rf(retired)
    target.rename(retired) if target.exist?
    staging.rename(target)
    FileUtils.rm_rf(retired)
  end
end
