import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Folder,
  Code,
  Terminal,
  FileArchive,
  ArrowRight,
  GitBranch,
} from 'lucide-react';

interface AndroidExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidExportModal: React.FC<AndroidExportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [copiedPackage, setCopiedPackage] = useState(false);
  const [copiedProjectId, setCopiedProjectId] = useState(false);
  const [copiedGitCmd, setCopiedGitCmd] = useState(false);
  const [activeTab, setActiveTab] = useState<'bangla' | 'english'>('bangla');

  const copyToClipboard = (text: string, type: 'pkg' | 'proj' | 'git') => {
    navigator.clipboard.writeText(text);
    if (type === 'pkg') {
      setCopiedPackage(true);
      setTimeout(() => setCopiedPackage(false), 2000);
    } else if (type === 'proj') {
      setCopiedProjectId(true);
      setTimeout(() => setCopiedProjectId(false), 2000);
    } else {
      setCopiedGitCmd(true);
      setTimeout(() => setCopiedGitCmd(false), 2000);
    }
  };

  const gitCommands = `git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/ccd-hospitality-app.git
git branch -M main
git push -u origin main`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#12141c] border border-[#d4af37]/40 rounded-3xl p-6 sm:p-8 shadow-[0_10px_50px_rgba(0,0,0,0.9)] text-[#f1f5f9] my-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#242938]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-[#d4af37]/40 flex items-center justify-center text-[#ffd700]">
              <Smartphone className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-['Cinzel'] text-[#fdf8f0] tracking-wide flex items-center gap-2">
                <span>GitHub & Android APK Center</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Ready
                </span>
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                সম্পূর্ণ প্রজেক্ট ডাউনলোড, গিটহাবে আপলোড এবং সরাসরি Android APK পাওয়ার সহজ গাইড
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#94a3b8] hover:text-[#fdf8f0] p-1.5 rounded-xl hover:bg-[#1c2130] transition"
          >
            ✕
          </button>
        </div>

        {/* Language Switcher Tabs */}
        <div className="flex items-center justify-between mt-4 pb-2 border-b border-[#1f2437]">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('bangla')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'bangla'
                  ? 'bg-[#d4af37] text-slate-950 shadow'
                  : 'bg-[#171a25] text-slate-400 hover:text-white'
              }`}
            >
              <span>🇧🇩 বাংলা নির্দেশিকা (Step-by-Step)</span>
            </button>
            <button
              onClick={() => setActiveTab('english')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'english'
                  ? 'bg-[#d4af37] text-slate-950 shadow'
                  : 'bg-[#171a25] text-slate-400 hover:text-white'
              }`}
            >
              <span>🌐 English Guide</span>
            </button>
          </div>
          <span className="text-[11px] text-[#ffd700] font-mono font-semibold hidden sm:inline">
            App ID: com.ccd.abetteryou
          </span>
        </div>

        {/* PRIMARY ACTION: DIRECT DOWNLOAD ZIP BUTTON */}
        <div className="mt-5 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#101925] to-blue-950/40 border-2 border-emerald-500/50 shadow-lg shadow-emerald-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wide">
                <FileArchive className="w-5 h-5 text-emerald-400" />
                <span>১-ক্লিকে সম্পূর্ণ প্রজেক্ট ডাউনলোড করুন (.ZIP)</span>
              </div>
              <p className="text-xs text-slate-300">
                সব সোর্স কোড (Frontend, Backend, Android Gradle, GitHub Actions Workflow, Components, Firebase) সহ জিপ ফাইল।
              </p>
            </div>
            <a
              href="/ccd-hospitality-full-project.zip"
              download="ccd-hospitality-full-project.zip"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs tracking-wider uppercase shadow-xl flex items-center justify-center gap-2 shrink-0 transition"
            >
              <Download className="w-4 h-4" /> Download Complete Project (.ZIP)
            </a>
          </div>
        </div>

        {/* TAB 1: BANGLA DETAILED INSTRUCTIONS */}
        {activeTab === 'bangla' && (
          <div className="mt-5 space-y-4">
            {/* Step 1: Download */}
            <div className="p-4 rounded-2xl bg-[#0e111a] border border-[#232838] space-y-2">
              <div className="flex items-center gap-2 text-[#ffd700] font-bold text-xs uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-[#ffd700]/20 flex items-center justify-center text-[11px]">১</span>
                <span>ফাইল কিভাবে ডাউনলোড করবেন?</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                উপরে দেওয়া সবুজ <strong className="text-emerald-400">"Download Complete Project (.ZIP)"</strong> বাটনে ক্লিক করলেই সম্পূর্ণ প্রজেক্টের জিপ ফাইলটি (<code className="text-amber-300 font-mono">ccd-hospitality-full-project.zip</code>) এক ক্লিকে ডাউনলোড হয়ে যাবে। অথবা AI Studio-র উপরের মেনুর "Export/Download" থেকেও ডাউনলোড করতে পারেন।
              </p>
            </div>

            {/* Step 2: Username & Repository */}
            <div className="p-4 rounded-2xl bg-[#0e111a] border border-[#232838] space-y-2">
              <div className="flex items-center gap-2 text-[#ffd700] font-bold text-xs uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-[#ffd700]/20 flex items-center justify-center text-[11px]">২</span>
                <span>কোন ইউজার নেম (Username) দিবেন?</span>
              </div>
              <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <p>
                  আপনার যে <strong>Gmail</strong> দিয়ে আপনি AI Studio চালাচ্ছেন, সেই Gmail দিয়ে আপনি <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline inline-flex items-center gap-0.5">GitHub.com <ExternalLink className="w-3 h-3" /></a> এ লগইন করুন।
                </p>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">আপনার গিটহাব ইউজারনেম:</span>
                    <span className="text-amber-300 font-mono font-bold">আপনার নিজস্ব GitHub Username (যেমন: john-doe)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">রিপোজিটরির নাম (Repository Name):</span>
                    <span className="text-emerald-400 font-mono font-bold">ccd-hospitality-app</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  * GitHub-এ গিয়ে <strong className="text-white">"New Repository"</strong> বাটনে ক্লিক করে নাম দিন: <code className="text-emerald-300 font-mono">ccd-hospitality-app</code> এবং এটি <strong>Public</strong> বা <strong>Private</strong> নির্বাচন করে ক্রিয়েট করুন।
                </p>
              </div>
            </div>

            {/* Step 3: Upload Options */}
            <div className="p-4 rounded-2xl bg-[#0e111a] border border-[#232838] space-y-3">
              <div className="flex items-center gap-2 text-[#ffd700] font-bold text-xs uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-[#ffd700]/20 flex items-center justify-center text-[11px]">৩</span>
                <span>GitHub-এ কিভাবে ফাইল আপলোড করবেন? (২টি সহজ উপায়)</span>
              </div>

              {/* Method A: Direct Web Upload */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/30 to-indigo-950/20 border border-blue-500/30 space-y-1.5">
                <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5" /> উপায় ক: সবচেয়ে সহজ (ব্রাউজার দিয়ে আপলোড — কোনো কমান্ড ছাড়াই)
                </span>
                <ol className="list-decimal list-inside text-[11px] text-slate-300 space-y-1 pl-1">
                  <li>ডাউনলোড করা <code className="text-amber-300">ccd-hospitality-full-project.zip</code> ফাইলটি আপনার কম্পিউটারে আনজিপ (Extract) করুন।</li>
                  <li>আপনার GitHub রিপোজিটরিতে ঢুকে <strong className="text-white">"uploading an existing file"</strong> লিংকে ক্লিক করুন।</li>
                  <li>আনজিপ করা ফোল্ডারের ফাইলগুলো টেনে নিয়ে (Drag & Drop) ছেড়ে দিন।</li>
                  <li>নিচে <strong className="text-emerald-400">"Commit changes"</strong> বাটনে চাপ দিন — সব ফাইল সাথে সাথে GitHub এ জমা হয়ে যাবে!</li>
                </ol>
              </div>

              {/* Method B: Git Command */}
              <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" /> উপায় খ: Git কমান্ড দিয়ে আপলোড (প্রফেশনাল পদ্ধতি)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(gitCommands, 'git')}
                    className="text-[11px] text-blue-400 hover:text-white flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedGitCmd ? 'Copied!' : 'Copy Commands'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">আনজিপ করা ফোল্ডারে টার্মিনাল বা কমান্ড প্রম্পট খুলে চালান:</p>
                <pre className="text-[11px] font-mono text-emerald-400 bg-black/60 p-2.5 rounded-lg overflow-x-auto">
{`git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/ccd-hospitality-app.git
git branch -M main
git push -u origin main`}
                </pre>
              </div>
            </div>

            {/* Step 4: GitHub Actions & Download APK */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-indigo-950/30 border border-purple-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[11px]">৪</span>
                  <span>কিভাবে তৈরি করা Android APK পাবেন ও ফোনে ইনস্টল করবেন?</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  GitHub Actions
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                এই প্রজেক্টে স্বয়ংক্রিয় APK তৈরির ফাইল (<code className="text-purple-300 font-mono">.github/workflows/build-android-apk.yml</code>) যুক্ত করা আছে।
              </p>
              <div className="space-y-1.5 text-xs text-slate-300 pl-1">
                <div className="flex items-start gap-2">
                  <span className="text-[#ffd700] font-bold">১.</span>
                  <span>GitHub রিপোজিটরিতে কোড আপলোড হওয়ার সাথে সাথে উপরের <strong className="text-white">"Actions"</strong> ট্যাবে যান।</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#ffd700] font-bold">২.</span>
                  <span>দেখবেন <strong className="text-white">"Build Android APK"</strong> কাজটি নিজে থেকেই চলতে শুরু করেছে এবং ২-৩ মিনিটের মধ্যে সফলভাবে সম্পূর্ণ হবে (সবুজ টিক মার্ক আসবে)।</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#ffd700] font-bold">৩.</span>
                  <span>সেই কাজের নামের উপর ক্লিক করে একদম নিচে স্ক্রল করুন। সেখানে <strong className="text-emerald-400">"Artifacts"</strong> সেকশনে <strong className="text-white">"CCD-Hospitality-Android-App-Debug-APK"</strong> নামের ডাউনলোড লিংক দেখতে পাবেন!</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#ffd700] font-bold">৪.</span>
                  <span>সেখান থেকে <code className="text-emerald-400">.apk</code> ফাইলটি ডাউনলোড করে আপনার অ্যান্ড্রয়েড ফোনে ইন্সটল করে নিন!</span>
                </div>
              </div>
            </div>

            {/* Clarification about Gmail and Direct Connection */}
            <div className="p-4 rounded-2xl bg-[#141824] border border-[#2b3348] space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>আপনার জিমেইল ও গিটহাব কানেকশন সম্পর্কে তথ্য:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                আপনি যে জিমেইল দিয়ে AI Studio-তে আছেন, সেই জিমেইলেই আপনার GitHub অ্যাকাউন্ট আছে। তবে নিরাপত্তা বিধির কারণে আপনার পাসওয়ার্ড বা পার্সোনাল অ্যাক্সেস টোকেন (Personal Access Token) এই ক্লাউড স্যান্ডবক্সে সংরক্ষিত থাকে না — যাতে আপনার অ্যাকাউন্টের সম্পূর্ণ নিরাপত্তা বজায় থাকে। তাই আপনি উপরে দেওয়া ১-ক্লিক জিপ ডাউনলোড ফাইলটি দিয়ে সরাসরি যেকোনো সময় আপনার GitHub এ কোড পুশ করে নিতে পারেন!
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: ENGLISH GUIDE */}
        {activeTab === 'english' && (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-2xl bg-[#0e111a] border border-[#232838] space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#ffd700]">
                Step 1: Download Complete Source Bundle
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Click the green <strong className="text-emerald-400">"Download Complete Project (.ZIP)"</strong> button at the top to download <code className="text-amber-300 font-mono">ccd-hospitality-full-project.zip</code>. It contains all frontend, backend, Android Gradle assets, and GitHub Actions workflow.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0e111a] border border-[#232838] space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#ffd700]">
                Step 2: Create a GitHub Repository
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Log into your GitHub account using your Gmail address. Click <strong>New Repository</strong>, name it <code className="text-emerald-400 font-mono">ccd-hospitality-app</code>, and click <strong>Create Repository</strong>.
              </p>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1">
                <div><span className="text-slate-400">Username:</span> <span className="text-amber-300">Your GitHub account username</span></div>
                <div><span className="text-slate-400">Repository Name:</span> <span className="text-emerald-400">ccd-hospitality-app</span></div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0e111a] border border-[#232838] space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#ffd700]">
                Step 3: Push Code to GitHub
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Extract the downloaded ZIP file and run the following commands in your terminal:
              </p>
              <pre className="text-[11px] font-mono text-emerald-400 bg-black/60 p-2.5 rounded-lg overflow-x-auto">
{gitCommands}
              </pre>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-indigo-950/30 border border-purple-500/40 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Step 4: Download APK from GitHub Actions
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                The workflow <code className="text-purple-300 font-mono">.github/workflows/build-android-apk.yml</code> will automatically run upon push.
              </p>
              <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1 pl-1">
                <li>Go to the <strong>Actions</strong> tab in your repository.</li>
                <li>Click on the completed <strong>Build Android APK</strong> workflow.</li>
                <li>Under <strong>Artifacts</strong> at the bottom of the page, click <strong className="text-emerald-400">CCD-Hospitality-Android-App-Debug-APK</strong>.</li>
                <li>Transfer or download the APK onto your Android phone and install!</li>
              </ol>
            </div>
          </div>
        )}

        {/* Configuration Badges */}
        <div className="my-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#0b0d13] border border-[#232838] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#94a3b8] block">
                Android Package Name
              </span>
              <span className="text-xs font-mono font-bold text-[#ffd700]">
                com.ccd.abetteryou
              </span>
            </div>
            <button
              onClick={() => copyToClipboard('com.ccd.abetteryou', 'pkg')}
              className="p-1.5 text-xs text-[#94a3b8] hover:text-white bg-[#171a25] rounded-lg"
              title="Copy"
            >
              {copiedPackage ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0b0d13] border border-[#232838] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#94a3b8] block">
                Firebase Project ID
              </span>
              <span className="text-xs font-mono font-bold text-white">
                ccd-a-better-you-every-day
              </span>
            </div>
            <button
              onClick={() => copyToClipboard('ccd-a-better-you-every-day', 'proj')}
              className="p-1.5 text-xs text-[#94a3b8] hover:text-white bg-[#171a25] rounded-lg"
              title="Copy"
            >
              {copiedProjectId ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#242938]">
          <div className="flex items-center gap-2 text-[11px] text-[#64748b]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Complete project ready for GitHub & Android APK build</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#1b202e] hover:bg-[#252b3d] text-slate-200 font-bold text-xs tracking-wider uppercase transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
