import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import {
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmailPage() {
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const email =
    (location.state?.email as string) || searchParams.get("email") || "";
  const tokenFromUrl = searchParams.get("token");

  const [status, setStatus] = useState<
    "idle" | "verifying" | "verified" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [verificationLink, setVerificationLink] = useState<string>(
    (location.state?.verificationLink as string) || ""
  );

  useEffect(() => {
    if (tokenFromUrl) {
      setStatus("verifying");
      verifyEmail(tokenFromUrl)
        .then(() => {
          setStatus("verified");
          setTimeout(() => navigate("/dashboard"), 2000);
        })
        .catch((err) => {
          setStatus("error");
          setError(err instanceof Error ? err.message : "Verification failed");
        });
    }
  }, [tokenFromUrl, verifyEmail, navigate]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setError("");
    try {
      const res = await resendVerification(email);
      setStatus("idle");
      setError("");
      if (res?.verificationLink) {
        setVerificationLink(res.verificationLink);
      }
      alert("Verification email request processed.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to resend verification",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-teal-100 rounded-2xl flex items-center justify-center mb-4">
              {status === "verified" ? (
                <CheckCircle size={32} className="text-emerald-600" />
              ) : status === "error" ? (
                <AlertCircle size={32} className="text-red-600" />
              ) : (
                <Mail size={32} className="text-teal-600" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              {status === "verified"
                ? "Email Verified!"
                : status === "error"
                  ? "Verification Failed"
                  : "Verify Your Email"}
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              {status === "verified"
                ? "Your account is now active. Redirecting to dashboard..."
                : status === "error"
                  ? "There was a problem verifying your email"
                  : `We've sent a confirmation link to ${email}`}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {status === "idle" && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-800">
                <p className="font-medium mb-2">Check your inbox</p>
                <p>
                  Click the verification link in the email to activate your
                  account. The link expires in 24 hours.
                </p>
              </div>
            )}

            {status === "verifying" && (
              <div className="flex items-center justify-center gap-3 py-6">
                <Loader2 size={20} className="animate-spin text-teal-600" />
                <p className="text-slate-600">Verifying your email...</p>
              </div>
            )}

            {status === "verified" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
                <p className="font-medium">Success!</p>
                <p>
                  Your email has been verified and your account is ready to use.
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
                <p className="text-red-800 font-medium mb-1">Error</p>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {verificationLink && status !== "verified" && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 space-y-2">
                <p className="font-semibold text-amber-800">Instant Verification (Failsafe)</p>
                <p className="text-xs text-amber-700">
                  If the verification email did not arrive or mail services are unconfigured, click the link below to verify instantly:
                </p>
                <a
                  href={verificationLink}
                  className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-semibold underline"
                >
                  Verify Account Now <ArrowRight size={14} />
                </a>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {status === "idle" && (
              <button
                onClick={handleResend}
                disabled={resending || !email}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-300 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {resending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    Resend Verification Email
                  </>
                )}
              </button>
            )}

            {(status === "verified" || status === "error") && (
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Go to Dashboard
                <ArrowRight size={16} />
              </button>
            )}

            {status !== "verifying" && (
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                Back to Home
              </button>
            )}
          </div>

          {/* Help text */}
          <p className="text-xs text-slate-400 text-center">
            Didn't receive the email? Check your spam folder or{" "}
            <button
              onClick={handleResend}
              disabled={resending || !email}
              className="text-teal-600 hover:text-teal-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              try again
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
