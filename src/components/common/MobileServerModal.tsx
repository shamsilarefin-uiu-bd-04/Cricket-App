import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  Wifi,
  Copy,
  Check,
  ExternalLink,
  Users,
  ShieldCheck,
  Eye,
  X,
  Radio,
  RefreshCw,
  QrCode,
  Cloud,
  Globe,
  Share2,
  Terminal,
  Rocket,
  CheckCircle2,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { SyncService, type NetworkInfo } from '../../utils/syncService';

interface MobileServerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileServerModal: React.FC<MobileServerModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'cloud' | 'wifi'>('cloud');
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [customCloudUrl, setCustomCloudUrl] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectedCount, setConnectedCount] = useState<number>(1);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    SyncService.getNetworkInfo().then((info) => {
      if (!isMounted) return;
      setNetworkInfo(info);

      const defaultIp = info.ip || (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
      setSelectedIp(defaultIp);
      setConnectedCount(info.connectedClients || SyncService.connectedClients || 1);

      // Auto-switch to cloud tab if currently running on a public cloud domain
      const isCloudEnv =
        info.isCloud ||
        (typeof window !== 'undefined' &&
          !['localhost', '127.0.0.1'].includes(window.location.hostname) &&
          !window.location.hostname.startsWith('192.168.') &&
          !window.location.hostname.startsWith('10.'));

      if (isCloudEnv) {
        setActiveTab('cloud');
      }

      setLoading(false);
    });

    const handleClientCount = (e: Event) => {
      const custom = e as CustomEvent<number>;
      if (custom.detail) {
        setConnectedCount(custom.detail);
      }
    };

    window.addEventListener('cricket-clients-count', handleClientCount);

    return () => {
      isMounted = false;
      window.removeEventListener('cricket-clients-count', handleClientCount);
    };
  }, [isOpen]);

  const currentPort =
    networkInfo?.port || (typeof window !== 'undefined' ? Number(window.location.port) || 5173 : 5173);

  // Compute live active URL based on selected tab
  const localWifiUrl = selectedIp ? `http://${selectedIp}:${currentPort}` : '';
  const detectedCloudUrl =
    networkInfo?.publicUrl ||
    (typeof window !== 'undefined' &&
    !['localhost', '127.0.0.1'].includes(window.location.hostname) &&
    !window.location.hostname.startsWith('192.168.')
      ? window.location.origin
      : '');

  const effectiveCloudUrl = customCloudUrl.trim() || detectedCloudUrl || '';
  const activeUrl = activeTab === 'cloud' && effectiveCloudUrl ? effectiveCloudUrl : localWifiUrl;

  useEffect(() => {
    if (!activeUrl) return;

    QRCode.toDataURL(activeUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => {
        setQrCodeUrl(url);
      })
      .catch((err) => {
        console.error('QR generation error:', err);
      });
  }, [activeUrl]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopyCmd = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopiedCmd(id);
      setTimeout(() => setCopiedCmd(null), 2500);
    });
  };

  const handleRefresh = async () => {
    setLoading(true);
    const info = await SyncService.getNetworkInfo();
    setNetworkInfo(info);
    if (info.ip) setSelectedIp(info.ip);
    setConnectedCount(info.connectedClients || SyncService.connectedClients || 1);
    setLoading(false);
  };

  const isAlreadyOnCloud = !!detectedCloudUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header Glow & Banner */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                {activeTab === 'cloud' ? (
                  <Cloud className="w-6 h-6 text-white" />
                ) : (
                  <Smartphone className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">
                    {activeTab === 'cloud' ? 'Cloud Hosting for Everyone' : 'Mobile Server & Wi-Fi'}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-100 border border-emerald-300/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    LIVE
                  </span>
                </div>
                <p className="text-xs text-emerald-100/90 font-medium">
                  {activeTab === 'cloud'
                    ? 'Watch live Cricbuzz score from anywhere in the world on mobile data/Wi-Fi'
                    : 'Watch live scores on the rooftop / ground via local Wi-Fi router or hotspot'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="mt-4 flex items-center p-1 bg-slate-950/40 rounded-xl border border-white/15">
            <button
              onClick={() => setActiveTab('cloud')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'cloud'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>Cloud Online (Worldwide 🌍)</span>
            </button>
            <button
              onClick={() => setActiveTab('wifi')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'wifi'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Wifi className="w-4 h-4 text-emerald-600" />
              <span>Local Wi-Fi (Offline Ground 📶)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status & Spectator Counter */}
          <div className="flex items-center justify-between bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-200">
                  {activeTab === 'cloud'
                    ? isAlreadyOnCloud
                      ? 'Cloud Broadcast Active (Internet Online)'
                      : 'Cloud Online Mode (Worldwide Spectators)'
                    : 'Local Wi-Fi Network Broadcast'}
                </span>
                <p className="text-[11px] text-slate-400">
                  {activeTab === 'cloud'
                    ? 'Spectators anywhere can watch ball-by-ball updates via 4G/5G/Wi-Fi'
                    : 'Real-time ball-by-ball sync over local ground network'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-semibold shrink-0">
              <Users className="w-3.5 h-3.5" />
              <span>{connectedCount} connected</span>
            </div>
          </div>

          {/* QR Code & Share Section */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="p-3 bg-white rounded-xl shadow-xl border-4 border-slate-800 shrink-0">
              {loading ? (
                <div className="w-[160px] h-[160px] flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
                </div>
              ) : qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Live Score QR Code"
                  className="w-[160px] h-[160px] object-contain rounded-lg"
                />
              ) : (
                <div className="w-[160px] h-[160px] flex flex-col items-center justify-center text-slate-400">
                  <QrCode className="w-10 h-10 mb-2" />
                  <span className="text-xs">Generating QR...</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2.5 w-full">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Scan with phone camera or QR scanner to open live match score</span>
              </div>

              {/* Direct Link Input & Action Buttons */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>{activeTab === 'cloud' ? 'Public Cloud Share URL:' : 'Local Wi-Fi Access URL:'}</span>
                  {activeTab === 'wifi' && (
                    <button
                      onClick={handleRefresh}
                      className="text-[10px] text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Refresh IP
                    </button>
                  )}
                </label>

                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl p-2">
                  <Globe className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
                  <input
                    type="text"
                    readOnly
                    value={activeUrl}
                    placeholder="Generating URL..."
                    className="w-full bg-transparent text-xs font-mono text-emerald-300 select-all outline-none truncate"
                  />
                  <button
                    onClick={() => handleCopy(activeUrl)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  {activeUrl && (
                    <a
                      href={activeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      title="Open in new browser tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Quick WhatsApp Share Button */}
              {activeUrl && (
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `🏏 Watch live cricket scores on Cricbuzz Live: ${activeUrl}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share on WhatsApp & Messenger</span>
                </a>
              )}
            </div>
          </div>

          {/* CLOUD HOSTING TAB CONTENT */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              {/* If on Cloud */}
              {isAlreadyOnCloud ? (
                <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-emerald-300 text-sm">
                      Cloud Deployment Active & Online!
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Your Cricbuzz Live Cricket server is hosted in the cloud. Anyone with your link or QR code can watch live scores anywhere around the world.
                    </p>
                  </div>
                </div>
              ) : (
                /* Cloud Setup Options for Local User */
                <div className="space-y-3">
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white">Custom Cloud / Tunnel URL</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Paste your link to generate QR</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl p-2">
                      <LinkIcon className="w-4 h-4 text-cyan-400 shrink-0 ml-1" />
                      <input
                        type="url"
                        value={customCloudUrl}
                        onChange={(e) => setCustomCloudUrl(e.target.value)}
                        placeholder="https://your-cricket.onrender.com or https://xyz.loca.lt"
                        className="w-full bg-transparent text-xs text-slate-100 placeholder:text-slate-500 outline-none font-mono"
                      />
                      {customCloudUrl && (
                        <button
                          onClick={() => setCustomCloudUrl('')}
                          className="text-[11px] text-slate-400 hover:text-slate-200 px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3 Cloud Hosting Options */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Rocket className="w-4 h-4 text-emerald-400" />
                      3 Free Cloud Hosting Methods for Everyone:
                    </span>

                    {/* Method 1: Instant Tunnel (10 seconds) */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <span>1. Instant Live Cloud Link (10 Seconds - No setup required)</span>
                        </span>
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          Easiest
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Run this in your PC terminal to get an instant public HTTPS link that anyone on 4G/5G mobile internet can open immediately:
                      </p>
                      <div className="flex items-center justify-between bg-slate-900 border border-slate-700/80 rounded-lg p-2 font-mono text-xs text-amber-300">
                        <span className="truncate">npm run cloud</span>
                        <button
                          onClick={() => handleCopyCmd('npm run cloud', 'cmd1')}
                          className="ml-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-sans font-semibold text-slate-200 shrink-0"
                        >
                          {copiedCmd === 'cmd1' ? 'Copied!' : 'Copy Command'}
                        </button>
                      </div>
                    </div>

                    {/* Method 2: Permanent Free Cloud on Render.com */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                          <span>2. Permanent Free Cloud Hosting on Render.com (24/7 Online)</span>
                        </span>
                        <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full font-bold">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Pre-configured <code className="text-emerald-300">render.yaml</code> & <code className="text-emerald-300">server.js</code> are ready!
                      </p>
                      <ol className="list-decimal list-inside text-[11px] text-slate-300 space-y-1">
                        <li>Push this cricket project to your GitHub repository.</li>
                        <li>Go to <a href="https://dashboard.render.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold">render.com</a> & click <strong>New &gt; Web Service</strong>.</li>
                        <li>Select your GitHub repo. Render automatically builds with <code className="text-amber-300 font-mono">npm run build</code> and starts with <code className="text-amber-300 font-mono">npm start</code>!</li>
                        <li>You get a permanent free public link: <span className="text-emerald-300 font-mono">https://your-cricket.onrender.com</span>!</li>
                      </ol>
                    </div>

                    {/* Method 3: Docker / VPS / Railway */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5 text-[11px]">
                      <span className="font-bold text-purple-300">3. Docker / Railway / VPS / Cloud Server:</span>
                      <p className="text-slate-400">
                        Production <code className="text-emerald-300">Dockerfile</code> & <code className="text-emerald-300">server.js</code> are bundled. Run <code className="text-amber-300 font-mono">npm run build && npm start</code> on any cloud Linux server or deploy directly with Railway!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LOCAL WI-FI TAB CONTENT */}
          {activeTab === 'wifi' && (
            <div className="space-y-3">
              {/* Multiple Network Adapters Switcher */}
              {networkInfo && networkInfo.interfaces && networkInfo.interfaces.length > 1 && (
                <div className="space-y-1.5 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
                  <label className="text-[11px] font-semibold text-slate-400">
                    Switch Wi-Fi / Hotspot Network Adapter:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {networkInfo.interfaces.map((iface) => (
                      <button
                        key={`${iface.name}-${iface.ip}`}
                        onClick={() => setSelectedIp(iface.ip)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                          selectedIp === iface.ip
                            ? 'bg-emerald-600 text-white font-semibold shadow-md'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                        }`}
                      >
                        {iface.name}: {iface.ip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Setup Checklist */}
              <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-3 text-[11px] text-emerald-200 space-y-1">
                <span className="font-bold text-emerald-300 uppercase tracking-wider text-[10px]">
                  Local Wi-Fi Connection Steps:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  <li>
                    Connect phone to the <strong>same Wi-Fi router</strong> or connect to this PC&apos;s <strong>Mobile Hotspot</strong>.
                  </li>
                  <li>Scan the QR code or open <span className="font-mono text-emerald-300 font-semibold">{localWifiUrl}</span> in mobile browser.</li>
                  <li>No internet needed! Works 100% offline on the rooftop or stadium court.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Spectator vs Admin Explainer Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Eye className="w-4 h-4" />
                <span>Spectators (Everyone)</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Watch <strong>Live Cricbuzz scores</strong>, ball-by-ball commentary, and standings on any smartphone. Read-only protection prevents score tampering.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Scorer / Umpire Admin</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                The scorer or umpire can log in with the admin password to input runs, wickets, extras, or end match from anywhere!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            {activeTab === 'cloud' ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Cloud Hosting for Everyone
              </span>
            ) : (
              <span>CLI: npm run dev -- --host</span>
            )}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
