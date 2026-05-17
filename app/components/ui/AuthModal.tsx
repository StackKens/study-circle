import { useEffect } from "react";
import { X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "login" | "register";
}

export function AuthModal({ isOpen, onClose, type }: AuthModalProps) {
  // Close the modal on pressing of the escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800">
              {type === "login" ? "Welcome back" : "Create an account"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          {/* Modal Content - This is where your actual auth forms go */}
          <div className="p-6">
            {type === "login" ? (
              // Your login form component
              <div>Login form here</div>
            ) : (
              // Your register form component
              <div>Register form here</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
