# frozen_string_literal: true

namespace :import do
  desc 'Import Notion-exported blog articles into notes'
  task articles: :environment do
    import_dir = resolve_import_dir
    user = User.find_by!(email: ENV.fetch('USER_EMAIL'))

    puts "Import dir: #{import_dir}"
    puts "User: #{user.email}"
    puts '---'

    result = ArticleImporter.new(import_dir:, user:).call

    puts "Created: #{result.created_count}"
    puts "Skipped: #{result.skipped_count}"
    puts "Failed:  #{result.failures.count}"
    result.failures.each { |f| puts "  #{f.file}: #{f.error}" }

    exit(1) if result.failures.any?
  end
end

def resolve_import_dir
  if ENV['IMPORT_DIR'].present?
    dir = ENV['IMPORT_DIR']
    raise "Directory not found: #{dir}" unless File.directory?(dir)

    dir
  elsif ENV['IMPORT_S3_URI'].present?
    download_and_extract_from_s3(ENV['IMPORT_S3_URI'])
  else
    abort 'Set IMPORT_DIR (local path) or IMPORT_S3_URI (s3://bucket/key.zip)'
  end
end

def download_and_extract_from_s3(s3_uri)
  require 'aws-sdk-s3'

  match = s3_uri.match(%r{\As3://([^/]+)/(.+)\z})
  raise "Invalid S3 URI: #{s3_uri}" unless match

  bucket = match[1]
  key = match[2]

  tmpdir = Dir.mktmpdir('notion-import')
  zip_path = File.join(tmpdir, 'export.zip')

  puts "Downloading #{s3_uri} ..."
  Aws::S3::Client.new.get_object(bucket:, key:, response_target: zip_path)

  puts 'Extracting ...'
  system('unzip', '-q', zip_path, '-d', tmpdir, exception: true)

  md_files = Dir.glob(File.join(tmpdir, '**', '*.md'))
  raise 'No .md files found in archive' if md_files.empty?

  md_files.map { |f| File.dirname(f) }.min_by(&:length)
end
