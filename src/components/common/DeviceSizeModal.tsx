import React from 'react';
import {
  Smartphone,
  Monitor,
  HardDrive,
  Download,
  CheckCircle,
  X,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

interface DeviceSizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMobilePreview: boolean;
  onToggleMobilePreview: () => void;
}

export const DeviceSizeModal: React.FC<DeviceSizeModalProps> = ({
  isOpen,
  onClose,
  isMobilePreview,
  onToggleMobilePreview
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Smartphone className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">Desktop & Mobile App Sizes</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Responsive Design • Device Dimensions • PWA Install Specifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Quick Preview Mode Switcher */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Current View Mode:</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                    isMobilePreview
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {isMobilePreview ? '📱 Mobile App Simulator (390px)' : '🖥️ Full Desktop Screen'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                You can toggle the device preview frame directly on your desktop screen.
              </p>
            </div>
            <button
              onClick={onToggleMobilePreview}
              className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all shadow-md active:scale-95 shrink-0 ${
                isMobilePreview
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
              }`}
            >
              {isMobilePreview ? (
                <>
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  <span>Switch to Desktop View</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4" />
                  <span>Preview as Mobile Phone App</span>
                </>
              )}
            </button>
          </div>

          {/* Device Size Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Desktop Specs */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm mb-3">
                <Monitor className="w-4 h-4" />
                <span>Desktop & Laptop View</span>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Target Widths:</span>
                  <span className="font-semibold text-white">1024px – 2560px (HD, FHD, 4K)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Scorer Layout:</span>
                  <span className="font-semibold text-emerald-300">2-Column (Sticky Keypad)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Table Displays:</span>
                  <span className="font-semibold text-white">Full stats (NRR, 4s, SR, Econ)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Navigation:</span>
                  <span className="font-semibold text-white">Top header with tournament pill</span>
                </div>
              </div>
            </div>

            {/* Mobile Specs */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm mb-3">
                <Smartphone className="w-4 h-4" />
                <span>Mobile Smartphone App</span>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Target Widths:</span>
                  <span className="font-semibold text-white">360px – 430px (iPhone, Android)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Scorer Layout:</span>
                  <span className="font-semibold text-amber-300">Vertical Single Column</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Touch Controls:</span>
                  <span className="font-semibold text-white">Min 48px height touch keys</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Navigation:</span>
                  <span className="font-semibold text-white">Bottom fixed thumb bar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bundle & Storage Footprint */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm mb-3">
              <HardDrive className="w-4 h-4" />
              <span>Application Download & Memory Size</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">HTML Core</div>
                <div className="text-base font-black text-white mt-0.5">0.6 KB</div>
                <div className="text-[10px] text-emerald-400">Gzip</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">CSS Styles</div>
                <div className="text-base font-black text-white mt-0.5">11.2 KB</div>
                <div className="text-[10px] text-emerald-400">Gzip</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">JS Engine</div>
                <div className="text-base font-black text-white mt-0.5">120.9 KB</div>
                <div className="text-[10px] text-emerald-400">Gzip</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Download</div>
                <div className="text-base font-black text-amber-400 mt-0.5">~132 KB</div>
                <div className="text-[10px] text-amber-300">Ultra-Lightweight</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 text-center">
              ⚡ Loads in under <strong>50ms</strong> on mobile connections. Database runs entirely in browser LocalStorage with zero cloud latency.
            </p>
          </div>

          {/* Installation Instructions (PWA) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm mb-3">
              <Download className="w-4 h-4" />
              <span>How to Install on Mobile & Desktop</span>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Android (Chrome / Samsung Internet):</strong> Tap browser menu (three dots <code className="text-slate-400">⋮</code>) and select <span className="text-amber-300 font-semibold">"Install app"</span> or <span className="text-amber-300 font-semibold">"Add to Home screen"</span>.
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">iPhone / iPad (Safari):</strong> Tap the Share button <code className="text-slate-400">[↑]</code> at bottom and tap <span className="text-amber-300 font-semibold">"Add to Home Screen"</span>.
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Windows / Mac (Chrome / Edge):</strong> Click the install icon <code className="text-slate-400">⊕</code> on the right side of the address bar to install as a standalone desktop application.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
