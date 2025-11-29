"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import Header from "@/components/Header";
import Card from "@/components/Card";
import { generateAvatarColor } from "@/utils/groups";
import type { Group } from "@/types";

export default function NewGroupPage() {
  const router = useRouter();
  const addGroup = useStore((state) => state.addGroup);
  const groups = useStore((state) => state.groups);
  
  const [name, setName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [members, setMembers] = useState<Array<{ name: string; id: string }>>([]);
  
  // Check if group name already exists (real-time validation)
  const nameExists = name.trim() ? groups.some((g) => g.name.toLowerCase().trim() === name.toLowerCase().trim()) : false;
  
  // Check if member name already exists in current members list (real-time validation)
  const memberNameExists = memberName.trim() ? members.some((m) => m.name.toLowerCase().trim() === memberName.toLowerCase().trim()) : false;

  const handleAddMember = () => {
    if (!memberName.trim()) return;
    // Check if member name already exists
    const trimmedName = memberName.trim();
    const nameExists = members.some((m) => m.name.toLowerCase().trim() === trimmedName.toLowerCase());
    if (nameExists) return; // Don't add duplicate member
    
    setMembers([
      ...members,
      { name: trimmedName, id: crypto.randomUUID() },
    ]);
    setMemberName("");
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Final validation check
    const trimmedName = name.trim();
    const currentGroups = useStore.getState().groups;
    const finalNameExists = currentGroups.some((g) => g.name.toLowerCase().trim() === trimmedName.toLowerCase());
    
    if (!trimmedName || members.length < 2 || finalNameExists) return;

    const createdAt = new Date().toISOString();
    const groupName = name.trim();
    const membersData = members.map((m) => ({
      id: crypto.randomUUID(),
      name: m.name,
      avatarColor: generateAvatarColor(m.name),
      contact: undefined,
      createdAt,
    }));

    // Create group with members
    addGroup({
      name: groupName,
      currency: "PHP",
      createdAt,
      members: membersData,
      expenses: [],
      settlements: [],
    });

    // Find the newly created group (by name and timestamp)
    const groups = useStore.getState().groups;
    const newGroup = groups.find(
      (g) => g.name === groupName && g.createdAt === createdAt
    );
    
    if (newGroup) {
      router.push(`/groups/${newGroup.id}`);
    } else {
      router.push("/groups");
    }
  };

  return (
    <div className="min-h-screen pt-16 pb-20">
      <Header title="new group" backHref="/groups" />
      <main className="p-5">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                group name <span className="text-[#FCD34D]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`w-full px-4 py-3.5 bg-[#1C1C1E] border rounded-2xl text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all ${
                  nameExists && name.trim()
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-[#3A3A3C] focus:ring-[#FCD34D] focus:border-[#FCD34D]"
                }`}
                placeholder="e.g., weekend trip"
              />
              {nameExists && name.trim() && (
                <p className="text-red-400 text-xs mt-1.5">this group name already exists</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                members <span className="text-[#FCD34D]">*</span>
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddMember();
                    }
                  }}
                  className={`flex-1 min-w-0 px-4 py-3.5 bg-[#1C1C1E] border rounded-2xl text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all ${
                    memberNameExists
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-[#3A3A3C] focus:ring-[#FCD34D] focus:border-[#FCD34D]"
                  }`}
                  placeholder="member name"
                />
                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={!memberName.trim() || memberNameExists}
                  className="flex-shrink-0 px-4 sm:px-6 py-3.5 bg-[#1C1C1E] border border-[#3A3A3C] hover:bg-[#2C2C2E] hover:border-[#4A4A4C] disabled:opacity-50 disabled:cursor-not-allowed text-gray-200 rounded-2xl transition-all font-semibold active:scale-95 whitespace-nowrap"
                >
                  add
                </button>
              </div>
              
              {members.length > 0 && (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-[#1C1C1E] border border-[#3A3A3C] rounded-xl"
                    >
                      <span className="text-gray-100">{member.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-400 hover:text-red-300 text-sm font-medium"
                      >
                        remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {memberNameExists && (
                <p className="text-red-400 text-xs mt-1.5">this member name already exists</p>
              )}
              {members.length < 2 && (
                <p className="text-sm text-gray-500 mt-2">
                  add at least 2 members to create a group
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-5 py-3.5 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-gray-300 rounded-2xl transition-all font-semibold active:scale-95"
              >
                cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || members.length < 2 || nameExists}
                className="flex-1 px-5 py-3.5 bg-[#FCD34D] hover:bg-[#FBBF24] disabled:opacity-50 disabled:cursor-not-allowed text-[#1C1C1E] rounded-2xl transition-all font-bold active:scale-95 shadow-lg shadow-[#FCD34D]/20"
              >
                create group
              </button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}

