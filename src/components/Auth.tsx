import React, { useState, useEffect } from "react";
import { Lock, Mail, User, Info, Check, RefreshCw, Send, CheckCircle2, Gift } from "lucide-react";
import { getUserProfile, createUserProfile, getProfileByReferralCode } from "../lib/firebaseService";

interface AuthProps {
  onLoginSuccess: (username: string, email: string) => void;
  whatsappNumber: string;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, whatsappNumber }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  
  // URL Referral Extractor
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      sessionStorage.setItem("dadhich_smm_pending_ref", ref);
      setReferralCode(ref);
    } else {
      const stored = sessionStorage.getItem("dadhich_smm_pending_ref");
      if (stored) {
        setReferralCode(stored);
      }
    }
  }, []);
  
  // Interactive Captcha simulation
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [captchaVerifying, setCaptchaVerifying] = useState(false);

  // Notifications
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // States for sending test email manually
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState(""); // "", "sending", "success", "error"
  const [testEmailError, setTestEmailError] = useState("");

  // Function to send test welcome email
  const sendTestEmail = async (targetEmail: string, targetName: string) => {
    setIsSendingTestEmail(true);
    setTestEmailStatus("sending");
    setTestEmailError("");
    try {
      const response = await fetch("/api/send-welcome-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: targetName,
          email: targetEmail
        })
      });

      const resText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(resText);
      } catch (parseErr) {
        // If it is HTML, grab a clean snippet of it or fallback to status text
        const snippet = resText.includes("<html") || resText.trim().startsWith("<!DOCTYPE")
          ? "Server HTML error page returned. The backend might have restarted or is currently offline."
          : resText.slice(0, 150);
        data = { error: `Server error (HTTP ${response.status}): ${snippet}` };
      }

      if (response.ok && data.success) {
        setTestEmailStatus("success");
      } else {
        setTestEmailStatus("error");
        setTestEmailError(data.error || "Failed to send email");
      }
    } catch (err: any) {
      console.error("Test email trigger error:", err);
      setTestEmailStatus("error");
      setTestEmailError(err.message || "Network error");
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  // Automatically trigger welcome email to Trendwithus@gmail.com on absolute first mount
  useEffect(() => {
    const hasSentAuto = sessionStorage.getItem("hasSentAutoWelcomeEmailTrendwithus");
    if (!hasSentAuto) {
      console.log("Triggering proactive auto welcome email to Trendwithus@gmail.com...");
      sendTestEmail("Trendwithus@gmail.com", "Trendwithus");
      sessionStorage.setItem("hasSentAutoWelcomeEmailTrendwithus", "true");
    }
  }, []);

  // Action to contact WhatsApp SMM support (as shown in absolute layouts)
  const openSupportWhatsApp = () => {
    const formattedUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=Hello%20Dadhich%20SMM%20Support!%20I%2520need%20help%2520with%20my%20account.`;
    window.open(formattedUrl, "_blank");
  };

  const handleCaptchaClick = () => {
    if (captchaChecked) {
      setCaptchaChecked(false);
      return;
    }
    setCaptchaVerifying(true);
    setTimeout(() => {
      setCaptchaVerifying(false);
      setCaptchaChecked(true);
    }, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMsg("");
    setSuccessMsg("");

    const termUser = username.trim();
    if (!termUser) {
      setErrorMsg("Please enter a valid Username.");
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign Up validation
        const mailVal = email.trim();
        if (!mailVal || !mailVal.includes("@")) {
          setErrorMsg("Please enter a valid Email address.");
          setIsLoading(false);
          return;
        }
        if (password.length < 5) {
          setErrorMsg("Password must be at least 5 characters long.");
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg("Passwords do not match. Please verify.");
          setIsLoading(false);
          return;
        }
        if (!captchaChecked) {
          setErrorMsg("Please complete the 'I'm not a robot' CAPTCHA validation.");
          setIsLoading(false);
          return;
        }

        const existingProfile = await getUserProfile(termUser);
        if (existingProfile) {
          setErrorMsg("Username already exists. Try another username or Log In.");
          setIsLoading(false);
          return;
        }

        let validatedReferrer: string | undefined = undefined;
        if (referralCode.trim()) {
          const inputCode = referralCode.trim().toUpperCase();
          if (inputCode.toLowerCase() === termUser.toLowerCase() || referralCode.trim().toLowerCase() === termUser.toLowerCase()) {
            setErrorMsg("You cannot refer yourself as a new client.");
            setIsLoading(false);
            return;
          }
          
          // 1. Try treating it as a 6-digit personal referral code
          let referrerProfile = await getProfileByReferralCode(inputCode);
          
          // 2. Fallback: If not found, try treating it as a raw username
          if (!referrerProfile) {
            referrerProfile = await getUserProfile(referralCode.trim());
          }
          
          if (!referrerProfile) {
            setErrorMsg(`Referral Code "${referralCode}" is invalid. Please double check the code or leave the field empty.`);
            setIsLoading(false);
            return;
          }
          validatedReferrer = referrerProfile.username;
        }

        // Create user in Firebase Firestore - returns starts with ₹0 wallet balance as requested (No welcome bonus!)
        await createUserProfile(termUser, mailVal, password, validatedReferrer);

        // Send Welcome Email via secure backend proxy
        setSuccessMsg("Account created successfully! Sending welcome email...");
        
        let customStatus = "";
        try {
          const emailResponse = await fetch("/api/send-welcome-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: termUser,
              email: mailVal
            })
          });

          const emailData = await emailResponse.json();

          if (emailResponse.ok && emailData.success) {
            customStatus = "Welcome email sent successfully! 🚀";
            setSuccessMsg(`Account created! ${customStatus} Logging you in...`);
          } else {
            console.error("Failed to send welcome email:", emailData.error);
            customStatus = `Email failed: ${emailData.error || 'Resend error'}`;
            setSuccessMsg(`Account created! (${customStatus}). Logging you in...`);
          }
        } catch (emailErr: any) {
          console.error("Welcome email error:", emailErr);
          customStatus = "Email failed: network/backend error";
          setSuccessMsg(`Account created! (${customStatus}). Logging you in...`);
        }

        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess(termUser, mailVal);
        }, 3000);

      } else {
        // Log In validation
        if (!password) {
          setErrorMsg("Please enter your account password.");
          setIsLoading(false);
          return;
        }

        // Query the profile document from Firestore
        const profile = await getUserProfile(termUser);

        if (!profile || profile.password !== password) {
          setErrorMsg("Invalid username or password credentials. Please try again.");
          setIsLoading(false);
          return;
        }

        setSuccessMsg("Access Granted. Synchronizing your social dashboard...");
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess(profile.username, profile.email);
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to execute firebase transactions.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e2f6f7] flex flex-col font-sans relative overflow-x-hidden selection:bg-[#42ced6]/20">
      
      {/* Top Navbar customized to match SMM Panels */}
      <header className="bg-white border-b border-cyan-100/60 shadow-xs px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          {/* SMM Icon Header Element */}
          <div className="relative flex items-center justify-center p-1 bg-white rounded-xl shadow-xs border border-cyan-100/50">
            <span className="text-xl md:text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
              <img 
                src="https://res.cloudinary.com/dhbnbp0ax/image/upload/f_auto,q_auto/29230_nlstyo" 
                alt="Logo" 
                className="w-8 h-8 object-contain rounded-md"
                referrerPolicy="no-referrer"
              />
              <span className="bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent">Dadhich</span>
              <span className="text-[#3bcbd2] font-black tracking-wide">SMM</span>
            </span>
          </div>
        </div>

        {/* Floating live badge */}
        <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 border border-emerald-100 rounded-full font-bold">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          Server Live
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:py-16">
        
        {/* Auth Box Container */}
        <div className="w-full max-w-md bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-cyan-900/5 border border-cyan-100/40 relative z-10 transition-all duration-300">
          
          {/* Logo & Headline Inside */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#034451] tracking-tight">
              {isSignUp ? "Create Social Account" : "Access Social Engine"}
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {isSignUp 
                ? "Get started in 30 seconds for stable, automated SMM refills"
                : "Enter credentials to handle active campaigns"}
            </p>
          </div>

          {/* Form Message Banners */}
          {errorMsg && (
            <div className="p-3 mb-6 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-bold leading-relaxed flex items-center gap-2 animate-fade-in">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 mb-6 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-bold leading-relaxed flex items-center gap-2 animate-fade-in">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {successMsg}
            </div>
          )}

          {/* Core Login/SignUp Dynamic Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Field: Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-[#034451] uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full py-2.5 pl-9 pr-4 bg-[#edf9fa] border border-[#d1f1f2] focus:border-[#42ced6] text-slate-800 font-semibold rounded-xl text-sm outline-hidden transition-all focus:ring-2 focus:ring-cyan-100 hover:bg-[#ebf8f9]"
                />
              </div>
            </div>

            {/* Unique Field: Email (Only for registration) */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-[#034451] uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@yourmail.com"
                    className="w-full py-2.5 pl-9 pr-4 bg-[#edf9fa] border border-[#d1f1f2] focus:border-[#42ced6] text-slate-800 font-semibold rounded-xl text-sm outline-hidden transition-all focus:ring-2 focus:ring-cyan-100 hover:bg-[#ebf8f9]"
                  />
                </div>
              </div>
            )}

            {/* Field: Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-[#034451] uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? "Minimum 5 characters" : "Password"}
                  className="w-full py-2.5 pl-9 pr-4 bg-[#edf9fa] border border-[#d1f1f2] focus:border-[#42ced6] text-slate-800 font-semibold rounded-xl text-sm outline-hidden transition-all focus:ring-2 focus:ring-cyan-100 hover:bg-[#ebf8f9]"
                />
              </div>
            </div>

            {/* Unique Field: Confirm Password (Only for registration) */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-[#034451] uppercase tracking-wider">
                  Confirm password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full py-2.5 pl-9 pr-4 bg-[#edf9fa] border border-[#d1f1f2] focus:border-[#42ced6] text-slate-800 font-semibold rounded-xl text-sm outline-hidden transition-all focus:ring-2 focus:ring-cyan-100 hover:bg-[#ebf8f9]"
                  />
                </div>
              </div>
            )}

            {/* Unique Field: Referral Code (Only for registration, optional) */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-[#034451] uppercase tracking-wider flex items-center justify-between">
                  <span>Referral Code (Optional)</span>
                  <span className="text-[10px] text-teal-600 lowercase normal-case font-bold">10% referral reward on first deposit</span>
                </label>
                <div className="relative animate-pulse hover:animate-none">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-teal-500">
                    <Gift className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Enter referrer username"
                    className="w-full py-2.5 pl-9 pr-4 bg-teal-50/50 border border-teal-100 focus:border-[#42ced6] text-slate-800 font-semibold rounded-xl text-sm outline-hidden transition-all focus:ring-2 focus:ring-cyan-100 hover:bg-teal-50"
                  />
                </div>
              </div>
            )}

            {/* Remember Me Option (Login Only) */}
            {!isSignUp && (
              <div className="flex items-center justify-between text-xs py-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded-sm border-cyan-300 text-[#42ced6] focus:ring-cyan-200"
                  />
                  <span className="text-[#034451] font-bold">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert("Please contact WhatsApp Support at the bottom right corner of this page to request a safe automated link to reset your secure account password.")}
                  className="font-bold text-[#42ced6] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Simulated interactive reCAPTCHA box (Signup Only) */}
            {isSignUp && (
              <div className="p-3 bg-slate-50 border border-slate-205/60 rounded-lg flex items-center justify-between select-none shadow-3xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCaptchaClick}
                    className="h-6 w-6 rounded border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-50 focus:outline-hidden transition-all shrink-0"
                  >
                    {captchaVerifying ? (
                      <RefreshCw className="h-3.5 w-3.5 text-indigo-600 animate-spin" />
                    ) : captchaChecked ? (
                      <Check className="h-4 w-4 text-emerald-600 stroke-[3.5]" />
                    ) : null}
                  </button>
                  <span className="text-xs font-bold text-slate-600">I'm not a robot</span>
                </div>
                <div className="flex flex-col items-center shrink-0">
                  <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.13,5.91,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                  </svg>
                  <span className="text-[7px] font-black text-slate-400 mt-0.5">reCAPTCHA</span>
                  <span className="text-[5px] text-slate-400 hover:underline cursor-pointer">Security Terms</span>
                </div>
              </div>
            )}

            {/* Submission Button */}
            <button
              type="submit"
              className="w-full py-3 bg-[#42ced6] text-white font-extrabold hover:bg-[#39bec6] rounded-xl text-sm transition-all shadow-md shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-[0.98]"
            >
              {isSignUp ? "Sign Up" : "Log In"}
            </button>
          </form>

          {/* Form Switch Area */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              {isSignUp ? "Do you have an account?" : "Do not have an account?"}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="px-4 py-2 bg-slate-55 text-[#42ced6] hover:bg-slate-100 font-extrabold rounded-xl border border-cyan-100 transition-all"
            >
              {isSignUp ? "Log In" : "Sign Up"}
            </button>
          </div>

        </div>

        {/* Informational Guidelines Card */}
        <div className="w-full max-w-md mt-6 p-4 bg-cyan-900/5 border border-cyan-400/10 rounded-2xl flex items-start gap-3">
          <Info className="h-4.5 w-4.5 text-[#42ced6] shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-600 leading-relaxed font-semibold">
            <span className="font-bold text-[#034451]">Quick Demo Account Access:</span> Try logging in instantly with administrative credential <code className="bg-white px-1.5 py-0.5 rounded border border-cyan-100/50 text-[#034451] font-mono">admin</code> / <code className="bg-white px-1.5 py-0.5 rounded border border-cyan-100/50 text-[#034451] font-mono">admin123</code> or feel free to instantiate your own custom user sign-up profile!
          </div>
        </div>

        {/* Test Email Verification Box */}
        <div className="w-full max-w-md mt-4 p-5 bg-teal-50 border border-teal-100 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="p-1 px-1.5 bg-teal-600/10 text-teal-700 rounded-md font-bold text-xs">API TESTER</span>
            <h3 className="font-extrabold text-[#034451] text-xs uppercase tracking-wider">Welcome Email System</h3>
          </div>
          <p className="text-[11px] text-[#07596a] font-medium leading-relaxed">
            Send a welcome email directly to <strong className="text-[#034451]">Trendwithus@gmail.com</strong> (or any other address) via the Resend backend integration to verify real-time status:
          </p>
          
          <div className="flex gap-2">
            <input 
              type="email"
              placeholder="recipient@example.com"
              defaultValue="Trendwithus@gmail.com"
              id="test-email-recipient-input"
              className="flex-1 py-1.5 px-3 bg-white border border-teal-200/80 rounded-lg text-xs font-semibold text-slate-800 outline-hidden focus:border-[#42ced6]"
            />
            <button
              onClick={() => {
                const input = document.getElementById("test-email-recipient-input") as HTMLInputElement;
                const emailToUse = input?.value?.trim() || "Trendwithus@gmail.com";
                sendTestEmail(emailToUse, "Trendwithus");
              }}
              disabled={isSendingTestEmail}
              className="py-1.5 px-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSendingTestEmail ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
              {isSendingTestEmail ? "Sending..." : "Send Test"}
            </button>
          </div>

          {testEmailStatus === "success" && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-bold leading-relaxed flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                Welcome email sent to the recipient successfully! 🚀
              </div>
            </div>
          )}

          {testEmailStatus === "error" && (
            <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-bold leading-relaxed space-y-1 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span>Failed to deliver test email</span>
              </div>
              <p className="text-[10px] text-rose-700/90 leading-normal pl-3 font-medium">
                {testEmailError}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Floating Interactive Whatsapp Support Tool Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={openSupportWhatsApp}
          className="relative group flex items-center justify-center w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all hover:scale-105 active:scale-95 focus:outline-hidden"
          title="Instant SMM support on WhatsApp"
        >
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
          </span>
          <svg className="w-6.5 h-6.5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.1 1.455 4.8 1.457 5.4 0 9.8-4.394 9.8-9.8 0-2.615-1.02-5.074-2.872-6.928C16.467 2.03 14.015 1.01 11.4 1.01 6 1.01 1.6 5.4 1.6 10.8c0 1.702.451 3.36 1.306 4.887l-.991 3.614 3.731-.977zm11.332-6.811c-.305-.153-1.805-.891-2.085-.992-.28-.102-.483-.153-.686.152-.203.305-.788.992-.965 1.196-.178.203-.355.228-.66.076-.305-.152-1.288-.475-2.453-1.514-.906-.809-1.517-1.809-1.695-2.114-.178-.305-.019-.47.133-.621.137-.136.305-.356.457-.534.152-.178.203-.305.305-.509.102-.203.05-.381-.025-.533-.076-.152-.686-1.653-.94-2.261-.247-.595-.501-.515-.686-.525-.178-.009-.381-.01-.584-.01-.203 0-.533.076-.812.381-.28.305-1.066 1.042-1.066 2.54 0 1.498 1.091 2.946 1.243 3.149.153.203 2.148 3.282 5.205 4.601.727.314 1.293.502 1.734.643.73.232 1.393.199 1.918.121.585-.087 1.805-.738 2.06-1.45.253-.712.253-1.322.178-1.449-.076-.127-.28-.203-.585-.356z"/>
          </svg>
        </button>
      </div>

    </div>
  );
};
