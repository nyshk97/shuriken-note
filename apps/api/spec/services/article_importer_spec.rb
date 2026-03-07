# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ArticleImporter do
  let(:user) { create(:user) }
  let(:tmpdir) { Dir.mktmpdir('article-importer-test') }

  after { FileUtils.rm_rf(tmpdir) }

  def write_article(filename, title:, created:, body: "Some content\n\nMore content")
    content = "# #{title}\n\n#{created}\n\n#{body}"
    File.write(File.join(tmpdir, filename), content)
  end

  def create_asset_dir(name)
    FileUtils.mkdir_p(File.join(tmpdir, name))
  end

  describe '#call' do
    it 'imports articles from markdown files' do
      write_article('article1 abc123.md',
        title: 'First Article',
        created: 'Created: January 15, 2023 10:00 AM')
      write_article('article2 def456.md',
        title: 'Second Article',
        created: 'Created: March 1, 2024 3:30 PM')

      result = described_class.new(import_dir: tmpdir, user: user).call

      expect(result.created_count).to eq(2)
      expect(result.skipped_count).to eq(0)
      expect(result.failures).to be_empty

      notes = Note.where(user: user).order(:title)
      expect(notes.count).to eq(2)

      first = notes.first
      expect(first.title).to eq('First Article')
      expect(first.body).to eq("Some content\n\nMore content")
      expect(first.visibility).to eq('public')
      expect(first.archived).to be(false)
      expect(first.created_at).to eq(Time.zone.parse('January 15, 2023 10:00 AM'))
    end

    it 'sets unlisted visibility when asset directory exists' do
      write_article('with-images abc123.md',
        title: 'Article With Images',
        created: 'Created: June 1, 2023 9:00 AM')
      create_asset_dir('Article With Images')

      write_article('no-images def456.md',
        title: 'Plain Article',
        created: 'Created: June 2, 2023 9:00 AM')

      result = described_class.new(import_dir: tmpdir, user: user).call

      expect(result.created_count).to eq(2)

      with_images = Note.find_by!(title: 'Article With Images')
      plain = Note.find_by!(title: 'Plain Article')

      expect(with_images.visibility).to eq('unlisted')
      expect(plain.visibility).to eq('public')
    end

    it 'skips articles that already exist (idempotent)' do
      create(:note, user: user, title: 'Existing Article')

      write_article('existing abc123.md',
        title: 'Existing Article',
        created: 'Created: January 1, 2024 12:00 PM')
      write_article('new def456.md',
        title: 'New Article',
        created: 'Created: January 2, 2024 12:00 PM')

      result = described_class.new(import_dir: tmpdir, user: user).call

      expect(result.created_count).to eq(1)
      expect(result.skipped_count).to eq(1)
      expect(Note.where(user: user).count).to eq(2)
    end

    it 'handles empty body (edge case)' do
      File.write(
        File.join(tmpdir, 'empty-body abc123.md'),
        "# Empty Body Article\n\nCreated: August 10, 2024 12:43 AM"
      )

      result = described_class.new(import_dir: tmpdir, user: user).call

      expect(result.created_count).to eq(1)

      note = Note.find_by!(title: 'Empty Body Article')
      expect(note.body).to eq('')
    end

    it 'records failures without stopping the import' do
      write_article('good abc123.md',
        title: 'Good Article',
        created: 'Created: January 1, 2024 12:00 PM')
      File.write(File.join(tmpdir, 'bad def456.md'), "# Bad Article\n\nNot a date\n\n")

      result = described_class.new(import_dir: tmpdir, user: user).call

      expect(result.created_count).to eq(1)
      expect(result.failures.count).to eq(1)
      expect(result.failures.first.error).to include('Invalid Created date')
    end

    it 'is fully idempotent on repeated runs' do
      write_article('article abc123.md',
        title: 'My Article',
        created: 'Created: May 5, 2023 8:00 AM')

      importer = described_class.new(import_dir: tmpdir, user: user)

      first_run = importer.call
      expect(first_run.created_count).to eq(1)

      second_run = importer.call
      expect(second_run.created_count).to eq(0)
      expect(second_run.skipped_count).to eq(1)
      expect(Note.where(user: user).count).to eq(1)
    end

    it 'does not import articles belonging to another user' do
      other_user = create(:user)
      create(:note, user: other_user, title: 'Same Title')

      write_article('article abc123.md',
        title: 'Same Title',
        created: 'Created: January 1, 2024 12:00 PM')

      result = described_class.new(import_dir: tmpdir, user: user).call

      expect(result.created_count).to eq(1)
      expect(result.skipped_count).to eq(0)
    end
  end
end
