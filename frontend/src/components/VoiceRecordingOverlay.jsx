import { Mic, X } from 'lucide-react';
export default function VoiceRecordingOverlay({ transcript, onStop, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-slide-up">
      {}
      <button
        onClick={onCancel}
        className="absolute top-6 right-6 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
        title="Cancel"
      >
        <X className="w-6 h-6" />
      </button>
      {}
      <div className="relative mb-8">
        {}
        <div className="absolute inset-0 w-32 h-32 -m-4 rounded-full bg-red-500/10 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-0 w-28 h-28 -m-2 rounded-full bg-red-500/15 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
        {}
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-xl shadow-red-500/30 cursor-pointer hover:scale-105 transition-transform"
          onClick={onStop}
        >
          <Mic className="w-10 h-10 text-white" />
        </div>
      </div>
      {}
      <div className="text-center mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-lg font-medium">Listening...</span>
        </div>
        <p className="text-white/50 text-sm">Tap the mic or press Escape to stop</p>
      </div>
      {}
      {transcript && (
        <div className="max-w-md w-full mx-4 px-5 py-3 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md">
          <p className="text-xs text-white/40 mb-1 uppercase tracking-wider font-medium">Live Transcript</p>
          <p className="text-white text-sm leading-relaxed">{transcript}</p>
        </div>
      )}
    </div>
  );
}