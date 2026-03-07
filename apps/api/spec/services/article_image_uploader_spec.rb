# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ArticleImageUploader do
  let(:user) { create(:user) }
  let(:tmpdir) { Dir.mktmpdir('article-image-uploader-test') }

  after { FileUtils.rm_rf(tmpdir) }

  def create_image(subdir, filename, content: "\x89PNG\r\n\x1a\n" + ("\x00" * 100))
    dir = File.join(tmpdir, subdir)
    FileUtils.mkdir_p(dir)
    File.binwrite(File.join(dir, filename), content)
  end

  def encoded_path(title, filename)
    "#{URI::DEFAULT_PARSER.escape(title)}/#{URI::DEFAULT_PARSER.escape(filename)}"
  end

  describe '#call' do
    it 'uploads images, rewrites markdown, and sets visibility to public' do
      create_image('My Article', 'screenshot.png')

      note = create(:note, :unlisted, user: user,
        title: 'My Article',
        body: "Some text\n\n![screenshot](#{encoded_path('My Article', 'screenshot.png')})\n\nMore text")

      result = described_class.new(import_dir: tmpdir, user: user).call

      expect(result.updated_count).to eq(1)
      expect(result.skipped_count).to eq(0)
      expect(result.failures).to be_empty

      note.reload
      expect(note.visibility).to eq('public')
      expect(note.body).not_to include(encoded_path('My Article', 'screenshot.png'))
      expect(note.body).to match(%r{!\[screenshot\]\(http.+/screenshot\.png\)})
      expect(note.body).to include('Some text')
      expect(note.body).to include('More text')
      expect(note.attachments.count).to eq(1)
    end

    it 'handles multiple images in one article' do
      create_image('Multi', 'img1.png')
      create_image('Multi', 'img2.png')

      body = [
        '# Content',
        '',
        "![first](#{encoded_path('Multi', 'img1.png')})",
        '',
        "![second](#{encoded_path('Multi', 'img2.png')})"
      ].join("\n")

      note = create(:note, :unlisted, user: user, title: 'Multi', body: body)

      result = described_class.new(import_dir: tmpdir, user: user).call

      expect(result.updated_count).to eq(1)

      note.reload
      expect(note.visibility).to eq('public')
      expect(note.attachments.count).to eq(2)
      expect(note.body).not_to include(encoded_path('Multi', 'img1.png'))
      expect(note.body).not_to include(encoded_path('Multi', 'img2.png'))
    end

    it 'skips unlisted notes without local image references' do
      note = create(:note, :unlisted, user: user,
        title: 'No Images',
        body: 'Just text, no images here')

      result = described_class.new(import_dir: tmpdir, user: user).call

      expect(result.updated_count).to eq(0)
      expect(result.skipped_count).to eq(1)

      note.reload
      expect(note.visibility).to eq('unlisted')
    end

    it 'preserves external URLs and only replaces local paths' do
      create_image('Mixed', 'local.png')

      body = [
        "![external](https://example.com/image.png)",
        '',
        "![local](#{encoded_path('Mixed', 'local.png')})"
      ].join("\n")

      note = create(:note, :unlisted, user: user, title: 'Mixed', body: body)

      result = described_class.new(import_dir: tmpdir, user: user).call

      expect(result.updated_count).to eq(1)

      note.reload
      expect(note.body).to include('https://example.com/image.png')
      expect(note.body).not_to include(encoded_path('Mixed', 'local.png'))
    end

    it 'does not process public or personal notes' do
      create(:note, :public_listed, user: user, title: 'Public', body: '![img](test/img.png)')
      create(:note, user: user, title: 'Personal', body: '![img](test/img.png)')

      result = described_class.new(import_dir: tmpdir, user: user).call

      expect(result.updated_count).to eq(0)
      expect(result.skipped_count).to eq(0)
    end

    it 'records failure when image file is missing' do
      note = create(:note, :unlisted, user: user,
        title: 'Missing Image',
        body: "![gone](#{encoded_path('Missing Image', 'missing.png')})")

      result = described_class.new(import_dir: tmpdir, user: user).call

      expect(result.updated_count).to eq(0)
      expect(result.failures.count).to eq(1)
      expect(result.failures.first.error).to include('Image not found')

      note.reload
      expect(note.visibility).to eq('unlisted')
    end

    it 'falls back to .png when .heic is referenced but pre-converted' do
      create_image('HEIC Article', 'photo.png')

      note = create(:note, :unlisted, user: user,
        title: 'HEIC Article',
        body: "![photo](#{encoded_path('HEIC Article', 'photo.heic')})")

      result = described_class.new(import_dir: tmpdir, user: user).call

      expect(result.updated_count).to eq(1)

      note.reload
      expect(note.visibility).to eq('public')
      expect(note.body).not_to include('.heic')
      expect(note.attachments.count).to eq(1)
      expect(note.attachments.first.filename.to_s).to eq('photo.png')
    end

    it 'handles Notion bookmark exports with nested markdown in alt text' do
      create_image('Bookmark Article', 'preview.png')

      bookmark_ref = "![[https://example.com/product](https://example.com/product)](#{encoded_path('Bookmark Article', 'preview.png')})"
      note = create(:note, :unlisted, user: user,
        title: 'Bookmark Article',
        body: "Some text\n\n#{bookmark_ref}\n\nMore text")

      result = described_class.new(import_dir: tmpdir, user: user).call

      expect(result.updated_count).to eq(1)
      expect(result.failures).to be_empty

      note.reload
      expect(note.visibility).to eq('public')
      expect(note.body).not_to include('example.com/product')
      expect(note.body).to match(%r{!\[preview\]\(http.+\)})
      expect(note.body).to include('Some text')
      expect(note.body).to include('More text')
      expect(note.attachments.count).to eq(1)
    end

    it 'is idempotent — re-running skips already processed notes' do
      create_image('Idem', 'img.png')

      note = create(:note, :unlisted, user: user,
        title: 'Idem',
        body: "![img](#{encoded_path('Idem', 'img.png')})")

      first_run = described_class.new(import_dir: tmpdir, user: user).call
      expect(first_run.updated_count).to eq(1)

      second_run = described_class.new(import_dir: tmpdir, user: user).call
      expect(second_run.updated_count).to eq(0)
      expect(second_run.skipped_count).to eq(0)

      expect(Note.find(note.id).attachments.count).to eq(1)
    end
  end
end
