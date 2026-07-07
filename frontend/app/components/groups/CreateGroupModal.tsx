import { useState } from "react";
import { X, Loader2, Lock, Globe } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useGroupStore } from "../../store/groupStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const PREDEFINED_UNIVERSITIES = [
  "Makerere University",
  "Kyambogo University",
  "Uganda Christian University",
  "Victoria University",
  "Ndejje University",
  "MUBS",
];

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateGroupModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateGroupModalProps) {
  const { token } = useAuth();
  const addGroup = useGroupStore((s) => s.addGroup);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    university: "",
    description: "",
    is_private: false,
  });
  const [customUniversity, setCustomUniversity] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setFormData({ name: "", subject: "", university: "", description: "", is_private: false });
    setCustomUniversity("");
    setShowCustomInput(false);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) { setError("Group name is required"); return; }
    if (!formData.subject.trim()) { setError("Subject / course code is required"); return; }
    const finalUniversity = showCustomInput ? customUniversity : formData.university;
    if (!finalUniversity.trim()) { setError("University is required"); return; }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: formData.name.trim(),
          subject: formData.subject.trim(),
          university: finalUniversity.trim(),
          description: formData.description.trim(),
          is_private: formData.is_private,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create group");
      addGroup(data);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Create a new group</h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Group name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Group name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Data Structures Study Group"
              maxLength={80}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 focus:outline-none"
              required
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject / Course code *</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., CS 301, MATH 101"
              maxLength={80}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 focus:outline-none"
              required
            />
          </div>

          {/* University */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">University *</label>
            {!showCustomInput ? (
              <>
                <select
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none"
                  required
                >
                  <option value="" disabled>Select your university</option>
                  {PREDEFINED_UNIVERSITIES.map((uni) => (
                    <option key={uni} value={uni}>{uni}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="mt-2 text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  Add university not listed
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customUniversity}
                  onChange={(e) => setCustomUniversity(e.target.value)}
                  placeholder="e.g., Uganda Martyrs University"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (customUniversity.trim()) {
                        setFormData({ ...formData, university: customUniversity });
                        setShowCustomInput(false);
                        setCustomUniversity("");
                      }
                    }}
                    className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-500"
                  >
                    Use this university
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCustomInput(false); setCustomUniversity(""); }}
                    className="px-3 py-1.5 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description <span className="text-slate-400 text-xs">(optional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              maxLength={500}
              placeholder="What will this group focus on?"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 focus:outline-none resize-none"
            />
          </div>

          {/* Privacy toggle */}
          <div
            onClick={() => setFormData({ ...formData, is_private: !formData.is_private })}
            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer select-none transition-colors ${
              formData.is_private
                ? "border-teal-300 bg-teal-50"
                : "border-slate-200 bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              formData.is_private ? "bg-teal-100 text-teal-600" : "bg-slate-100 text-slate-500"
            }`}>
              {formData.is_private ? <Lock size={16} /> : <Globe size={16} />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">
                {formData.is_private ? "Private group" : "Public group"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formData.is_private
                  ? "Only people with your invite link can join"
                  : "Anyone can discover and join this group"}
              </p>
            </div>
            {/* Toggle pill */}
            <div className={`mt-0.5 w-10 h-5.5 rounded-full relative transition-colors ${
              formData.is_private ? "bg-teal-500" : "bg-slate-300"
            }`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                formData.is_private ? "left-5" : "left-0.5"
              }`} />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg cursor-pointer hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold py-2.5 rounded-lg disabled:bg-teal-300 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Create group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
