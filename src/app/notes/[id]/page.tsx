"use client";

import { useRouter, useParams } from "next/navigation";
import { useStore } from "@/store/useStore";
import Header from "@/components/Header";
import NoteForm from "@/components/NoteForm";
import Card from "@/components/Card";
import { useEffect, useState } from "react";
import type { Note } from "@/types";

export default function EditNotePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const notes = useStore((state) => state.notes);
  const updateNote = useStore((state) => state.updateNote);
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    const n = notes.find((note) => note.id === id);
    if (n) {
      setNote(n);
    } else {
      router.push("/notes");
    }
  }, [id, notes, router]);

  const handleSubmit = (data: Omit<Note, "id">) => {
    updateNote(id, data);
    router.push("/notes");
  };

  if (!note) {
    return (
      <div className="min-h-screen pb-20">
        <Header title="edit note" backHref="/notes" />
        <main className="p-5">
          <Card>
            <p className="text-gray-400 text-center py-8">loading...</p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="edit note" backHref="/notes" />
      <main className="p-5">
        <Card>
          <NoteForm initialData={note} onSubmit={handleSubmit} />
        </Card>
      </main>
    </div>
  );
}

