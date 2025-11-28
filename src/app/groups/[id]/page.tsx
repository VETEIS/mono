"use client";

import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import Header from "@/components/Header";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import Link from "next/link";
import { Plus, Download, Upload, Sparkles, MoreVertical } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/format";
import { computeNets, suggestSettlements, computePairwiseDebts } from "@/utils/groups";
import { useMemo, useState, useRef } from "react";

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const groups = useStore((state) => state.groups);
  const addSettlement = useStore((state) => state.addSettlement);
  const exportGroup = useStore((state) => state.exportGroup);
  const importGroup = useStore((state) => state.importGroup);
  const group = groups.find((g) => g.id === params.id as string);
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleTo, setSettleTo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nets = useMemo(() => {
    if (!group) return [];
    return computeNets(group);
  }, [group]);

  const sortedNets = useMemo(() => {
    return [...nets].sort((a, b) => b.net - a.net);
  }, [nets]);

  const allActivities = useMemo(() => {
    if (!group) return [];
    const activities: Array<{
      id: string;
      type: "expense" | "settlement";
      date: string;
      data: any;
    }> = [];

    group.expenses.forEach((exp) => {
      activities.push({ id: exp.id, type: "expense", date: exp.date, data: exp });
    });

    group.settlements.forEach((sett) => {
      activities.push({ id: sett.id, type: "settlement", date: sett.date, data: sett });
    });

    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [group]);

  const suggestions = useMemo(() => {
    if (!group) return [];
    return suggestSettlements(group);
  }, [group]);

  const pairwiseDebts = useMemo(() => {
    if (!group) return {};
    return computePairwiseDebts(group);
  }, [group]);

  const selectedMember = useMemo(() => {
    if (!group || !selectedMemberId) return null;
    return group.members.find((m) => m.id === selectedMemberId);
  }, [group, selectedMemberId]);

  const memberBreakdown = useMemo(() => {
    if (!group || !selectedMemberId) return [];
    
    const breakdown: Array<{ memberId: string; amount: number; type: "owes" | "owed" }> = [];
    
    // Check debts from other members' perspective - who owes the selected member
    group.members.forEach((otherMember) => {
      if (otherMember.id === selectedMemberId) return;
      
      // Check if otherMember owes selectedMember
      const debt = pairwiseDebts[otherMember.id]?.[selectedMemberId];
      if (debt && debt > 0.01) {
        breakdown.push({ memberId: otherMember.id, amount: debt, type: "owes" });
      }
      
      // Check if selectedMember owes otherMember (shown as "owed by")
      const credit = pairwiseDebts[selectedMemberId]?.[otherMember.id];
      if (credit && credit > 0.01) {
        breakdown.push({ memberId: otherMember.id, amount: credit, type: "owed" });
      }
    });
    
    return breakdown.sort((a, b) => b.amount - a.amount);
  }, [group, selectedMemberId, pairwiseDebts]);

  const handleApplySuggestions = () => {
    if (!group) return;
    const currentUserId = group.members[0]?.id || "";
    
    suggestions.forEach((suggestion) => {
      addSettlement(group.id, {
        from: suggestion.from,
        to: suggestion.to,
        amount: suggestion.amount,
        date: new Date().toISOString(),
        createdBy: currentUserId,
        notes: "applied from settlement suggestions",
      });
    });
    
    setShowSuggestions(false);
  };

  const handleSettleDebt = () => {
    if (!group || !selectedMemberId || !settleTo || !settleAmount) return;
    const amountNum = parseFloat(settleAmount);
    if (amountNum <= 0) return;
    
    const currentUserId = group.members[0]?.id || "";
    const debt = pairwiseDebts[selectedMemberId]?.[settleTo];
    if (!debt || debt <= 0) return;
    
    const settleAmountNum = Math.min(amountNum, debt);
    
    addSettlement(group.id, {
      from: selectedMemberId,
      to: settleTo,
      amount: settleAmountNum,
      date: new Date().toISOString(),
      createdBy: currentUserId,
      notes: `settled debt to ${group.members.find((m) => m.id === settleTo)?.name || "member"}`,
    });
    
    setSettleAmount("");
    setSettleTo(null);
  };

  const handleExport = () => {
    if (!group) return;
    const json = exportGroup(group.id);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${group.name.replace(/\s+/g, "_")}_group.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        importGroup(json);
        setShowImport(false);
      } catch (error) {
        alert("failed to import group. please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  if (!group) {
    return (
      <div className="min-h-screen pb-20">
        <Header title="group" backHref="/groups" />
        <main className="p-5">
          <Card>
            <p className="text-gray-400 text-center py-8">group not found</p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header
        title={group.name}
        backHref="/groups"
        action={
          <div className="flex items-center gap-2">
            {suggestions.length > 0 && (
              <button
                onClick={() => setShowSuggestions(true)}
                className="p-2.5 hover:bg-[#2C2C2E] rounded-xl transition-colors active:scale-95"
                title="suggest settlements"
              >
                <Sparkles className="w-5 h-5 text-[#FCD34D]" />
              </button>
            )}
            <button
              onClick={() => setShowExport(true)}
              className="p-2.5 hover:bg-[#2C2C2E] rounded-xl transition-colors active:scale-95"
              title="export/import"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
            <Link
              href={`/groups/${group.id}/expense/new`}
              className="p-2.5 hover:bg-[#2C2C2E] rounded-xl transition-colors active:scale-95"
              title="add expense"
            >
              <Plus className="w-6 h-6 text-[#FCD34D]" />
            </Link>
          </div>
        }
      />

      <main className="p-5 space-y-6">
        {/* Members & Balances */}
        <div>
          <h2 className="text-xl font-bold text-gray-50 mb-4">members</h2>
          <Card>
            {sortedNets.length === 0 ? (
              <p className="text-gray-400 text-center py-4">no members</p>
            ) : (
              <div className="space-y-3">
                {sortedNets.map((net) => {
                  const member = group.members.find((m) => m.id === net.memberId);
                  if (!member) return null;

                  // Find who owes this member (if net > 0) or who this member owes (if net < 0)
                  let labelText = "settled";
                  if (net.net > 0.01) {
                    // This member is owed - find members with negative nets
                    const debtors = sortedNets
                      .filter((n) => n.net < -0.01 && n.memberId !== net.memberId)
                      .map((n) => group.members.find((m) => m.id === n.memberId)?.name)
                      .filter(Boolean) as string[];
                    if (debtors.length > 0) {
                      labelText = `owed by ${debtors.join(", ")}`;
                    } else {
                      labelText = "owed";
                    }
                  } else if (net.net < -0.01) {
                    // This member owes - find members with positive nets
                    const creditors = sortedNets
                      .filter((n) => n.net > 0.01 && n.memberId !== net.memberId)
                      .map((n) => group.members.find((m) => m.id === n.memberId)?.name)
                      .filter(Boolean) as string[];
                    if (creditors.length > 0) {
                      labelText = `owes ${creditors.join(", ")}`;
                    } else {
                      labelText = "owes";
                    }
                  }

                  return (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMemberId(member.id)}
                      className="w-full flex items-center justify-between p-3 bg-[#1C1C1E] border border-[#3A3A3C] rounded-xl hover:bg-[#2C2C2E] transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: member.avatarColor || "#FCD34D" }}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-50 font-medium">
                          {member.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            Math.abs(net.net) < 0.01
                              ? "text-gray-400"
                              : net.net > 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {net.net > 0 ? "+" : ""}
                          {formatCurrency(net.net)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {labelText}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Activities */}
        <div>
          <h2 className="text-xl font-bold text-gray-50 mb-4">activity</h2>
          <Card>
            {allActivities.length === 0 ? (
              <p className="text-gray-400 text-center py-4">no activity yet</p>
            ) : (
              <div className="space-y-3">
                {allActivities.slice(0, 10).map((activity) => {
                  if (activity.type === "expense") {
                    const expense = activity.data;
                    const paidByNames = Object.keys(expense.paidBy)
                      .map((id) => group.members.find((m) => m.id === id)?.name || "unknown")
                      .join(", ");
                    
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 bg-[#1C1C1E] border border-[#3A3A3C] rounded-xl"
                      >
                        <div className="flex-1">
                          <p className="text-gray-50 font-medium">
                            {expense.description || "expense"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            paid by {paidByNames} • {formatDate(expense.date)}
                          </p>
                        </div>
                        <p className="text-gray-100 font-bold">{formatCurrency(expense.amount)}</p>
                      </div>
                    );
                  } else {
                    const settlement = activity.data;
                    const fromMember = group.members.find((m) => m.id === settlement.from);
                    const toMember = group.members.find((m) => m.id === settlement.to);
                    
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 bg-[#1C1C1E] border border-[#3A3A3C] rounded-xl"
                      >
                        <div className="flex-1">
                          <p className="text-gray-50 font-medium">
                            {fromMember?.name || "unknown"} → {toMember?.name || "unknown"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            payment • {formatDate(settlement.date)}
                          </p>
                        </div>
                        <p className="text-green-400 font-bold">
                          {formatCurrency(settlement.amount)}
                        </p>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* Settlement Suggestions Modal */}
      <Modal
        isOpen={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        title="suggested settlements"
      >
        <div className="space-y-4">
          <p className="text-gray-300 text-sm mb-4">
            these are the minimal transfers needed to settle all balances:
          </p>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => {
              const fromMember = group?.members.find((m) => m.id === suggestion.from);
              const toMember = group?.members.find((m) => m.id === suggestion.to);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-[#1C1C1E] border border-[#3A3A3C] rounded-xl"
                >
                  <div>
                    <p className="text-gray-50 font-medium">
                      {fromMember?.name || "unknown"} → {toMember?.name || "unknown"}
                    </p>
                  </div>
                  <p className="text-green-400 font-bold">
                    {formatCurrency(suggestion.amount)}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowSuggestions(false)}
              className="flex-1 px-4 py-2 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-gray-300 rounded-xl transition-all font-semibold active:scale-95"
            >
              cancel
            </button>
            <button
              onClick={handleApplySuggestions}
              className="flex-1 px-4 py-2 bg-[#FCD34D] hover:bg-[#FBBF24] text-[#1C1C1E] rounded-xl transition-all font-bold active:scale-95"
            >
              apply suggestions
            </button>
          </div>
        </div>
      </Modal>

      {/* Export Modal */}
      <Modal isOpen={showExport} onClose={() => setShowExport(false)} title="export group">
        <div className="space-y-4">
          <p className="text-gray-300 text-sm mb-4">
            export this group as a JSON file for backup or sharing.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowExport(false)}
              className="flex-1 px-4 py-2 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-gray-300 rounded-xl transition-all font-semibold active:scale-95"
            >
              cancel
            </button>
            <button
              onClick={handleExport}
              className="flex-1 px-4 py-2 bg-[#FCD34D] hover:bg-[#FBBF24] text-[#1C1C1E] rounded-xl transition-all font-bold active:scale-95 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              export
            </button>
            <button
              onClick={() => {
                setShowExport(false);
                setShowImport(true);
              }}
              className="flex-1 px-4 py-2 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-gray-300 rounded-xl transition-all font-semibold active:scale-95 flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              import
            </button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={showImport} onClose={() => setShowImport(false)} title="import group">
        <div className="space-y-4">
          <p className="text-gray-300 text-sm mb-4">
            import a group from a JSON file. this will add a new group to your groups list.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setShowImport(false)}
              className="flex-1 px-4 py-2 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-gray-300 rounded-xl transition-all font-semibold active:scale-95"
            >
              cancel
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 px-4 py-2 bg-[#FCD34D] hover:bg-[#FBBF24] text-[#1C1C1E] rounded-xl transition-all font-bold active:scale-95 flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              choose file
            </button>
          </div>
        </div>
      </Modal>

      {/* Member Breakdown Modal */}
      <Modal
        isOpen={selectedMemberId !== null}
        onClose={() => {
          setSelectedMemberId(null);
          setSettleAmount("");
          setSettleTo(null);
        }}
        title={selectedMember ? `${selectedMember.name}'s breakdown` : "member breakdown"}
      >
        <div className="space-y-4">
          {memberBreakdown.length === 0 ? (
            <p className="text-gray-400 text-center py-4">no debts or credits</p>
          ) : (
            <>
              <div className="space-y-2">
                {memberBreakdown
                  .filter((item) => item.type === "owes")
                  .map((item) => {
                    const otherMember = group?.members.find((m) => m.id === item.memberId);
                    if (!otherMember) return null;
                    
                    return (
                      <div
                        key={item.memberId}
                        className="flex items-center justify-between p-3 bg-[#1C1C1E] border border-[#3A3A3C] rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                            style={{ backgroundColor: otherMember.avatarColor || "#FCD34D" }}
                          >
                            {otherMember.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-gray-50 font-medium text-sm">{otherMember.name}</p>
                            <p className="text-xs text-gray-500">owes you</p>
                          </div>
                        </div>
                        <p className="font-bold text-green-400">
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    );
                  })}
                
                {memberBreakdown.filter((item) => item.type === "owed").length > 0 && (
                  <>
                    <div className="border-t border-[#3A3A3C] pt-2 mt-2">
                      {memberBreakdown
                        .filter((item) => item.type === "owed")
                        .map((item) => {
                          const otherMember = group?.members.find((m) => m.id === item.memberId);
                          if (!otherMember) return null;
                          
                          return (
                            <div
                              key={item.memberId}
                              className="flex items-center justify-between p-3 bg-[#1C1C1E] border border-[#3A3A3C] rounded-xl mb-2"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                                  style={{ backgroundColor: otherMember.avatarColor || "#FCD34D" }}
                                >
                                  {otherMember.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-gray-50 font-medium text-sm">{otherMember.name}</p>
                                  <p className="text-xs text-gray-500">owed by you</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="font-bold text-red-400">
                                  {formatCurrency(item.amount)}
                                </p>
                                <button
                                  onClick={() => {
                                    setSettleTo(item.memberId);
                                    setSettleAmount(item.amount.toFixed(2));
                                  }}
                                  className="px-3 py-1.5 bg-[#FCD34D] hover:bg-[#FBBF24] text-[#1C1C1E] rounded-lg text-xs font-semibold transition-colors active:scale-95"
                                >
                                  settle
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}
                
                {memberBreakdown.filter((item) => item.type === "owes").length > 0 && (
                  <div className="pt-3 border-t border-[#3A3A3C]">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-300 font-semibold">total to receive:</p>
                      <p className="text-green-400 font-bold text-lg">
                        {formatCurrency(
                          memberBreakdown
                            .filter((item) => item.type === "owes")
                            .reduce((sum, item) => sum + item.amount, 0)
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {settleTo && (
                <div className="pt-4 border-t border-[#3A3A3C] space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      settle amount
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={settleAmount}
                      onChange={(e) => setSettleAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#3A3A3C] rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-[#FCD34D] transition-all"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      settling to {group?.members.find((m) => m.id === settleTo)?.name || "member"}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSettleAmount("");
                        setSettleTo(null);
                      }}
                      className="flex-1 px-4 py-2 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-gray-300 rounded-xl transition-all font-semibold active:scale-95"
                    >
                      cancel
                    </button>
                    <button
                      onClick={handleSettleDebt}
                      disabled={!settleAmount || parseFloat(settleAmount) <= 0}
                      className="flex-1 px-4 py-2 bg-[#FCD34D] hover:bg-[#FBBF24] disabled:opacity-50 disabled:cursor-not-allowed text-[#1C1C1E] rounded-xl transition-all font-bold active:scale-95"
                    >
                      confirm
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

