import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clapperboard, Send, Sparkles, Film, Loader2, RotateCcw, Copy, Check, History, Monitor } from 'lucide-react';
import { getMovieRecommendations, CineResponse, MovieRecommendation } from './services/geminiService';

interface HistoryItem {
  mood: string;
  industry: string;
  energyLevel: number;
  streamingService: string;
  result: CineResponse;
  timestamp: number;
}

export default function App() {
  const [mood, setMood] = useState('');
  const [industry, setIndustry] = useState('Hollywood');
  const [energyLevel, setEnergyLevel] = useState(50);
  const [streamingService, setStreamingService] = useState('Netflix');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cineaste_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveHistory = (newItem: HistoryItem) => {
    const updated = [newItem, ...history].slice(0, 5);
    setHistory(updated);
    localStorage.setItem('cineaste_history', JSON.stringify(updated));
  };

  const handleRecommend = async (retryMood?: string) => {
    const targetMood = typeof retryMood === 'string' ? retryMood : mood;
    if (!targetMood || !targetMood.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await getMovieRecommendations(targetMood, industry, energyLevel, streamingService);
      setResult(data);
      if (!retryMood) {
        saveHistory({
          mood: targetMood,
          industry,
          energyLevel,
          streamingService,
          result: data,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      setError("CineMood's projector seems stuck. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setMood(item.mood);
    setIndustry(item.industry);
    setEnergyLevel(item.energyLevel);
    setStreamingService(item.streamingService);
    setResult(item.result);
    setShowHistory(false);
  };

  const reset = () => {
    setMood('');
    setResult(null);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="atmosphere" />
      
      <div className="w-full max-w-6xl h-full flex flex-col gap-12 z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 relative">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-1"
          >
            <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-white/40">Mood Curation Engine</p>
            <h1 className="text-5xl font-serif italic text-white leading-tight">The Cineaste</h1>
          </motion.div>

          <div className="flex items-end gap-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${showHistory ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'}`}
              title="Recent Moods"
            >
              <History className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {mood && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-right"
                >
                  <p className="text-[10px] opacity-40 uppercase tracking-widest mb-2 font-mono">Current Frequency</p>
                  <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-xl backdrop-blur-sm flex items-center gap-3">
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/60 uppercase tracking-tighter">{industry}</span>
                    <span className="text-sm italic font-serif text-white/80">"{mood}"</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* History Sidebar/Dropdown Overlay */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full right-0 mt-4 w-64 glass-card rounded-2xl z-50 p-4 border-white/20"
              >
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-4 font-bold border-b border-white/10 pb-2">Recent Journeys</p>
                {history.length === 0 ? (
                  <p className="text-xs text-white/20 py-4 text-center italic">No history yet</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <button
                        key={item.timestamp}
                        onClick={() => loadFromHistory(item)}
                        className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition-all group"
                      >
                        <p className="text-white text-xs font-serif italic truncate">"{item.mood}"</p>
                        <p className="text-[8px] text-white/30 uppercase tracking-widest mt-1">
                          {item.industry} &bull; {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <main className="flex-1 w-full">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="input-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card max-w-2xl mx-auto p-10 rounded-[32px] relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
                
                <div className="relative z-10 space-y-8 text-center md:text-left">
                  <div>
                    <h2 className="text-2xl font-serif italic mb-2">How do you feel?</h2>
                    <p className="text-sm text-white/40 mb-6">Describe your emotional state or situation to find your cinematic match.</p>
                    
                    <textarea
                      ref={inputRef}
                      id="mood-input"
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      placeholder="e.g., Quiet melancholy on a rainy evening..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all resize-none h-40 font-serif italic"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleRecommend();
                        }
                      }}
                    />
                  </div>

                  {/* Frequency Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/30">Energy Frequency</p>
                        <span className="text-[10px] font-mono text-indigo-400">{energyLevel}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={energyLevel}
                        onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                      <div className="flex justify-between text-[8px] uppercase tracking-widest text-white/20 font-bold">
                        <span>Needs Sleep</span>
                        <span>Needs Adrenaline</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/30">Streaming Realm</p>
                      <div className="relative">
                        <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <select
                          value={streamingService}
                          onChange={(e) => setStreamingService(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white appearance-none focus:outline-none focus:border-white/30 transition-all cursor-pointer"
                        >
                          {['Netflix', 'Prime Video', 'Disney+', 'Apple TV', 'Hulu', 'Jio Hotstar', 'Any Service'].map(s => (
                            <option key={s} value={s} className="bg-slate-900">{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/30 text-center md:text-left">Select Cinema Realm</p>
                    <div className="flex gap-2 flex-wrap justify-center md:justify-start">
                      {[
                        'Hollywood', 
                        'Indian Cinema (Bollywood/Tollywood)', 
                        'Japanese Cinema (Eiga)', 
                        'South Korean Cinema (Hallyuwood)', 
                        'Chinese Cinema', 
                        'British Cinema', 
                        'French Cinema', 
                        'Nollywood (Nigeria)',
                        'German Cinema',
                        'Mexican Cinema',
                        'Australian Cinema'
                      ].map((ind) => (
                        <button
                          key={ind}
                          onClick={() => setIndustry(ind)}
                          className={`text-[10px] px-4 py-1.5 rounded-full border transition-all cursor-pointer font-serif italic ${
                            industry === ind 
                              ? 'bg-white text-black border-white' 
                              : 'bg-transparent text-white/40 border-white/10 hover:border-white/30'
                          }`}
                        >
                          {ind}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div className="flex gap-3 flex-wrap justify-center">
                      {['Melancholic', 'Restless', 'Euphoric', 'Nostalgic'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMood(m)}
                          className="text-[10px] font-mono border border-white/10 bg-white/5 text-white/50 px-4 py-1.5 rounded-full hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest cursor-pointer"
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => handleRecommend()}
                      disabled={!mood.trim() || isLoading}
                      className="flex items-center gap-2 bg-white text-black font-bold px-10 py-4 rounded-full uppercase tracking-widest text-xs hover:bg-indigo-100 disabled:opacity-50 disabled:bg-white/20 disabled:text-white/20 transition-all cursor-pointer shadow-xl"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {isLoading ? 'Scanning' : 'Curate'}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="mt-6 text-red-400 text-[10px] font-mono text-center uppercase tracking-widest">{error}</p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="results-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-12"
              >
                {result.acknowledgment && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-xl mx-auto text-[11px] uppercase tracking-[0.2em] text-white/40 text-center italic border-b border-white/5 pb-4"
                  >
                    {result.acknowledgment}
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {result.recommendations.map((movie, idx) => (
                    <MovieCard key={movie.title} movie={movie} delay={idx * 0.15} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="flex flex-col md:flex-row justify-between items-center border-t border-white/5 pt-8 gap-6">
          <p className="text-[10px] opacity-30 tracking-[0.2em] uppercase font-semibold">
            Curated specifically for your emotional frequency
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={() => handleRecommend(mood)}
              className="text-[10px] border border-white/20 px-8 py-3 rounded-full uppercase tracking-[0.15em] hover:bg-white/5 transition-all text-white/70 hover:text-white cursor-pointer font-bold"
            >
              Refine Mood
            </button>
            <button
              onClick={reset}
              className="text-[10px] bg-white text-black font-bold px-8 py-3 rounded-full uppercase tracking-[0.15em] shadow-lg hover:bg-indigo-50 transition-all cursor-pointer"
            >
              New Session
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function MovieCard({ movie, delay }: { movie: MovieRecommendation; delay: number; key?: string | number }) {
  const [copied, setCopied] = useState(false);
  const gradientColors = [
    'from-orange-500/10',
    'from-blue-500/10',
    'from-purple-500/10'
  ];
  const colorIndex = Math.floor(delay * 10) % gradientColors.length;

  const copyToClipboard = () => {
    const text = `${movie.title} (${movie.year})\nVibe: ${movie.vibe}\nStreaming: ${movie.streamingPlatform}\n\n${movie.explanation}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8, ease: "easeOut" }}
      className="glass-card group h-[580px] rounded-[32px] p-10 flex flex-col justify-end relative overflow-hidden transition-all border-white/10 hover:border-white/20"
    >
      <div className={`absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b ${gradientColors[colorIndex]} to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-700`} />
      
      <div className="absolute top-8 right-8 z-20 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        <button
          onClick={copyToClipboard}
          className="p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white transition-all cursor-pointer"
          title="Copy Recommendation"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="space-y-6 relative z-10 transition-transform duration-500 group-hover:translate-y-[-10px]">
        <div className="flex flex-wrap gap-2">
          <div className="vibe-tag">{movie.vibe}</div>
          <div className="text-[8px] uppercase tracking-widest text-indigo-300 border border-indigo-300/30 px-3 py-1 rounded-full font-bold flex items-center gap-1 bg-indigo-300/5">
            <Monitor className="w-2.5 h-2.5" />
            {movie.streamingPlatform}
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-serif italic text-white leading-none tracking-tight">
            {movie.title.replace(/\s*\(\d{4}\)\s*/, '')}
          </h2>
          <p className="text-[10px] opacity-40 uppercase tracking-[0.2em] font-mono leading-none">
            {movie.year.match(/\((.*?)\)/)?.[1] || movie.year} &bull; Cinematic Match
          </p>
        </div>

        <p className="movie-explanation">
          {movie.explanation}
        </p>
      </div>
    </motion.div>
  );
}
