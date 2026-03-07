# frozen_string_literal: true

class ArticleImporter
  Result = Data.define(:created_count, :skipped_count, :failures)
  Failure = Data.define(:file, :error)

  def initialize(import_dir:, user:)
    @import_dir = import_dir
    @user = user
  end

  def call
    asset_dirs = scan_asset_dirs
    md_files = Dir.glob(File.join(@import_dir, '*.md')).sort

    created_count = 0
    skipped_count = 0
    failures = []

    md_files.each do |md_path|
      parsed = parse_markdown(md_path)

      if Note.exists?(user_id: @user.id, title: parsed[:title])
        skipped_count += 1
        next
      end

      visibility = asset_dirs.include?(parsed[:title]) ? :unlisted : :public

      Note.create!(
        user: @user,
        title: parsed[:title],
        body: parsed[:body],
        visibility: visibility,
        archived: false,
        created_at: parsed[:created_at],
        updated_at: parsed[:created_at]
      )

      created_count += 1
    rescue StandardError => e
      failures << Failure.new(file: md_path, error: e.message)
    end

    Result.new(created_count:, skipped_count:, failures:)
  end

  private

  def scan_asset_dirs
    Dir.glob(File.join(@import_dir, '*/')).each_with_object(Set.new) do |dir, set|
      set << File.basename(dir).unicode_normalize(:nfc)
    end
  end

  def parse_markdown(path)
    content = File.read(path, encoding: 'UTF-8')
    lines = content.lines.map(&:chomp)

    title = lines[0].to_s.sub(/\A#\s*/, '').strip
    raise "Missing title in #{File.basename(path)}" if title.empty?

    created_str = lines[2].to_s.sub(/\ACreated:\s*/, '').strip
    created_at = Time.zone.parse(created_str)
    raise "Invalid Created date: '#{created_str}' in #{File.basename(path)}" if created_at.nil?

    body = (lines[4..] || []).join("\n").rstrip

    { title:, created_at:, body: }
  end
end
