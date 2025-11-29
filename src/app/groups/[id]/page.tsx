"use client";

import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import Header from "@/components/Header";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import Link from "next/link";
import { Plus, Sparkles, Share2, ArrowRight, Send, Eye } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/format";
import { computeNets, suggestSettlements, computePairwiseDebts } from "@/utils/groups";
import { createGroupGist } from "@/utils/share";
import { useMemo, useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const groups = useStore((state) => state.groups);
  const addSettlement = useStore((state) => state.addSettlement);
  const group = groups.find((g) => g.id === params.id as string);
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleTo, setSettleTo] = useState<string | null>(null);
  const shareUrlRef = useRef<HTMLInputElement>(null);

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
    
    // Calculate net pairwise debts (only show one direction per pair)
    group.members.forEach((otherMember) => {
      if (otherMember.id === selectedMemberId) return;
      
      const debtFromOther = pairwiseDebts[otherMember.id]?.[selectedMemberId] || 0;
      const debtToOther = pairwiseDebts[selectedMemberId]?.[otherMember.id] || 0;
      
      // Calculate net debt (positive means otherMember owes selectedMember, negative means selectedMember owes otherMember)
      const netDebt = debtFromOther - debtToOther;
      
      if (Math.abs(netDebt) > 0.01) {
        if (netDebt > 0) {
          // Other member owes selected member
          breakdown.push({ memberId: otherMember.id, amount: netDebt, type: "owes" });
        } else {
          // Selected member owes other member
          breakdown.push({ memberId: otherMember.id, amount: Math.abs(netDebt), type: "owed" });
        }
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
          group.readOnly ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FCD34D]/20 border border-[#FCD34D]/30 rounded-lg">
              <Eye className="w-4 h-4 text-[#FCD34D]" />
              <span className="text-xs font-semibold text-[#FCD34D]">read-only</span>
            </div>
          ) : (
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
              onClick={async () => {
                if (!group) return;
                setIsGeneratingShare(true);
                try {
                  // Create paste and get shareable URL
                  const shareUrlResult = await createGroupGist(group);
                  
                  if (!shareUrlResult) {
                    alert("Failed to generate share link. Please try again.");
                    setIsGeneratingShare(false);
                    return;
                  }
                  
                          // The API route already returns our app URL, so use it directly
                          setShareUrl(shareUrlResult);
                  setShowShare(true);
                } catch (error) {
                  console.error("Error generating share URL:", error);
                  const errorMessage = error instanceof Error ? error.message : "Failed to generate share link. Please try again.";
                  alert(errorMessage);
                } finally {
                  setIsGeneratingShare(false);
                }
              }}
              disabled={isGeneratingShare}
              className="p-2.5 hover:bg-[#2C2C2E] rounded-xl transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="share group"
            >
              <Share2 className="w-5 h-5 text-[#FCD34D]" />
            </button>
              <Link
                href={`/groups/${group.id}/expense/new`}
                className="p-2.5 hover:bg-[#2C2C2E] rounded-xl transition-colors active:scale-95"
                title="add expense"
              >
                <Plus className="w-6 h-6 text-[#FCD34D]" />
              </Link>
            </div>
          )
        }
      />

      <main className="p-5 space-y-6">
        {/* Read-only Banner for Shared Groups */}
        {group.readOnly && (
          <Card className="bg-[#FCD34D]/10 border-[#FCD34D]/30">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-[#FCD34D]" />
              <div>
                <p className="text-sm font-semibold text-[#FCD34D]">read-only mode</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  this is a shared group. you cannot make changes to this group.
                </p>
              </div>
            </div>
          </Card>
        )}

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

        {/* Settlement Suggestions - Show below members for read-only groups */}
        {group.readOnly && suggestions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-50 mb-4">suggested settlements</h2>
            <Card>
              <p className="text-gray-400 text-sm mb-4">
                minimal transfers needed to settle all balances:
              </p>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => {
                  const fromMember = group.members.find((m) => m.id === suggestion.from);
                  const toMember = group.members.find((m) => m.id === suggestion.to);
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
            </Card>
          </div>
        )}

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

      {/* Settlement Suggestions Modal - Only for non-read-only groups */}
      {!group?.readOnly && (
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
      )}

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
                {memberBreakdown.filter((item) => item.type === "owes").length > 0 && (
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">
                    {group?.readOnly ? "receive from" : "receive from"}
                  </h3>
                )}
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
                          <div>
                            <p className="text-gray-50 font-medium text-sm">{otherMember.name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              {otherMember.name} <ArrowRight className="w-3 h-3" /> {selectedMember?.name}
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-green-400">
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    );
                  })}
                
                {memberBreakdown.filter((item) => item.type === "owed").length > 0 && (
                  <div className={memberBreakdown.filter((item) => item.type === "owes").length > 0 ? "border-t border-[#3A3A3C] pt-2 mt-2" : ""}>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">should pay</h3>
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
                              <div>
                                <p className="text-gray-50 font-medium text-sm">{otherMember.name}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  {selectedMember?.name} <ArrowRight className="w-3 h-3" /> {otherMember.name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="font-bold text-red-400">
                                {formatCurrency(item.amount)}
                              </p>
                              {!group?.readOnly && (
                                <button
                                  onClick={() => {
                                    setSettleTo(item.memberId);
                                    setSettleAmount(item.amount.toFixed(2));
                                  }}
                                  className="px-3 py-1.5 bg-[#FCD34D] hover:bg-[#FBBF24] text-[#1C1C1E] rounded-lg text-xs font-semibold transition-colors active:scale-95"
                                >
                                  settle
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
              
              {/* Footer totals */}
              {(memberBreakdown.filter((item) => item.type === "owes").length > 0 ||
                memberBreakdown.filter((item) => item.type === "owed").length > 0) && (
                <div className="pt-4 border-t border-[#3A3A3C] space-y-2">
                  {memberBreakdown.filter((item) => item.type === "owes").length > 0 && (
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
                  )}
                  {memberBreakdown.filter((item) => item.type === "owed").length > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-gray-300 font-semibold">total to pay:</p>
                      <p className="text-red-400 font-bold text-lg">
                        {formatCurrency(
                          memberBreakdown
                            .filter((item) => item.type === "owed")
                            .reduce((sum, item) => sum + item.amount, 0)
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Share Group Modal */}
      <Modal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        title="share group"
      >
        {group && (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm mb-4">
              share this link with your group members. they can view the group details in read-only mode.
            </p>
            
            {typeof window !== "undefined" && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300">
                    shareable link
                  </label>
                  <div className="flex gap-2">
                    <input
                      ref={shareUrlRef}
                      type="text"
                      readOnly
                      value={shareUrl || (isGeneratingShare ? "generating link..." : "click share button in header to generate link")}
                      className="flex-1 px-4 py-3 bg-[#1C1C1E] border border-[#3A3A3C] rounded-xl text-gray-100 text-sm focus:outline-none"
                    />
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        if (!shareUrl) return;
                        
                        // Check if Web Share API is supported (mobile devices)
                        if (typeof navigator !== "undefined" && navigator.share) {
                          try {
                            await navigator.share({
                              title: `${group.name} - Group Share`,
                              text: `Check out this group: ${group.name}`,
                              url: shareUrl,
                            });
                          } catch (err) {
                            // User cancelled or error occurred
                            if ((err as Error).name !== "AbortError") {
                              console.error("Error sharing:", err);
                              // Fallback to copy if share fails
                              if (shareUrlRef.current) {
                                shareUrlRef.current.select();
                                shareUrlRef.current.setSelectionRange(0, 99999);
                                try {
                                  await navigator.clipboard.writeText(shareUrl);
                                } catch {
                                  document.execCommand("copy");
                                }
                              }
                            }
                          }
                        } else {
                          // Fallback for browsers that don't support Web Share API (desktop)
                          if (shareUrlRef.current) {
                            shareUrlRef.current.select();
                            shareUrlRef.current.setSelectionRange(0, 99999);
                            try {
                              if (typeof navigator !== "undefined" && navigator.clipboard) {
                                await navigator.clipboard.writeText(shareUrl);
                                const button = e.currentTarget;
                                const originalText = button.textContent;
                                if (button.textContent) {
                                  button.textContent = "copied!";
                                  setTimeout(() => {
                                    button.textContent = originalText;
                                  }, 2000);
                                }
                              } else {
                                throw new Error("Clipboard not available");
                              }
                            } catch {
                              // Fallback for older browsers
                              document.execCommand("copy");
                              const button = e.currentTarget;
                              const originalText = button.textContent;
                              if (button.textContent) {
                                button.textContent = "copied!";
                                setTimeout(() => {
                                  button.textContent = originalText;
                                }, 2000);
                              }
                            }
                          }
                        }
                      }}
                      disabled={!shareUrl}
                      className="px-4 py-3 bg-[#FCD34D] hover:bg-[#FBBF24] disabled:opacity-50 disabled:cursor-not-allowed text-[#1C1C1E] rounded-xl font-semibold transition-all active:scale-95 whitespace-nowrap flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      share
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-[#3A3A3C]">
                  <label className="block text-sm font-semibold text-gray-300 text-center">
                    scan qr code
                  </label>
                  <div className="flex justify-center p-4 bg-white rounded-xl">
                    {shareUrl ? (
                      <QRCodeSVG
                        value={shareUrl}
                        size={200}
                        level="M"
                        includeMargin={true}
                      />
                    ) : (
                      <div className="text-center p-8 text-gray-500">
                        <p className="text-sm">generate link to see qr code</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowShare(false)}
                className="flex-1 px-4 py-2 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-gray-300 rounded-xl transition-all font-semibold active:scale-95"
              >
                close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

