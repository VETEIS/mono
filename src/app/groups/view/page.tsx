"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo, Suspense } from "react";
import Header from "@/components/Header";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import { formatCurrency, formatDate } from "@/utils/format";
import { computeNets, suggestSettlements, computePairwiseDebts } from "@/utils/groups";
import { decodeGroupFromShare } from "@/utils/share";
import { useStore } from "@/store/useStore";
import type { Group } from "@/types";
import { Eye, ArrowRight } from "lucide-react";

function GroupViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const groups = useStore((state) => state.groups);
  const addGroup = useStore((state) => state.addGroup);
  const updateGroup = useStore((state) => state.updateGroup);
  const [group, setGroup] = useState<Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    // Check for chunked data first (for very long groups)
    const chunksParam = searchParams.get("chunks");
    if (chunksParam) {
      const numChunks = parseInt(chunksParam, 10);
      if (numChunks > 0) {
        // Reconstruct the encoded data from chunks
        const chunks: string[] = [];
        for (let i = 0; i < numChunks; i++) {
          const chunk = searchParams.get(`data${i}`);
          if (chunk) {
            chunks.push(chunk);
          }
        }
        
        if (chunks.length === numChunks) {
          const encodedData = chunks.join("");
          try {
            const decodedGroup = decodeGroupFromShare(encodedData);
            if (decodedGroup) {
              const sharedGroup: Group = {
                ...decodedGroup,
                isShared: true,
                sharedFromGroupId: decodedGroup.id,
                lastSyncedAt: new Date().toISOString(),
              };
              setGroup(sharedGroup);
              
              const existingGroup = groups.find((g) => g.id === decodedGroup.id || (g.isShared && g.sharedFromGroupId === decodedGroup.id));
              if (!existingGroup) {
                addGroup(sharedGroup);
              } else {
                updateGroup(existingGroup.id, {
                  ...sharedGroup,
                  id: existingGroup.id,
                });
              }
              return;
            }
          } catch (err) {
            console.error("Error decoding chunked data:", err);
          }
        }
      }
    }
    
    // Standard URL-encoded data (single parameter)
    const encodedData = searchParams.get("data");
    
    // Also try getting from window.location as fallback
    let rawData = encodedData;
    if (!rawData && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      rawData = urlParams.get("data");
    }
    
    // Last resort: try parsing from hash or full URL
    if (!rawData && typeof window !== "undefined") {
      const fullUrl = window.location.href;
      const match = fullUrl.match(/[?&]data=([^&]+)/);
      if (match) {
        rawData = match[1];
      }
    }
    
    if (!rawData) {
      const fullUrl = typeof window !== "undefined" ? window.location.href : "N/A";
      const searchStr = searchParams.toString();
      const debugMsg = `URL: ${fullUrl.substring(0, 200)}...\nSearch: ${searchStr}\nNo data or id parameter found.`;
      console.error("No data parameter found in URL");
      console.error("Full URL:", fullUrl);
      console.error("Search params:", searchStr);
      setDebugInfo(debugMsg);
      setError("invalid share link - no data parameter found");
      return;
    }

    console.log("Loading shared group from URL, encoded data length:", rawData.length);
    console.log("First 100 chars:", rawData.substring(0, 100));
    console.log("Last 50 chars:", rawData.substring(Math.max(0, rawData.length - 50)));

    try {
      const decodedGroup = decodeGroupFromShare(rawData);
      if (!decodedGroup) {
        console.error("Failed to decode group - decodeGroupFromShare returned null");
        const debugMsg = `Data length: ${rawData.length}\nFirst 50 chars: ${rawData.substring(0, 50)}\nLast 50 chars: ${rawData.substring(Math.max(0, rawData.length - 50))}\nFailed to decompress/parse data.`;
        setDebugInfo(debugMsg);
        setError("invalid or corrupted share link");
        return;
      }
      
      console.log("Successfully decoded group:", decodedGroup.name);
      
      // Mark as shared and set source group ID
      const sharedGroup: Group = {
        ...decodedGroup,
        isShared: true,
        sharedFromGroupId: decodedGroup.id,
        lastSyncedAt: new Date().toISOString(),
      };
      
      setGroup(sharedGroup);
      
      // Auto-add to groups if not already exists
      const existingGroup = groups.find((g) => g.id === decodedGroup.id || (g.isShared && g.sharedFromGroupId === decodedGroup.id));
      if (!existingGroup) {
        addGroup(sharedGroup);
      } else {
        // Update existing shared group with latest data
        updateGroup(existingGroup.id, {
          ...sharedGroup,
          id: existingGroup.id, // Keep the existing ID
        });
      }
    } catch (err) {
      console.error("Error loading shared group:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      const debugMsg = `Error: ${errorMsg}\nURL: ${typeof window !== "undefined" ? window.location.href.substring(0, 200) : "N/A"}...`;
      setDebugInfo(debugMsg);
      if (err instanceof Error) {
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
      }
      setError("failed to load group data");
    }
  }, [searchParams, groups, addGroup, updateGroup]);

  // Sync with store updates (live updates)
  useEffect(() => {
    if (!group) return;
    
    const existingGroup = groups.find((g) => g.id === group.id || (g.isShared && g.sharedFromGroupId === group.sharedFromGroupId));
    if (existingGroup && existingGroup.lastSyncedAt !== group.lastSyncedAt) {
      setGroup(existingGroup);
    }
  }, [groups, group]);

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

  if (error) {
    return (
      <div className="min-h-screen pb-20">
        <Header title="group view" backHref="/groups" />
        <main className="p-5">
          <Card>
            <div className="text-gray-400 py-10">
              <div className="text-center mb-4">
                <p className="text-lg mb-2">{error}</p>
                <p className="text-sm">please request a new share link from the group owner.</p>
              </div>
              {debugInfo && (
                <div className="mt-6 p-4 bg-[#1C1C1E] border border-[#3A3A3C] rounded-xl">
                  <p className="text-xs font-semibold text-gray-300 mb-2">debug information:</p>
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap break-all font-mono">
                    {debugInfo}
                  </pre>
                  <p className="text-xs text-gray-500 mt-3">
                    please share this information with the group owner to help fix the issue.
                  </p>
                </div>
              )}
              {typeof window !== "undefined" && (
                <div className="mt-4 p-3 bg-[#1C1C1E] border border-[#3A3A3C] rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">url information:</p>
                  <p className="text-xs text-gray-400 break-all mb-1">full url: {window.location.href}</p>
                  <p className="text-xs text-gray-400">has data param: {searchParams.has("data") ? "Yes" : "No"}</p>
                  <p className="text-xs text-gray-400">url length: {window.location.href.length} characters</p>
                </div>
              )}
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen pb-20">
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

  return (
    <div className="min-h-screen pb-20">
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
                {sortedNets.map((net) => {
                  const member = group.members.find((m) => m.id === net.memberId);
                  if (!member) return null;

                  // Find who owes this member (if net > 0) or who this member owes (if net < 0)
                  let labelText = "settled";
                  if (net.net > 0.01) {
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
                        <span className="text-gray-50 font-medium">{member.name}</span>
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

        {/* Settlement Suggestions (Read-only) */}
        {suggestions.length > 0 && (
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

      {/* Member Breakdown Modal */}
      <Modal
        isOpen={selectedMemberId !== null}
        onClose={() => setSelectedMemberId(null)}
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
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function GroupViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pb-20">
        <Header title="group view" backHref="/groups" />
        <main className="p-5">
          <Card>
            <div className="text-gray-400 text-center py-10">
              <p className="text-sm">loading...</p>
            </div>
          </Card>
        </main>
      </div>
    }>
      <GroupViewContent />
    </Suspense>
  );
}

