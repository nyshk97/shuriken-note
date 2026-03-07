# frozen_string_literal: true

class ArticleImageUploader
  include CloudfrontUrl

  Result = Data.define(:updated_count, :skipped_count, :failures)
  Failure = Data.define(:title, :error)

  # Greedy .* in alt-text group to handle Notion bookmark exports
  # where alt contains nested markdown links: ![[text](url)](local_path)
  IMAGE_REF_PATTERN = /!\[(.*)\]\(([^)]+)\)/
  HEIC_EXT = '.heic'
  PNG_EXT = '.png'

  def initialize(import_dir:, user:)
    @import_dir = import_dir
    @user = user
  end

  def call
    notes = Note.where(user: @user, visibility: :unlisted, archived: false)

    updated_count = 0
    skipped_count = 0
    failures = []

    notes.find_each do |note|
      local_refs = extract_local_image_refs(note.body)

      if local_refs.empty?
        skipped_count += 1
        next
      end

      new_body = upload_and_rewrite(note, local_refs)
      note.update!(body: new_body, visibility: :public)
      updated_count += 1
    rescue StandardError => e
      failures << Failure.new(title: note.title, error: e.message)
    end

    Result.new(updated_count:, skipped_count:, failures:)
  end

  private

  def extract_local_image_refs(body)
    matches = []
    body.scan(IMAGE_REF_PATTERN) do
      full_match = Regexp.last_match[0]
      alt = Regexp.last_match[1]
      encoded_path = Regexp.last_match[2]
      decoded = URI::DEFAULT_PARSER.unescape(encoded_path)
      next if decoded.start_with?('http')

      matches << { alt:, encoded_path:, decoded_path: decoded, full_match: }
    end
    matches
  end

  def upload_and_rewrite(note, refs)
    body = note.body

    refs.each do |ref|
      file_path = resolve_file_path(ref[:decoded_path])
      raise "Image not found: #{ref[:decoded_path]}" unless file_path

      public_url = attach_and_get_url(note, file_path)
      filename = File.basename(ref[:decoded_path], File.extname(ref[:decoded_path]))
      body = body.gsub(ref[:full_match], "![#{filename}](#{public_url})")
    end

    body
  end

  def resolve_file_path(decoded_path)
    if File.extname(decoded_path).downcase == HEIC_EXT
      png_path = find_with_normalization(decoded_path.sub(/#{Regexp.escape(HEIC_EXT)}\z/i, PNG_EXT))
      return png_path if png_path
    end

    find_with_normalization(decoded_path)
  end

  def find_with_normalization(relative_path)
    full_path = File.join(@import_dir, relative_path)
    return full_path if File.exist?(full_path)

    nfd_path = File.join(@import_dir, relative_path.unicode_normalize(:nfd))
    return nfd_path if File.exist?(nfd_path)

    nil
  end

  def attach_and_get_url(note, file_path)
    filename = File.basename(file_path)
    content_type = Marcel::MimeType.for(Pathname.new(file_path), name: filename)

    blob = ActiveStorage::Blob.create_and_upload!(
      io: File.open(file_path),
      filename:,
      content_type:
    )

    note.attachments.attach(blob)

    cdn_url_for(blob)
  end
end
