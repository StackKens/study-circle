import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { useGroupStore } from "../store/groupStore";
import { Loader2, CheckCircle, XCircle, Users, LogIn } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

type JoinState = "loading" | "success" | "already_member" | "error" | "unauthenticated";

export default function GroupJoinPage() {
  const { token } = useParams<{ token: string }>();
  const { token: authToken, isLoading: authLoading } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { addGroup } = useGroupStore();
  const navigate = useNavigate();

  const [state, setState] = useState<JoinState>("loading");
  const [groupName, setGroupName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Wait for auth to finish loading before deciding
    if (authLoading) return;

    // Not logged in — save the invite path and prompt them to sign in
    if (!authToken) {
      sessionStorage.setItem("post_auth_redirect", `/join/${token}`);
      setState("unauthenticated");
      return;
    }

    if (!token) {
      setErrorMessage("Invalid invite link.");
      setState("error");
      return;
    }

    async function accept() {
      try {
        const res = await fetch(`${API_URL}/groups/invite/${token}/accept`, {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to join group");

        setGroupName(data.group?.name ?? "the group");
        setGroupId(data.group?.id ?? "");

        if (data.already_member) {
          setState("already_member");
        } else {
          if (data.group) addGroup(data.group);
          setState("success");
        }
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
        setState("error");
      }
    }

    accept();
  }, [authToken, authLoading, token, addGroup]);

  // Auto-redirect on success/already_member after 2.5s
  useEffect(() => {
    if ((state === "success" || state === "already_member") && groupId) {
      const timer = setTimeout(() => {
        navigate(`/dashboard/groups/${groupId}`);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [state, groupId, navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm w-full max-w-sm p-8 text-center">
        {(state === "loading") && (
          <>
            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Loader2 size={26} className="text-teal-600 animate-spin" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 mb-1">Joining group…</h1>
            <p className="text-sm text-slate-500">Verifying your invite link</p>
          </>
        )}

        {state === "unauthenticated" && (
          <>
            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <LogIn size={26} className="text-teal-600" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 mb-1">You've been invited!</h1>
            <p className="text-sm text-slate-500 mb-6">
              Sign in or create a free account to join the group.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => openAuthModal("login")}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Sign in
              </button>
              <button
                onClick={() => openAuthModal("register")}
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Create a free account
              </button>
            </div>
          </>
        )}

        {state === "success" && (
          <>
            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={28} className="text-teal-600" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 mb-1">You're in!</h1>
            <p className="text-sm text-slate-500 mb-5">
              You've joined{" "}
              <span className="font-semibold text-slate-700">{groupName}</span>.
              Redirecting you now…
            </p>
            {groupId && (
              <Link
                to={`/dashboard/groups/${groupId}`}
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <Users size={15} />
                Go to group
              </Link>
            )}
          </>
        )}

        {state === "already_member" && (
          <>
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Users size={26} className="text-slate-500" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 mb-1">Already a member</h1>
            <p className="text-sm text-slate-500 mb-5">
              You're already in{" "}
              <span className="font-semibold text-slate-700">{groupName}</span>.
              Taking you there…
            </p>
            {groupId && (
              <Link
                to={`/dashboard/groups/${groupId}`}
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <Users size={15} />
                Go to group
              </Link>
            )}
          </>
        )}

        {state === "error" && (
          <>
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <XCircle size={28} className="text-red-500" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 mb-1">Invite invalid</h1>
            <p className="text-sm text-slate-500 mb-5">
              {errorMessage || "This invite link is invalid or has expired."}
            </p>
            <Link
              to="/dashboard/groups"
              className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Browse groups
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
