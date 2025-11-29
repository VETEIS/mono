"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import Header from "@/components/Header";
import NoteForm from "@/components/NoteForm";
import Card from "@/components/Card";

export default function NewNotePage() {
  const router = useRouter();
  const addNote = useStore((state) => state.addNote);

  const handleSubmit = (data: Parameters<typeof addNote>[0]) => {
    addNote(data);
    router.push("/notes");
  };

  return (
    <div className="min-h-screen pt-16 pb-20">
      <Header title="new note" backHref="/notes" />
      <main className="p-5">
        <Card>
          <NoteForm onSubmit={handleSubmit} />
        </Card>
      </main>
    </div>
  );
}

