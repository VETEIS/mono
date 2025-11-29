"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { formatDate } from "@/utils/format";
import Card from "@/components/Card";
import Header from "@/components/Header";
import Link from "next/link";
import { Trash2, Plus } from "lucide-react";
import Modal from "@/components/Modal";

export default function NotesPage() {
  const notes = useStore((state) => state.notes);
  const deleteNote = useStore((state) => state.deleteNote);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);

  const sortedNotes = useMemo(() => {
    return [...notes].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [notes]);

  const handleDelete = (id: string) => {
    deleteNote(id);
    setDeleteModal(null);
  };

  return (
    <div className="min-h-screen pt-16 pb-20">
      <Header
        title="notes"
        backHref="/debts"
        action={
          <Link
            href="/notes/new"
            className="p-2.5 hover:bg-[#2C2C2E] rounded-xl transition-colors active:scale-95"
          >
            <Plus className="w-6 h-6 text-[#FCD34D]" />
          </Link>
        }
      />

      <main className="p-5 space-y-3">
        {sortedNotes.length === 0 ? (
          <Card>
            <div className="text-gray-400 text-center py-10">
              <p>no notes yet.</p>
              <p className="mt-2">
                <Link href="/notes/new" className="text-[#FCD34D] hover:text-[#FBBF24] hover:underline font-medium transition-colors active:opacity-70">
                  add your first note
                </Link>
              </p>
            </div>
          </Card>
        ) : (
          sortedNotes.map((note) => (
            <Card key={note.id} hover className="border-l-4 border-l-[#FCD34D]">
              <div className="flex items-start justify-between gap-4">
                <Link
                  href={`/notes/${note.id}`}
                  className="flex-1"
                >
                  <p className="text-gray-50 whitespace-pre-wrap break-words leading-relaxed">
                    {note.text}
                  </p>
                  <p className="text-xs text-gray-400 mt-3 font-medium">
                    {formatDate(note.date)}
                  </p>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteModal(note.id);
                  }}
                  className="p-2 hover:bg-red-500/10 rounded-xl transition-colors flex-shrink-0 active:scale-95"
                >
                  <Trash2 className="w-5 h-5 text-red-400" />
                </button>
              </div>
            </Card>
          ))
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal !== null}
        onClose={() => setDeleteModal(null)}
        title="delete note"
        footer={
          <div className="flex gap-3 px-6 py-4">
            <button
              onClick={() => setDeleteModal(null)}
              className="flex-1 px-5 py-3 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-gray-300 rounded-2xl transition-all font-semibold active:scale-95"
            >
              cancel
            </button>
            <button
              onClick={() => deleteModal && handleDelete(deleteModal)}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-semibold active:scale-95"
            >
              delete
            </button>
          </div>
        }
      >
        <div className="px-6 pt-6 pb-4">
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              are you sure you want to delete this note? this action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

