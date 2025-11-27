"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import Header from "@/components/Header";
import Card from "@/components/Card";
import { Download, Upload, Trash2, AlertTriangle } from "lucide-react";
import Modal from "@/components/Modal";

export default function SettingsPage() {
  const [resetModal, setResetModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const exportData = useStore((state) => state.exportData);
  const importData = useStore((state) => state.importData);
  const resetAll = useStore((state) => state.resetAll);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mono-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.transactions && data.notes) {
          if (
            confirm(
              "this will replace all your current data. are you sure you want to continue?"
            )
          ) {
            importData(data);
            alert("data imported successfully!");
            setImportModal(false);
          }
        } else {
          alert("invalid file format. please select a valid backup file.");
        }
      } catch (error) {
        alert("error reading file. please make sure it's a valid json file.");
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    resetAll();
    setResetModal(false);
    alert("all data has been reset.");
  };

  return (
    <div className="min-h-screen pb-20">
      <Header title="settings" />
      <main className="p-5 space-y-5">
        {/* Export/Import */}
        <Card>
          <h3 className="font-bold text-gray-50 mb-4 text-lg">data management</h3>
          <div className="space-y-3">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-between px-5 py-4 bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-[#3A3A3C] rounded-2xl transition-all active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FCD34D]/10 rounded-xl">
                  <Upload className="w-5 h-5 text-[#FCD34D]" />
                </div>
                <span className="font-semibold text-gray-50">export data</span>
              </div>
            </button>
            <button
              onClick={() => setImportModal(true)}
              className="w-full flex items-center justify-between px-5 py-4 bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-[#3A3A3C] rounded-2xl transition-all active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FCD34D]/10 rounded-xl">
                  <Download className="w-5 h-5 text-[#FCD34D]" />
                </div>
                <span className="font-semibold text-gray-50">import data</span>
              </div>
            </button>
          </div>
        </Card>

        {/* Reset Data */}
        <Card className="border-red-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-bold text-gray-50">reset all data</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  permanently delete all transactions and notes
                </p>
              </div>
            </div>
            <button
              onClick={() => setResetModal(true)}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-semibold active:scale-95"
            >
              Reset
            </button>
          </div>
        </Card>
      </main>

      {/* Import Modal */}
      <Modal
        isOpen={importModal}
        onClose={() => setImportModal(false)}
        title="import data"
      >
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            select a backup json file to import. this will replace all your current data.
          </p>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#3A3A3C] rounded-2xl text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-[#FCD34D] transition-all"
          />
          <button
            onClick={() => setImportModal(false)}
            className="w-full px-5 py-3 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-gray-300 rounded-2xl transition-all font-semibold active:scale-95"
          >
            cancel
          </button>
        </div>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={resetModal}
        onClose={() => setResetModal(false)}
        title="reset all data"
      >
        <div className="space-y-5">
          <p className="text-red-400 font-bold text-lg">
            ⚠️ warning: this action cannot be undone!
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">
            all your transactions and notes will be permanently deleted. make sure you have exported a backup if you want to keep your data.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setResetModal(false)}
              className="flex-1 px-5 py-3 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-gray-300 rounded-2xl transition-all font-semibold active:scale-95"
            >
              cancel
            </button>
            <button
              onClick={handleReset}
              className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-all font-bold active:scale-95"
            >
              reset all data
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

