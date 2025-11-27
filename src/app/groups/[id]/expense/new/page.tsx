"use client";

import { useState, FormEvent, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import Header from "@/components/Header";
import Card from "@/components/Card";
import { formatCurrency } from "@/utils/format";
import { computeNets } from "@/utils/groups";
import type { GroupMember } from "@/types";

export default function NewExpensePage() {
  const params = useParams();
  const router = useRouter();
  const groups = useStore((state) => state.groups);
  const addExpense = useStore((state) => state.addExpense);
  
  const group = groups.find((g) => g.id === params.id as string);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paidBy, setPaidBy] = useState<Record<string, number>>({});
  const [splitBetween, setSplitBetween] = useState<Record<string, number>>({});
  const [splitEqually, setSplitEqually] = useState(true);
  const [notes, setNotes] = useState("");

  const currentUserId = group?.members[0]?.id || ""; // Default to first member for now

  // Initialize paidBy with current user when amount changes
  useMemo(() => {
    if (group && group.members.length > 0 && currentUserId && amount) {
      const amountNum = parseFloat(amount);
      if (amountNum > 0 && Object.keys(paidBy).length === 0) {
        setPaidBy({ [currentUserId]: amountNum });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, group, currentUserId]);

  const handlePaidByChange = (memberId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPaidBy((prev) => {
      const updated = { ...prev, [memberId]: numValue };
      // Remove zero values
      Object.keys(updated).forEach((key) => {
        if (updated[key] === 0) delete updated[key];
      });
      return updated;
    });
  };

  const handleSplitChange = (memberId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setSplitBetween((prev) => {
      const updated = { ...prev, [memberId]: numValue };
      Object.keys(updated).forEach((key) => {
        if (updated[key] === 0) delete updated[key];
      });
      return updated;
    });
  };

  const handleSplitEqually = () => {
    if (!group) return;
    const totalAmount = parseFloat(amount) || 0;
    const selectedMembers = Object.keys(splitBetween).filter(
      (id) => splitBetween[id] > 0
    );
    const membersToSplit = selectedMembers.length || group.members.length;
    const perPerson = totalAmount / membersToSplit;

    if (selectedMembers.length > 0) {
      const newSplit: Record<string, number> = {};
      selectedMembers.forEach((id) => {
        newSplit[id] = perPerson;
      });
      setSplitBetween(newSplit);
    } else {
      const newSplit: Record<string, number> = {};
      group.members.forEach((member) => {
        newSplit[member.id] = perPerson;
      });
      setSplitBetween(newSplit);
    }
  };

  // Update split equally when amount or splitEqually changes
  useMemo(() => {
    if (splitEqually && amount && group) {
      const totalAmount = parseFloat(amount);
      if (totalAmount > 0) {
        const selectedMembers = Object.keys(splitBetween).filter(
          (id) => splitBetween[id] > 0
        );
        const membersToSplit = selectedMembers.length || group.members.length;
        const perPerson = totalAmount / membersToSplit;

        const newSplit: Record<string, number> = {};
        if (selectedMembers.length > 0) {
          selectedMembers.forEach((id) => {
            newSplit[id] = perPerson;
          });
        } else {
          group.members.forEach((member) => {
            newSplit[member.id] = perPerson;
          });
        }
        setSplitBetween(newSplit);
      }
    }
  }, [amount, splitEqually, group]);

  const paidByTotal = Object.values(paidBy).reduce((sum, val) => sum + val, 0);
  const splitTotal = Object.values(splitBetween).reduce((sum, val) => sum + val, 0);
  const amountNum = parseFloat(amount) || 0;

  const previewNets = useMemo(() => {
    if (!group || !amountNum) return [];
    const tempExpense: Expense = {
      id: "temp",
      groupId: group.id,
      description,
      amount: amountNum,
      paidBy,
      splitBetween,
      date: new Date(date).toISOString(),
      createdBy: currentUserId,
    };
    const tempGroup = {
      ...group,
      expenses: [...group.expenses, tempExpense],
    };
    return computeNets(tempGroup);
  }, [group, amountNum, paidBy, splitBetween, description, date, currentUserId]);

  if (!group) {
    return (
      <div className="min-h-screen pb-20">
        <Header title="add expense" backHref={`/groups/${params.id}`} />
        <main className="p-5">
          <Card>
            <p className="text-gray-400 text-center py-8">group not found</p>
          </Card>
        </main>
      </div>
    );
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amountNum || amountNum <= 0) return;
    if (Math.abs(paidByTotal - amountNum) > 0.01) return;
    if (Math.abs(splitTotal - amountNum) > 0.01) return;
    if (Object.keys(paidBy).length === 0) return;
    if (Object.keys(splitBetween).length === 0) return;

    addExpense(group.id, {
      description: description.trim(),
      amount: amountNum,
      paidBy,
      splitBetween,
      date: new Date(date).toISOString(),
      notes: notes.trim() || undefined,
      createdBy: currentUserId,
    });

    router.push(`/groups/${group.id}`);
  };

  return (
    <div className="min-h-screen pb-20">
      <Header title="add expense" backHref={`/groups/${params.id}`} />
      <main className="p-5 space-y-6">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                description <span className="text-[#FCD34D]">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-[#1C1C1E] border border-[#3A3A3C] rounded-2xl text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-[#FCD34D] transition-all"
                placeholder="what was this expense for?"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                amount <span className="text-[#FCD34D]">*</span>
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (splitEqually) {
                    const newAmount = parseFloat(e.target.value) || 0;
                    if (newAmount > 0 && group) {
                      const selectedMembers = Object.keys(splitBetween).filter(
                        (id) => splitBetween[id] > 0
                      );
                      const membersToSplit = selectedMembers.length || group.members.length;
                      const perPerson = newAmount / membersToSplit;
                      const newSplit: Record<string, number> = {};
                      if (selectedMembers.length > 0) {
                        selectedMembers.forEach((id) => {
                          newSplit[id] = perPerson;
                        });
                      } else {
                        group.members.forEach((member) => {
                          newSplit[member.id] = perPerson;
                        });
                      }
                      setSplitBetween(newSplit);
                    }
                  }
                  // Update paid by if only one payer
                  if (Object.keys(paidBy).length === 1) {
                    const payerId = Object.keys(paidBy)[0];
                    setPaidBy({ [payerId]: parseFloat(e.target.value) || 0 });
                  }
                }}
                required
                className="w-full px-4 py-3.5 bg-[#1C1C1E] border border-[#3A3A3C] rounded-2xl text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-[#FCD34D] transition-all"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#1C1C1E] border border-[#3A3A3C] rounded-2xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-[#FCD34D] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                paid by <span className="text-[#FCD34D]">*</span>
                {Math.abs(paidByTotal - amountNum) > 0.01 && (
                  <span className="text-red-400 text-xs ml-2">
                    (total: {formatCurrency(paidByTotal)})
                  </span>
                )}
              </label>
              <div className="space-y-2">
                {group.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-sm text-gray-400">{member.name}</label>
                    </div>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={paidBy[member.id] || ""}
                      onChange={(e) => handlePaidByChange(member.id, e.target.value)}
                      className="w-32 px-3 py-2 bg-[#1C1C1E] border border-[#3A3A3C] rounded-xl text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-[#FCD34D] transition-all"
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-sm font-semibold text-gray-300">
                  split between <span className="text-[#FCD34D]">*</span>
                  {Math.abs(splitTotal - amountNum) > 0.01 && (
                    <span className="text-red-400 text-xs ml-2">
                      (total: {formatCurrency(splitTotal)})
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSplitEqually(!splitEqually);
                    if (!splitEqually && amountNum > 0) {
                      handleSplitEqually();
                    }
                  }}
                  className="text-xs text-[#FCD34D] hover:underline"
                >
                  {splitEqually ? "custom split" : "split equally"}
                </button>
              </div>
              <div className="space-y-2">
                {group.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!!splitBetween[member.id] && splitBetween[member.id] > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (splitEqually && amountNum > 0) {
                            const selectedCount = Object.keys(splitBetween).filter(
                              (id) => splitBetween[id] > 0
                            ).length + 1;
                            const perPerson = amountNum / selectedCount;
                            setSplitBetween((prev) => {
                              const updated = { ...prev };
                              Object.keys(updated).forEach((id) => {
                                updated[id] = perPerson;
                              });
                              updated[member.id] = perPerson;
                              return updated;
                            });
                          } else {
                            setSplitBetween((prev) => ({
                              ...prev,
                              [member.id]: splitBetween[member.id] || amountNum / group.members.length,
                            }));
                          }
                        } else {
                          setSplitBetween((prev) => {
                            const updated = { ...prev };
                            delete updated[member.id];
                            if (splitEqually && amountNum > 0) {
                              const remainingCount = Object.keys(updated).filter(
                                (id) => updated[id] > 0
                              ).length;
                              if (remainingCount > 0) {
                                const perPerson = amountNum / remainingCount;
                                Object.keys(updated).forEach((id) => {
                                  updated[id] = perPerson;
                                });
                              }
                            }
                            return updated;
                          });
                        }
                      }}
                      className="w-4 h-4 rounded border-[#3A3A3C] bg-[#1C1C1E] text-[#FCD34D] focus:ring-[#FCD34D]"
                    />
                    <div className="flex-1">
                      <label className="text-sm text-gray-400">{member.name}</label>
                    </div>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={splitBetween[member.id] || ""}
                      onChange={(e) => {
                        handleSplitChange(member.id, e.target.value);
                        setSplitEqually(false);
                      }}
                      disabled={splitEqually}
                      className="w-32 px-3 py-2 bg-[#1C1C1E] border border-[#3A3A3C] rounded-xl text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-[#FCD34D] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3.5 bg-[#1C1C1E] border border-[#3A3A3C] rounded-2xl text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-[#FCD34D] transition-all resize-none"
                placeholder="optional notes"
              />
            </div>

            {/* Preview */}
            {previewNets.length > 0 && amountNum > 0 && (
              <Card className="bg-[#1C1C1E] border-[#FCD34D]/20">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">balance preview</h3>
                <div className="space-y-2">
                  {previewNets.map((net) => {
                    const member = group.members.find((m) => m.id === net.memberId);
                    if (!member) return null;
                    const currentNet = computeNets(group).find((n) => n.memberId === member.id)?.net || 0;
                    const change = net.net - currentNet;
                    
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-400">{member.name}</span>
                        <span
                          className={`font-medium ${
                            Math.abs(change) < 0.01
                              ? "text-gray-500"
                              : change > 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {change > 0 ? "+" : ""}
                          {formatCurrency(change)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

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
                disabled={
                  !description.trim() ||
                  !amountNum ||
                  Math.abs(paidByTotal - amountNum) > 0.01 ||
                  Math.abs(splitTotal - amountNum) > 0.01 ||
                  Object.keys(paidBy).length === 0 ||
                  Object.keys(splitBetween).length === 0
                }
                className="flex-1 px-5 py-3.5 bg-[#FCD34D] hover:bg-[#FBBF24] disabled:opacity-50 disabled:cursor-not-allowed text-[#1C1C1E] rounded-2xl transition-all font-bold active:scale-95 shadow-lg shadow-[#FCD34D]/20"
              >
                add expense
              </button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}

