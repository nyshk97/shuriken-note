# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Note do
  describe 'validations' do
    subject { build(:note) }

    it { is_expected.to validate_presence_of(:status) }
  end

  describe 'associations' do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to have_many_attached(:images) }
  end

  describe 'image validations' do
    let(:note) { create(:note) }

    context 'with valid image types' do
      it 'accepts JPEG images' do
        note.images.attach(
          io: StringIO.new('fake image data'),
          filename: 'test.jpg',
          content_type: 'image/jpeg'
        )
        expect(note).to be_valid
      end

      it 'accepts PNG images' do
        note.images.attach(
          io: StringIO.new('fake image data'),
          filename: 'test.png',
          content_type: 'image/png'
        )
        expect(note).to be_valid
      end

      it 'accepts GIF images' do
        note.images.attach(
          io: StringIO.new('fake image data'),
          filename: 'test.gif',
          content_type: 'image/gif'
        )
        expect(note).to be_valid
      end

      it 'accepts WebP images' do
        note.images.attach(
          io: StringIO.new('fake image data'),
          filename: 'test.webp',
          content_type: 'image/webp'
        )
        expect(note).to be_valid
      end
    end

    context 'with valid document types' do
      it 'accepts PDF files' do
        note.images.attach(
          io: StringIO.new('fake pdf data'),
          filename: 'test.pdf',
          content_type: 'application/pdf'
        )
        expect(note).to be_valid
      end
    end

    context 'with valid text types' do
      it 'accepts plain text files' do
        note.images.attach(
          io: StringIO.new('plain text content'),
          filename: 'readme.txt',
          content_type: 'text/plain'
        )
        expect(note).to be_valid
      end

      it 'accepts CSV files' do
        note.images.attach(
          io: StringIO.new('col1,col2\nval1,val2'),
          filename: 'data.csv',
          content_type: 'text/csv'
        )
        expect(note).to be_valid
      end

      it 'accepts JSON files' do
        note.images.attach(
          io: StringIO.new('{"key": "value"}'),
          filename: 'data.json',
          content_type: 'application/json'
        )
        expect(note).to be_valid
      end
    end

    context 'with valid archive types' do
      it 'accepts ZIP files' do
        note.images.attach(
          io: StringIO.new('fake zip data'),
          filename: 'archive.zip',
          content_type: 'application/zip'
        )
        expect(note).to be_valid
      end
    end

    context 'with invalid file types' do
      it 'rejects unsupported file types' do
        note.images.attach(
          io: StringIO.new('fake binary data'),
          filename: 'unknown.bin',
          content_type: 'application/octet-stream'
        )
        expect(note).not_to be_valid
        expect(note.errors[:images]).to include(/unsupported file type/)
      end

      it 'rejects executable files' do
        note.images.attach(
          io: StringIO.new('fake exe data'),
          filename: 'program.exe',
          content_type: 'application/x-msdownload'
        )
        expect(note).not_to be_valid
        expect(note.errors[:images]).to include(/unsupported file type/)
      end
    end
  end

  describe 'enums' do
    it do
      is_expected.to define_enum_for(:status)
        .with_values(personal: 'personal', published: 'published', archived: 'archived')
        .backed_by_column_of_type(:string)
    end
  end

  describe '.search' do
    let(:user) { create(:user) }
    let!(:note_japanese) { create(:note, user: user, title: '会議メモ', body: '今日の会議の内容') }
    let!(:note_english) { create(:note, user: user, title: 'Meeting Notes', body: 'Today meeting content') }
    let!(:note_db) { create(:note, user: user, title: 'DBの設計', body: 'PostgreSQLを使う') }

    context 'when query is blank' do
      it 'returns all notes for empty string' do
        expect(user.notes.search('').count).to eq(3)
      end

      it 'returns all notes for nil' do
        expect(user.notes.search(nil).count).to eq(3)
      end
    end

    context 'when searching Japanese text in title' do
      it 'finds notes matching the query' do
        results = user.notes.search('会議')
        expect(results.count).to eq(1)
        expect(results.first).to eq(note_japanese)
      end
    end

    context 'when searching English text in title' do
      it 'finds notes matching the query' do
        results = user.notes.search('Meeting')
        expect(results.count).to eq(1)
        expect(results.first).to eq(note_english)
      end
    end

    context 'when searching in body' do
      it 'finds notes matching the query in body' do
        results = user.notes.search('PostgreSQL')
        expect(results.count).to eq(1)
        expect(results.first).to eq(note_db)
      end
    end

    context 'when searching with short query (2 characters)' do
      it 'finds notes matching short query' do
        results = user.notes.search('DB')
        expect(results.count).to eq(1)
        expect(results.first).to eq(note_db)
      end
    end

    context 'when search is case-insensitive' do
      it 'finds notes regardless of case' do
        results = user.notes.search('meeting')
        expect(results.count).to eq(1)
        expect(results.first).to eq(note_english)
      end
    end

    context 'when no notes match' do
      it 'returns empty result' do
        results = user.notes.search('存在しないキーワード')
        expect(results).to be_empty
      end
    end

    context 'when query matches multiple fields' do
      it 'finds notes matching title or body' do
        results = user.notes.search('会議')
        expect(results).to include(note_japanese)
      end
    end
  end
end
