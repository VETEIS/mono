"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import Header from "@/components/Header";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import Link from "next/link";
import { Plus, Users, Trash2, Eye } from "lucide-react";
import { formatDateTime } from "@/utils/format";

export default function GroupsPage() {
  const groups = useStore((state) => state.groups);
  const deleteGroup = useStore((state) => state.deleteGroup);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Wait for hydration to complete before showing content
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDelete = (groupId: string) => {
    deleteGroup(groupId);
    setDeleteModal(null);
  };

  return (
    <div className="min-h-screen pt-16 pb-20">
      <Header
        title="groups"
        action={
          <Link
            href="/groups/new"
            className="p-2.5 hover:bg-[#2C2C2E] rounded-xl transition-colors active:scale-95"
          >
            <Plus className="w-6 h-6 text-[#FCD34D]" />
          </Link>
        }
      />

      <main className="p-5">
        {!mounted ? null : groups.length === 0 ? (
          <Card>
            <div className="text-gray-400 text-center py-10">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <p className="text-lg mb-2">no groups yet</p>
              <p className="text-sm mb-4">
                create a group to start tracking shared expenses
              </p>
              <Link
                href="/groups/new"
                className="inline-block px-6 py-3 bg-[#FCD34D] hover:bg-[#FBBF24] text-[#1C1C1E] rounded-xl font-semibold transition-all active:scale-95"
              >
                create your first group
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              return (
                <Card key={group.id} hover className="relative">
                  <p className="absolute top-3 right-3 text-[10px] text-gray-500 z-0">
                    {formatDateTime(group.createdAt)}
                  </p>
                  <div className="flex items-center gap-4 relative">
                    <Link href={`/groups/${group.id}`} className="flex-1 min-w-0">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-gray-50">
                            {group.name}
                          </h3>
                          {group.readOnly && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-[#FCD34D]/20 border border-[#FCD34D]/30 rounded-lg">
                              <Eye className="w-3 h-3 text-[#FCD34D]" />
                              <span className="text-xs font-semibold text-[#FCD34D]">read-only</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs font-semibold px-2 py-0.5 bg-[#FCD34D]/10 text-[#FCD34D] rounded-lg">
                            {group.members.length} members
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 bg-red-500/20 text-red-400 rounded-lg">
                            {group.expenses.length} expenses
                          </span>
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteModal(group.id);
                      }}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors active:scale-95 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal !== null}
        onClose={() => setDeleteModal(null)}
        title="delete group"
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
            <p className="text-gray-300 text-sm text-justify">
              are you sure you want to delete this group? this action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

