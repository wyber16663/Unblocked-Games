import React, { useState, useEffect, useRef } from "react";
import { 
  Gamepad2, 
  Search, 
  Star, 
  Plus, 
  RotateCcw, 
  Maximize, 
  Info, 
  X, 
  PlusCircle, 
  Send,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  Trash2,
  Zap,
  Activity,
  Flame
} from "lucide-react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import gamesData from "./games.json";
import LocalSnake from "./components/LocalSnake";
import LocalTicTacToe from "./components/LocalTicTacToe";

export default function App() {
  // Loaded unblocked games
  const [games, setGames] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("arcade_favorites");
    return saved ? JSON.parse(saved) : [];
  });

  // Current states
  const [activeGame, setActiveGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [reloadKey, setReloadKey] = useState(0); // Trigger reload of active game
  const [fullscreenActive, setFullscreenActive] = useState(false);

  // Forms and Modals
  const [showAddGame, setShowAddGame] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Arcade");
  const [newDescription, setNewDescription] = useState("");
  const [newInstructions, setNewInstructions] = useState("");
  const [newIframeOrUrl, setNewIframeOrUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  // Mock Feedback / Wishlist
  const [wishlistText, setWishlistText] = useState("");
  const [wishlistSubmitted, setWishlistSubmitted] = useState(false);
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem("arcade_wishlist");
    return saved ? JSON.parse(saved) : [];
  });

  const playerContainerRef = useRef(null);

  // Load games (JSON database + localStorage Custom Games)
  useEffect(() => {
    const customSaved = localStorage.getItem("arcade_custom_games");
    const customParsed = customSaved ? JSON.parse(customSaved) : [];
    
    // Merge standard json games with custom user games
    const merged = [...gamesData, ...customParsed];
    setGames(merged);
  }, []);

  // Sync favorites
  const toggleFavorite = (id, e) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(id) 
        ? prev.filter((favId) => favId !== id) 
        : [...prev, id];
      localStorage.setItem("arcade_favorites", JSON.stringify(updated));
      return updated;
    });
  };

  // Handle Dynamic Custom Game Addition
  const handleAddGameSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess(false);

    if (!newTitle.trim() || !newIframeOrUrl.trim()) {
      setFormError("Title and Game Source (Iframe Tag or URL) are required.");
      return;
    }

    // Construct valid iframe tag if a simple URL is provided
    let finalIframeTag = newIframeOrUrl.trim();
    if (!finalIframeTag.startsWith("<iframe")) {
      // Validate it's a valid link format
      if (!finalIframeTag.startsWith("http://") && !finalIframeTag.startsWith("https://")) {
        finalIframeTag = "https://" + finalIframeTag;
      }
      finalIframeTag = `<iframe src="${finalIframeTag}" style="width:100%; height:100%; border:none;" allowfullscreen="true"></iframe>`;
    }

    const newGame = {
      id: "custom-" + Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim() || "A custom unblocked game added by the player.",
      instructions: newInstructions.trim() || "Use default game mechanics.",
      iframeTag: finalIframeTag,
      icon: "Gamepad2",
      plays: 10,
      rating: 5.0,
      isCustom: true
    };

    // Save custom game
    const customSaved = localStorage.getItem("arcade_custom_games");
    const customParsed = customSaved ? JSON.parse(customSaved) : [];
    const updatedCustom = [...customParsed, newGame];
    
    localStorage.setItem("arcade_custom_games", JSON.stringify(updatedCustom));
    setGames([...gamesData, ...updatedCustom]);

    // Clear form
    setNewTitle("");
    setNewCategory("Arcade");
    setNewDescription("");
    setNewInstructions("");
    setNewIframeOrUrl("");
    setFormSuccess(true);
    
    setTimeout(() => {
      setFormSuccess(false);
      setShowAddGame(false);
    }, 2000);
  };

  // Delete Custom Game
  const deleteCustomGame = (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this custom game?")) return;

    const customSaved = localStorage.getItem("arcade_custom_games");
    const customParsed = customSaved ? JSON.parse(customSaved) : [];
    const updatedCustom = customParsed.filter((g) => g.id !== id);

    localStorage.setItem("arcade_custom_games", JSON.stringify(updatedCustom));
    setGames([...gamesData, ...updatedCustom]);

    if (activeGame?.id === id) {
      setActiveGame(null);
    }
  };

  // Handle Game Suggestion Submit
  const handleWishlistSubmit = (e) => {
    e.preventDefault();
    if (!wishlistText.trim()) return;

    const updated = [...wishlist, wishlistText.trim()];
    setWishlist(updated);
    localStorage.setItem("arcade_wishlist", JSON.stringify(updated));
    setWishlistText("");
    setWishlistSubmitted(true);

    setTimeout(() => {
      setWishlistSubmitted(false);
    }, 3000);
  };

  // Clear Suggestion Wishlist
  const clearWishlist = () => {
    setWishlist([]);
    localStorage.removeItem("arcade_wishlist");
  };

  // Request browser Fullscreen on game panel
  const toggleFullscreen = () => {
    const container = playerContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setFullscreenActive(true);
      }).catch((err) => {
        console.error("Error enabling fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
      setFullscreenActive(false);
    }
  };

  // Listen to exit fullscreen events (such as pressing ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreenActive(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Filter and search computation
  const filteredGames = games.filter((game) => {
    const matchesSearch = 
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedCategory === "All") {
      return matchesSearch;
    }
    if (selectedCategory === "Favorites") {
      return favorites.includes(game.id) && matchesSearch;
    }
    if (selectedCategory === "Custom") {
      return game.isCustom && matchesSearch;
    }
    return game.category === selectedCategory && matchesSearch;
  });

  // Get distinct categories
  const categories = ["All", "Favorites", "Arcade", "Puzzle", "Classic", "Custom"];

  // Colors gradients for Bento game cards thumbnails
  const thumbnailsGradients = [
    "from-[#FF0080] to-[#7928CA]", // accent-1 to accent-2
    "from-[#00F2FE] to-[#4FACFE]", // cyan to blue
    "from-[#43E97B] to-[#38F9D7]", // emerald to teal
    "from-[#F6D365] to-[#FDA085]", // gold to orange
    "from-[#FA709A] to-[#FEE140]", // pink to yellow
    "from-[#667EEA] to-[#764BA2]", // indigo to purple
    "from-[#10B981] to-[#059669]", // green to dark green
    "from-[#EC4899] to-[#8B5CF6]", // pink to purple alternative
  ];

  // Helper to render lucide icons dynamically
  const renderGameIcon = (iconName, className = "w-10 h-10") => {
    const IconComponent = Icons[iconName] || Gamepad2;
    return <IconComponent className={className} />;
  };

  // High-traffic trending simulation
  const trendingGames = [...games]
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-bg text-[#F8FAFC] flex flex-col selection:bg-accent-2 selection:text-white">
      
      {/* Top Retro Banner */}
      <div className="bg-[#1E293B]/50 border-b border-white/5 py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2 text-xs font-mono text-text-dim">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-4 animate-pulse" />
            <span className="text-accent-4 font-bold uppercase tracking-wider">Arcade Status: Online</span>
            <span className="text-white/10">|</span>
            <span>{gamesData.length} Core Games &bull; {games.length - gamesData.length} Loaded Customs</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-accent-1">⚡ Dynamic Sandbox Mode</span>
            <span className="text-white/10">|</span>
            <span className="text-accent-3 font-semibold">🚫 100% Ad-Free Play</span>
          </div>
        </div>
      </div>

      {/* Main Core Header */}
      <header className="border-b-2 border-white/5 bg-[#1E293B]/40 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo / Title (Gradient logo matching UNBLOCK.io style) */}
          <div 
            onClick={() => setActiveGame(null)} 
            className="flex items-center gap-3 cursor-pointer group select-none"
            id="arcade-logo"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-1 to-accent-2 flex items-center justify-center shadow-lg shadow-accent-2/20 group-hover:scale-105 transition-all duration-200">
              <Gamepad2 className="w-6 h-6 text-white stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-accent-1 to-accent-2">
                UNBLOCK.io
              </h1>
              <p className="text-[10px] text-text-dim font-mono uppercase tracking-widest group-hover:text-accent-1 transition-colors">
                Play School & Work &bull; Local Sandbox
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="w-full md:w-[400px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
            <input
              type="text"
              placeholder="Search 1,200+ unblocked games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border-2 border-white/10 focus:border-accent-2/60 rounded-xl py-2.5 pl-11 pr-10 text-sm text-[#F8FAFC] placeholder-text-dim focus:outline-none transition-all font-sans"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-dim hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Links */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddGame(!showAddGame)}
              className="flex items-center gap-2 bg-gradient-to-r from-accent-1 to-accent-2 hover:opacity-95 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all shadow-md shadow-accent-2/20 cursor-pointer"
              id="btn-add-custom-game"
            >
              <PlusCircle className="w-4.5 h-4.5" />
              UPLOAD GAME
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Dynamic Modal / Accordion for Custom Game Addition */}
        <AnimatePresence>
          {showAddGame && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-card border border-accent-1/20 rounded-2xl p-6 shadow-2xl glow-primary"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-base font-bold text-accent-1 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Load Custom Sandbox Game Feed
                  </h3>
                  <p className="text-xs text-text-dim mt-1">
                    Inject unblocked game scripts, frames, or custom URLs directly into your catalog. Saved safely on your device.
                  </p>
                </div>
                <button 
                  onClick={() => setShowAddGame(false)}
                  className="p-1.5 text-text-dim hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleAddGameSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-text-dim mb-1">Game Title *</label>
                    <input
                      type="text"
                      placeholder="e.g., Slope, Moto X3M"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-[#0F172A] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-accent-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-text-dim mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-[#0F172A] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-accent-2 outline-none"
                    >
                      <option value="Arcade">🕹️ Arcade</option>
                      <option value="Puzzle">🧠 Puzzle</option>
                      <option value="Classic">📺 Classic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-text-dim mb-1">Gameplay Description</label>
                    <input
                      type="text"
                      placeholder="A short tagline explaining the game..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full bg-[#0F172A] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-accent-2 outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-text-dim mb-1">Embed Tag / Frame Source URL *</label>
                    <textarea
                      placeholder="e.g., https://example.com/game OR <iframe> tag code"
                      rows={4}
                      value={newIframeOrUrl}
                      onChange={(e) => setNewIframeOrUrl(e.target.value)}
                      className="w-full bg-[#0F172A] border border-white/10 rounded-lg p-2.5 text-xs text-[#F8FAFC] focus:border-accent-2 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-text-dim mb-1">Control Keys (Instructions)</label>
                    <input
                      type="text"
                      placeholder="e.g., WASD to steer, SPACE to jump"
                      value={newInstructions}
                      onChange={(e) => setNewInstructions(e.target.value)}
                      className="w-full bg-[#0F172A] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-accent-2 outline-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 flex flex-col sm:flex-row justify-between items-center pt-3 border-t border-white/5 gap-3">
                  <div className="text-xs">
                    {formError && <p className="text-[#FF0080]">⚠️ {formError}</p>}
                    {formSuccess && (
                      <p className="text-accent-4 flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4.5 h-4.5" /> Successfully registered to local catalog database!
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 self-end">
                    <button
                      type="button"
                      onClick={() => setShowAddGame(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-accent-2 hover:bg-accent-2/90 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Save Game
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* THEATER MODE (Play Arena Active View) */}
        <AnimatePresence mode="wait">
          {activeGame && (
            <motion.div
              key={activeGame.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-card border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row"
              id="game-theater"
            >
              {/* Left Column: Iframe Game Frame (Takes up largest area) */}
              <div 
                ref={playerContainerRef}
                className="flex-1 bg-black relative flex flex-col justify-between h-[380px] sm:h-[480px] lg:h-[580px] border-b lg:border-b-0 lg:border-r border-white/5"
              >
                {/* Embedded Game Stage */}
                <div className="flex-1 w-full h-full relative" key={reloadKey}>
                  {activeGame.iframeTag === "LOCAL_SNAKE" ? (
                    <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                      <LocalSnake />
                    </div>
                  ) : activeGame.iframeTag === "LOCAL_TICTACTOE" ? (
                    <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                      <LocalTicTacToe />
                    </div>
                  ) : (
                    <div 
                      className="w-full h-full block"
                      dangerouslySetInnerHTML={{ __html: activeGame.iframeTag }}
                    />
                  )}
                </div>

                {/* Micro Theater Game Controller HUD */}
                <div className="bg-[#0F172A] p-4 px-6 border-t border-white/5 flex justify-between items-center text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <span className="bg-accent-2 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                      {activeGame.category}
                    </span>
                    <h2 className="text-[#F8FAFC] font-bold hidden sm:inline">{activeGame.title}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFavorite(activeGame.id)}
                      className={`flex items-center gap-1.5 p-1.5 px-3 rounded-lg border transition-all cursor-pointer ${
                        favorites.includes(activeGame.id)
                          ? "bg-amber-500/20 border-amber-500 text-amber-400"
                          : "bg-card border-white/10 text-text-dim hover:text-white"
                      }`}
                      title={favorites.includes(activeGame.id) ? "Remove from Favorites" : "Save to Favorites"}
                    >
                      <Star className={`w-4 h-4 ${favorites.includes(activeGame.id) ? "fill-amber-500 text-amber-500" : ""}`} />
                      <span className="text-[10px] uppercase font-bold tracking-wider hidden sm:inline">
                        {favorites.includes(activeGame.id) ? "Saved" : "Favorite"}
                      </span>
                    </button>

                    <button
                      onClick={() => setReloadKey((prev) => prev + 1)}
                      className="p-1.5 bg-card border border-white/10 hover:border-white/20 rounded-lg text-text-dim hover:text-white transition-colors cursor-pointer"
                      title="Reset / Reload Game Frame"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={toggleFullscreen}
                      className="p-1.5 bg-card border border-white/10 hover:border-white/20 rounded-lg text-text-dim hover:text-white transition-colors cursor-pointer"
                      title={fullscreenActive ? "Exit Fullscreen" : "Fullscreen Theatre Mode"}
                    >
                      <Maximize className="w-4 h-4" />
                    </button>

                    <span className="text-white/10 mx-1">|</span>

                    <button
                      onClick={() => setActiveGame(null)}
                      className="bg-[#FF0080] hover:bg-[#FF0080]/90 text-white font-bold p-1.5 px-3 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span className="text-[10px] font-mono tracking-widest hidden sm:inline">CLOSE</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Game details sidebar panel */}
              <div className="w-full lg:w-80 bg-[#1E293B]/70 p-6 flex flex-col justify-between gap-6 max-h-[580px] overflow-y-auto">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-white">{activeGame.title}</h3>
                      <p className="text-xs text-text-dim font-mono mt-1">ID: {activeGame.id}</p>
                    </div>
                    {activeGame.isCustom && (
                      <span className="text-[10px] bg-accent-1/20 border border-accent-1 text-accent-1 font-bold px-2 py-0.5 rounded-md">
                        Custom User Game
                      </span>
                    )}
                  </div>

                  <div className="border-t border-white/5 pt-3 flex items-center gap-6">
                    <div>
                      <p className="text-[9px] text-text-dim font-mono uppercase">Rating</p>
                      <p className="text-sm font-bold text-yellow-400 font-mono">⭐ {activeGame.rating.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-text-dim font-mono uppercase">Plays</p>
                      <p className="text-sm font-bold text-[#F8FAFC] font-mono">{(activeGame.plays + (favorites.includes(activeGame.id) ? 12 : 0)).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3">
                    <p className="text-[10px] text-text-dim font-mono uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-accent-2" /> Game Description
                    </p>
                    <p className="text-xs text-text-dim leading-relaxed font-sans">{activeGame.description}</p>
                  </div>

                  <div className="border-t border-white/5 pt-3">
                    <p className="text-[10px] text-text-dim font-mono uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Gamepad2 className="w-4 h-4 text-accent-3" /> Instructions / Controls
                    </p>
                    <p className="text-xs text-[#F8FAFC] leading-relaxed bg-[#0F172A] p-3 rounded-xl border border-white/5 font-mono">
                      {activeGame.instructions}
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 flex flex-col gap-2">
                  <p className="text-[10px] text-text-dim font-mono leading-relaxed">
                    🚨 <strong>Unblocked Sandbox Tip:</strong> If the frame fails to load, verify your local internet connection. Added custom feeds operate 100% locally.
                  </p>
                  {activeGame.isCustom && (
                    <button
                      onClick={(e) => deleteCustomGame(activeGame.id, e)}
                      className="w-full bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 text-red-400 py-2.5 rounded-xl text-xs font-bold transition-all mt-2 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      DELETE CUSTOM GAME
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories Bar (Rounded Pills matching Design Active/Inactive styles) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          <div className="flex flex-wrap gap-2.5 max-w-full overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                  }}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? "bg-accent-2 text-white border border-accent-2 shadow-lg shadow-accent-2/20 scale-105" 
                      : "bg-card text-text-dim border border-white/5 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {cat === "All" && "🌐 All Games"}
                  {cat === "Favorites" && "⭐ Favorites"}
                  {cat === "Arcade" && "🕹️ Arcade"}
                  {cat === "Puzzle" && "🧠 Puzzle"}
                  {cat === "Classic" && "📺 Classic"}
                  {cat === "Custom" && "💾 Custom Catalog"}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-text-dim font-mono hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              {favorites.length} Favorites Saved
            </span>
            <span className="text-white/10">&bull;</span>
            <span className="text-[#F8FAFC] font-semibold">{filteredGames.length} Game{filteredGames.length !== 1 ? 's' : ''} Listed</span>
          </div>
        </div>

        {/* Dynamic Dual Grid Column Layout: Main Bento Area + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Main Games Column (Bento Cards Area) */}
          <div className="lg:col-span-3 flex flex-col gap-6">

            {/* Empty Catalog Fallback */}
            {filteredGames.length === 0 && (
              <div className="bg-card border border-white/5 rounded-2xl py-16 px-4 text-center max-w-md mx-auto w-full">
                <Gamepad2 className="w-12 h-12 text-text-dim mx-auto mb-3" />
                <h4 className="text-white font-bold text-base">No Games Found</h4>
                <p className="text-xs text-text-dim mt-1.5 max-w-xs mx-auto leading-relaxed">
                  {selectedCategory === "Favorites" 
                    ? "Bookmark classic web games inside the arcade. Just click the star bookmark icon on any game card!"
                    : selectedCategory === "Custom"
                    ? "No user games loaded yet. Fill your unblocked inventory with custom game URLs using the 'Upload Game' trigger above!"
                    : "No games matches your searching parameter. Clear your query filter to view all catalogs."}
                </p>
                {selectedCategory === "Favorites" && (
                  <button
                    onClick={() => setSelectedCategory("All")}
                    className="mt-5 bg-accent-2 hover:bg-accent-2/95 text-white text-xs font-bold py-2 px-5 rounded-full transition-all cursor-pointer"
                  >
                    Browse All Games
                  </button>
                )}
              </div>
            )}

            {/* GAMES BENTO GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {filteredGames.map((game, index) => {
                const isFav = favorites.includes(game.id);
                const isActive = activeGame?.id === game.id;
                
                return (
                  <motion.div
                    key={game.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                    onClick={() => {
                      setActiveGame(game);
                      // Scroll slightly to the player if it's not already visible
                      setTimeout(() => {
                        const theaterEl = document.getElementById("game-theater");
                        if (theaterEl) {
                          theaterEl.scrollIntoView({ behavior: "smooth", block: "center" });
                        }
                      }, 100);
                    }}
                    className={`group bg-card border p-4 rounded-[20px] cursor-pointer transition-all flex flex-col justify-between gap-4 select-none ${
                      isActive 
                        ? "border-accent-2 ring-2 ring-accent-2/10 shadow-lg shadow-accent-2/10" 
                        : "border-white/5 hover:border-white/10 hover:shadow-xl hover:shadow-black/20"
                    }`}
                  >
                    <div>
                      {/* Dynamic Bento Thumbnail with High-Vibrancy Gradient */}
                      <div className={`h-[140px] rounded-xl mb-3 flex items-center justify-center text-4xl bg-gradient-to-br ${thumbnailsGradients[index % thumbnailsGradients.length]} relative overflow-hidden shadow-inner group-hover:scale-[1.02] transition-transform duration-200`}>
                        {/* Floating blur ring inside thumbnail */}
                        <div className="absolute -inset-10 bg-white/5 rounded-full blur-2xl" />
                        
                        {/* Floating game icon in the center */}
                        <div className="relative text-white filter drop-shadow-lg scale-110">
                          {renderGameIcon(game.icon, "w-12 h-12")}
                        </div>

                        {/* Glass Category Badge */}
                        <span className="absolute top-2.5 right-2.5 bg-black/40 backdrop-blur-md text-[10px] text-white font-mono px-2 py-0.5 rounded-md border border-white/10 uppercase tracking-widest font-bold">
                          {game.category}
                        </span>

                        {/* Overlay Hover Effect: Fades in PLAY button overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 backdrop-blur-[2px]">
                          <span className="bg-white text-[#1E293B] font-black text-xs px-4 py-2 rounded-xl shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                            PLAY {game.title.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Title and Description */}
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-sm font-bold text-white group-hover:text-accent-3 transition-colors flex items-center gap-1.5">
                          {game.title}
                          {game.isCustom && (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-1" title="Custom Game" />
                          )}
                        </h3>
                        <div className="flex items-center">
                          <button
                            onClick={(e) => toggleFavorite(game.id, e)}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              isFav
                                ? "text-amber-500 hover:text-amber-400"
                                : "text-text-dim hover:text-amber-500"
                            }`}
                            title="Favorite"
                          >
                            <Star className={`w-4.5 h-4.5 ${isFav ? "fill-amber-500" : ""}`} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-text-dim mt-1.5 leading-relaxed line-clamp-2">
                        {game.description}
                      </p>
                    </div>

                    {/* Footer details: Rating & Play trigger aligned to mock style */}
                    <div className="flex justify-between items-center pt-3 border-t border-white/5 text-[11px] font-mono">
                      <div className="flex gap-2.5 text-text-dim">
                        <span>⭐ {game.rating.toFixed(1)}</span>
                        <span>🕹️ {(game.plays + (isFav ? 12 : 0)).toLocaleString()} plays</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {game.isCustom && (
                          <button
                            onClick={(e) => deleteCustomGame(game.id, e)}
                            className="p-1 text-[#FF0080]/60 hover:text-[#FF0080] hover:bg-[#FF0080]/10 rounded transition-colors cursor-pointer"
                            title="Delete Custom"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Play button strictly following --accent-3 (cyan) */}
                        <button className="bg-accent-3 hover:bg-accent-3/90 text-white font-bold py-1.5 px-3 rounded-lg text-[11px] cursor-pointer shadow-sm">
                          PLAY
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

          </div>

          {/* Right Column: Trending Now & Custom Sandbox Feed console */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Trending Now Sidebar matching exactly the Design HTML */}
            <div className="bg-card border-2 border-white/5 rounded-3xl p-6 shadow-xl flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-accent-1 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Flame className="w-4.5 h-4.5 text-accent-1 animate-pulse" />
                  Trending Now
                </h4>
                <span className="text-[10px] bg-accent-1/10 text-accent-1 font-mono font-bold px-2 py-0.5 rounded-full">
                  HOT
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {trendingGames.map((game, idx) => (
                  <div 
                    key={game.id}
                    onClick={() => {
                      setActiveGame(game);
                      setTimeout(() => {
                        const theaterEl = document.getElementById("game-theater");
                        if (theaterEl) {
                          theaterEl.scrollIntoView({ behavior: "smooth", block: "center" });
                        }
                      }, 100);
                    }}
                    className="flex gap-3.5 items-center p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="text-2xl font-black text-white/10 w-7 text-center font-mono">
                      {`0${idx + 1}`}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-white group-hover:text-accent-3 transition-colors truncate">
                        {game.title}
                      </h5>
                      <p className="text-[10px] text-text-dim font-mono truncate">
                        {(game.plays + 120).toLocaleString()} Players &bull; {game.category}
                      </p>
                    </div>

                    <div className="text-xs text-yellow-400 font-mono">
                      ★{game.rating.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 pt-4 border-t border-white/5 bg-white/5 p-4 rounded-2xl text-center">
                <p className="text-[11px] text-[#F8FAFC] font-semibold mb-2">New Games Every Friday</p>
                <button 
                  onClick={() => alert("Connecting you to local school network unblocked servers... Perfect state saved.")}
                  className="w-full py-2 bg-accent-2 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer active:scale-95"
                >
                  Save Workspace
                </button>
              </div>
            </div>

            {/* Retro Game Suggestion Console */}
            <section className="bg-card border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <HelpCircle className="w-4 h-4 text-accent-3" />
                  Wishlist Feed
                </h4>
                <p className="text-[11px] text-text-dim mt-1 leading-relaxed">
                  Can't find a retro unblocked game? Suggest a title to load!
                </p>
              </div>

              <form onSubmit={handleWishlistSubmit} className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Type game name..."
                  value={wishlistText}
                  onChange={(e) => setWishlistText(e.target.value)}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-text-dim focus:outline-none focus:border-accent-2"
                />
                <button
                  type="submit"
                  className="bg-[#0F172A] hover:bg-slate-800 text-[#F8FAFC] hover:text-white py-2 rounded-xl text-xs font-mono font-bold transition-all border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  SUGGEST
                </button>
              </form>

              {/* Wishlist display */}
              {wishlist.length > 0 && (
                <div className="pt-2 border-t border-white/5">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[9px] text-text-dim font-mono uppercase tracking-widest">WISHED GAMES</p>
                    <button 
                      onClick={clearWishlist}
                      className="text-[9px] text-accent-1 font-mono hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {wishlist.map((item, idx) => (
                      <span 
                        key={idx} 
                        className="text-[10px] bg-[#0F172A] border border-white/5 px-2 py-0.5 rounded-md text-accent-3 font-mono flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-accent-4" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

          </div>

        </div>

      </main>

      {/* Footer copyright and diagnostics matching Design HTML style */}
      <footer className="bg-card border-t border-white/5 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono text-text-dim">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4.5 h-4.5 text-accent-1" />
            <span>&copy; 2026 UNBLOCK.io - Play Games at School & Work. Built-In Offline Sandbox.</span>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span>Privacy Policy</span>
            <span className="text-white/10">|</span>
            <span>Terms of Service</span>
            <span className="text-white/10">|</span>
            <span>DMCA</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
