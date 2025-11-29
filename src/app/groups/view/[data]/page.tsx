"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Header from "@/components/Header";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import { formatCurrency, formatDate, formatNameList, truncateName } from "@/utils/format";
import { computeNets, suggestSettlements, computePairwiseDebts } from "@/utils/groups";
import { fetchGroupFromGist } from "@/utils/share";
import { useStore } from "@/store/useStore";
import type { Group } from "@/types";
import { Eye, ArrowRight } from "lucide-react";

export default function GroupViewPage() {
  const params = useParams();
  const router = useRouter();
  const addGroup = useStore((state) => state.addGroup);
  const updateGroup = useStore((state) => state.updateGroup);
  const deleteGroup = useStore((state) => state.deleteGroup);
  const groups = useStore((state) => state.groups);
  const [group, setGroup] = useState<Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  useEffect(() => {
    const loadGroup = async () => {
      const encodedData = params.data as string;
      if (!encodedData) {
        setError("invalid share link");
        return;
      }

      // Clear any previous error
      setError(null);
      
      try {
        // Fetch group data from dpaste.com
        const decodedGroup = await fetchGroupFromGist(encodedData);
        
        if (!decodedGroup) {
          setError("invalid or corrupted share link");
          return;
        }
        
        // Mark as shared/read-only
        const sharedGroup: Group = {
          ...decodedGroup,
          readOnly: true,
          isShared: true,
        };
        
        // Clear any error and set group to show the content
        setError(null);
        setGroup(sharedGroup);
        
        // Get current groups state to check for duplicates
        const currentGroups = useStore.getState().groups;
        
        // Find ALL existing shared groups with the same name (to handle duplicates)
        const duplicateSharedGroups = currentGroups.filter(
          (g) => g.name.toLowerCase().trim() === sharedGroup.name.toLowerCase().trim() && g.isShared
        );
        
        if (duplicateSharedGroups.length > 0) {
          // Delete all duplicates first
          duplicateSharedGroups.forEach((dup) => {
            deleteGroup(dup.id);
          });
          
          // Then add the new one (this ensures we always have the latest data)
          const { id, ...groupWithoutId } = sharedGroup;
          addGroup(groupWithoutId);
        } else {
          // Add as new group if no shared group with same name exists
          const { id, ...groupWithoutId } = sharedGroup;
          addGroup(groupWithoutId);
        }
      } catch (err) {
        console.error("Error loading group:", err);
        setError("failed to load group data");
      }
    };
    
    loadGroup();
  }, [params.data, addGroup, updateGroup, deleteGroup]);

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

  const selectedMember = group?.members.find((m) => m.id === selectedMemberId);

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

  // Show loading state only if we don't have a group and there's no error yet
  if (!group && !error) {
    return (
      <div className="min-h-screen pt-16 pb-20">
        <Header title="group view" backHref="/groups" />
        <main className="p-5">
          <Card>
            <div className="text-gray-400 text-center py-10">
              <p className="text-sm">loading...</p>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  // Show error only if we have an error and no group
  if (error && !group) {
    return (
      <div className="min-h-screen pt-16 pb-20">
        <Header title="group view" backHref="/groups" />
        <main className="p-5">
          <Card>
            <div className="text-gray-400 text-center py-10">
              <p className="text-lg mb-2">{error}</p>
              <p className="text-sm">please request a new share link from the group owner.</p>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  // If we have a group, show it (even if there was a transient error)
  if (!group) {
    return null;
  }

  return (
    <div className="min-h-screen pt-16 pb-20">
      <Header
        title={group.name}
        backHref="/groups"
        action={
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FCD34D]/20 border border-[#FCD34D]/30 rounded-lg">
            <Eye className="w-4 h-4 text-[#FCD34D]" />
            <span className="text-xs font-semibold text-[#FCD34D]">view only</span>
          </div>
        }
      />

      <main className="p-5 space-y-6">
        {/* View Only Banner */}
        <Card className="bg-[#FCD34D]/10 border-[#FCD34D]/30">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-[#FCD34D]" />
            <div>
              <p className="text-sm font-semibold text-[#FCD34D]">read-only mode</p>
              <p className="text-xs text-gray-400 mt-0.5">
                this is a shared link. you cannot make changes to this group.
              </p>
            </div>
          </div>
        </Card>

        {/* Members & Balances */}
        <div>
          <h2 className="text-xl font-bold text-gray-50 mb-4">members</h2>
          <Card>
            {sortedNets.length === 0 ? (
              <p className="text-gray-400 text-center py-4">no members</p>
            ) : (
              <div className="space-y-3">
                {sortedNets.map((net, index) => {
                  const member = group.members.find((m) => m.id === net.memberId);
                  if (!member) return null;

                  // Calculate count of members who owe this member and who this member owes
                  let debtorsCount = 0;
                  let creditorsCount = 0;
                  
                  group.members.forEach((otherMember) => {
                    if (otherMember.id === member.id) return;
                    
                    const debtFromOther = pairwiseDebts[otherMember.id]?.[member.id] || 0;
                    const debtToOther = pairwiseDebts[member.id]?.[otherMember.id] || 0;
                    const netDebt = debtFromOther - debtToOther;
                    
                    if (netDebt > 0.01) {
                      // Other member owes this member
                      debtorsCount++;
                    } else if (netDebt < -0.01) {
                      // This member owes other member
                      creditorsCount++;
                    }
                  });

                  return (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMemberId(member.id)}
                      className="w-full flex items-center justify-between p-3 bg-[#1C1C1E] border border-[#3A3A3C] rounded-xl hover:bg-[#2C2C2E] transition-colors text-left"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 font-medium w-6">
                          {index + 1}.
                        </span>
                        <span className="text-gray-50 font-medium">{truncateName(member.name, 10)}</span>
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
                        <div className="flex items-center gap-1.5 justify-end">
                          {debtorsCount === 0 && creditorsCount === 0 ? (
                            <span className="text-xs text-gray-500">settled</span>
                          ) : (
                            <>
                              {debtorsCount > 0 && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-green-500/20 text-green-400 rounded-lg">
                                  owed by {debtorsCount}
                                </span>
                              )}
                              {creditorsCount > 0 && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-red-500/20 text-red-400 rounded-lg">
                                  owes {creditorsCount}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Settlement Suggestions (Read-only) */}
        {suggestions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-50 mb-4">suggested settlements</h2>
            <Card>
              <p className="text-gray-400 text-sm mb-4 text-justify">
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

      {/* Member Breakdown Modal (Read-only) */}
      <Modal
        isOpen={selectedMemberId !== null}
        onClose={() => setSelectedMemberId(null)}
        title={selectedMember ? `${selectedMember.name}'s breakdown` : "member breakdown"}
        footer={
          memberBreakdown.length > 0 && 
          (memberBreakdown.filter((item) => item.type === "owes").length > 0 ||
           memberBreakdown.filter((item) => item.type === "owed").length > 0) ? (
            <div className="px-6 py-4 space-y-2">
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
          ) : undefined
        }
      >
        <div className="px-6 pt-6 pb-4">
          <div className="space-y-4">
            {memberBreakdown.length === 0 ? (
              <p className="text-gray-400 text-center py-4">no debts or credits</p>
            ) : (
              <div className="space-y-2">
                {memberBreakdown.filter((item) => item.type === "owes").length > 0 && (
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">receive from</h3>
                )}
                {memberBreakdown
                  .filter((item) => item.type === "owes")
                  .map((item, index) => {
                    const otherMember = group?.members.find((m) => m.id === item.memberId);
                    if (!otherMember) return null;
                    
                    return (
                      <div
                        key={item.memberId}
                        className="flex items-center justify-between p-3 bg-[#1C1C1E] border border-[#3A3A3C] rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 font-medium w-6">
                            {index + 1}.
                          </span>
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
                      .map((item, index) => {
                        const otherMember = group?.members.find((m) => m.id === item.memberId);
                        if (!otherMember) return null;
                        
                        return (
                          <div
                            key={item.memberId}
                            className="flex items-center justify-between p-3 bg-[#1C1C1E] border border-[#3A3A3C] rounded-xl mb-2"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500 font-medium w-6">
                                {index + 1}.
                              </span>
                              <div>
                                <p className="text-gray-50 font-medium text-sm">{otherMember.name}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  {selectedMember?.name} <ArrowRight className="w-3 h-3" /> {otherMember.name}
                                </p>
                              </div>
                            </div>
                            <p className="font-bold text-red-400">
                              {formatCurrency(item.amount)}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

