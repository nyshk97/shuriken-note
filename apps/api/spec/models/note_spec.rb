# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Note do
  describe 'validations' do
    subject { build(:note) }

    it { is_expected.to validate_presence_of(:status) }
  end

  describe 'associations' do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:parent).class_name('Note').with_foreign_key(:parent_note_id).optional }
    it { is_expected.to have_many(:children).class_name('Note').with_foreign_key(:parent_note_id).dependent(:destroy) }
    it { is_expected.to have_many_attached(:attachments) }
  end

  describe 'parent-child validations' do
    let(:user) { create(:user) }
    let(:parent_note) { create(:note, user: user) }

    context 'when parent has no parent (valid child)' do
      it 'allows creating a child note' do
        child = build(:note, user: user, parent: parent_note)
        expect(child).to be_valid
      end
    end

    context 'when parent already has a parent (grandchild attempt)' do
      let(:child_note) { create(:note, user: user, parent: parent_note) }

      it 'rejects creating grandchild notes' do
        grandchild = build(:note, user: user, parent: child_note)
        expect(grandchild).not_to be_valid
        expect(grandchild.errors[:parent_note_id]).to include('cannot create grandchild notes (max depth is 2)')
      end
    end

    context 'when parent belongs to different user' do
      let(:other_user) { create(:user) }
      let(:other_note) { create(:note, user: other_user) }

      it 'rejects parent from different user' do
        child = build(:note, user: user, parent: other_note)
        expect(child).not_to be_valid
        expect(child.errors[:parent_note_id]).to include('must belong to the same user')
      end
    end
  end

  describe '#effective_status' do
    let(:user) { create(:user) }

    context 'when note has no parent' do
      it 'returns own status for personal note' do
        note = create(:note, user: user, status: :personal)
        expect(note.effective_status).to eq('personal')
      end

      it 'returns own status for published note' do
        note = create(:note, user: user, status: :published)
        expect(note.effective_status).to eq('published')
      end

      it 'returns own status for archived note' do
        note = create(:note, user: user, status: :archived)
        expect(note.effective_status).to eq('archived')
      end
    end

    context 'when note has parent' do
      let(:parent_note) { create(:note, user: user, status: :published) }
      let(:child_note) { create(:note, user: user, parent: parent_note, status: :personal) }

      it 'inherits parent status when child is not archived' do
        expect(child_note.effective_status).to eq('published')
      end

      it 'returns archived when child is archived regardless of parent' do
        child_note.update!(status: :archived)
        expect(child_note.effective_status).to eq('archived')
      end

      it 'returns archived when parent is archived' do
        parent_note.update!(status: :archived)
        expect(child_note.reload.effective_status).to eq('archived')
      end
    end

    context 'when parent status changes' do
      let(:parent_note) { create(:note, user: user, status: :personal) }
      let(:child_note) { create(:note, user: user, parent: parent_note, status: :personal) }

      it 'reflects parent status change in effective_status' do
        expect(child_note.effective_status).to eq('personal')

        parent_note.update!(status: :published)
        expect(child_note.reload.effective_status).to eq('published')
      end
    end
  end

  describe 'cascade deletion' do
    let(:user) { create(:user) }
    let!(:parent_note) { create(:note, user: user) }
    let!(:child_note) { create(:note, user: user, parent: parent_note) }

    it 'deletes children when parent is destroyed' do
      expect { parent_note.destroy }.to change(described_class, :count).by(-2)
    end

    it 'does not delete parent when child is destroyed' do
      expect { child_note.destroy }.to change(described_class, :count).by(-1)
      expect(parent_note.reload).to be_persisted
    end
  end

  describe 'attachment validations' do
    let(:note) { create(:note) }

    context 'with valid image types' do
      it 'accepts JPEG images' do
        note.attachments.attach(
          io: StringIO.new('fake image data'),
          filename: 'test.jpg',
          content_type: 'image/jpeg'
        )
        expect(note).to be_valid
      end

      it 'accepts PNG images' do
        note.attachments.attach(
          io: StringIO.new('fake image data'),
          filename: 'test.png',
          content_type: 'image/png'
        )
        expect(note).to be_valid
      end

      it 'accepts GIF images' do
        note.attachments.attach(
          io: StringIO.new('fake image data'),
          filename: 'test.gif',
          content_type: 'image/gif'
        )
        expect(note).to be_valid
      end

      it 'accepts WebP images' do
        note.attachments.attach(
          io: StringIO.new('fake image data'),
          filename: 'test.webp',
          content_type: 'image/webp'
        )
        expect(note).to be_valid
      end
    end

    context 'with valid document types' do
      it 'accepts PDF files' do
        note.attachments.attach(
          io: StringIO.new('fake pdf data'),
          filename: 'test.pdf',
          content_type: 'application/pdf'
        )
        expect(note).to be_valid
      end
    end

    context 'with valid text types' do
      it 'accepts plain text files' do
        note.attachments.attach(
          io: StringIO.new('plain text content'),
          filename: 'readme.txt',
          content_type: 'text/plain'
        )
        expect(note).to be_valid
      end

      it 'accepts CSV files' do
        note.attachments.attach(
          io: StringIO.new('col1,col2\nval1,val2'),
          filename: 'data.csv',
          content_type: 'text/csv'
        )
        expect(note).to be_valid
      end

      it 'accepts JSON files' do
        note.attachments.attach(
          io: StringIO.new('{"key": "value"}'),
          filename: 'data.json',
          content_type: 'application/json'
        )
        expect(note).to be_valid
      end
    end

    context 'with valid archive types' do
      it 'accepts ZIP files' do
        note.attachments.attach(
          io: StringIO.new('fake zip data'),
          filename: 'archive.zip',
          content_type: 'application/zip'
        )
        expect(note).to be_valid
      end
    end

    context 'with invalid file types' do
      it 'rejects unsupported file types' do
        note.attachments.attach(
          io: StringIO.new('fake binary data'),
          filename: 'unknown.bin',
          content_type: 'application/octet-stream'
        )
        expect(note).not_to be_valid
        expect(note.errors[:attachments]).to include(/unsupported file type/)
      end

      it 'rejects executable files' do
        note.attachments.attach(
          io: StringIO.new('fake exe data'),
          filename: 'program.exe',
          content_type: 'application/x-msdownload'
        )
        expect(note).not_to be_valid
        expect(note.errors[:attachments]).to include(/unsupported file type/)
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
