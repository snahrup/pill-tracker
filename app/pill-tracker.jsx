import React, { useState, useEffect, useRef } from 'react';

export default function PillTracker() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [laps, setLaps] = useState([]);
  const [pillCount, setPillCount] = useState(1);
  const [showPillInput, setShowPillInput] = useState(false);
  const [pillsRemaining, setPillsRemaining] = useState(null);
  const [initialPillCount, setInitialPillCount] = useState(10);
  const [theme, setTheme] = useState('dark');
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Calculate total elapsed time from actual timestamps
  const calculateTotalTimeFromTimestamps = (lapsArray) => {
    if (lapsArray.length === 0) return 0;
    if (lapsArray.length === 1) return 0; // First dose, no time elapsed yet

    // Sum up all the actual time differences between consecutive doses
    const firstDoseTime = lapsArray[0].actualTimestamp;
    const lastDoseTime = lapsArray[lapsArray.length - 1].actualTimestamp;
    return lastDoseTime - firstDoseTime;
  };

  // Theme configuration
  const themes = {
    dark: {
      bg: '#000',
      text: '#fff',
      textSecondary: '#808080',
      textTertiary: '#666',
      cardBg: '#1A1A1A',
      buttonBg: '#1A1A1A',
      buttonBgActive: '#252525',
      border: '#333',
      borderSecondary: '#252525',
      inputBg: 'rgb(17 24 39)',
      inputBorder: 'rgb(55 65 81)',
      modalOverlay: 'rgba(0, 0, 0, 0.8)',
      modalBg: '#000',
      modalBorder: 'rgb(31 41 55)',
      chartBg: 'rgba(128, 128, 128, 0.12)',
      statusBar: 'black-translucent'
    },
    light: {
      bg: '#fff',
      text: '#000',
      textSecondary: '#808080',
      textTertiary: '#999',
      cardBg: '#f5f5f5',
      buttonBg: '#f5f5f5',
      buttonBgActive: '#e8e8e8',
      border: '#ddd',
      borderSecondary: '#e8e8e8',
      inputBg: 'rgb(243 244 246)',
      inputBorder: 'rgb(209 213 219)',
      modalOverlay: 'rgba(255, 255, 255, 0.8)',
      modalBg: '#fff',
      modalBorder: 'rgb(229 231 235)',
      chartBg: 'rgba(209, 213, 219, 0.08)',
      statusBar: 'default'
    }
  };

  const currentTheme = themes[theme];

  // Load theme preference on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('pillTrackerTheme');
      if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
        setTheme(savedTheme);
      } else {
        // Default to dark theme
        setTheme('dark');
      }
    } catch (e) {
      console.error('Failed to load theme:', e);
      setTheme('dark');
    }
  }, []);

  // Save theme preference when it changes
  useEffect(() => {
    try {
      localStorage.setItem('pillTrackerTheme', theme);
      // Update status bar color for iOS
      const metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (metaStatusBar) {
        metaStatusBar.setAttribute('content', currentTheme.statusBar);
      }
      // Update theme color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', currentTheme.bg);
      }
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  }, [theme, currentTheme.statusBar, currentTheme.bg]);

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  // Load saved data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pillTrackerData');
      if (saved) {
        const data = JSON.parse(saved);
        // Check if data is from today
        const savedDate = new Date(data.date).toDateString();
        const today = new Date().toDateString();
        
        if (savedDate === today) {
          const loadedLaps = data.laps || [];
          setLaps(loadedLaps);
          setPillsRemaining(data.pillsRemaining);
          setInitialPillCount(data.initialPillCount || 10);
          
          // Recalculate elapsed time from actual timestamps
          if (loadedLaps.length > 0) {
            const calculatedTime = calculateTotalTimeFromTimestamps(loadedLaps);
            setElapsedTime(calculatedTime);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load saved data:', e);
    }
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (laps.length > 0 || pillsRemaining !== null) {
      try {
        const dataToSave = {
          laps,
          pillsRemaining,
          initialPillCount,
          elapsedTime,
          date: new Date().toISOString()
        };
        localStorage.setItem('pillTrackerData', JSON.stringify(dataToSave));
      } catch (e) {
        console.error('Failed to save data:', e);
      }
    }
  }, [laps, pillsRemaining, initialPillCount, elapsedTime]);

  useEffect(() => {
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('dblclick', (e) => e.preventDefault());
  }, []);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedTime;
      intervalRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current);
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, elapsedTime]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0')
    };
  };

  const formatTimeString = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getESTTime = () => {
    return new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const handleStartStop = () => {
    if (!isRunning && laps.length === 0) {
      // First start - set pills remaining and record initial pill count as first lap
      setPillsRemaining(initialPillCount - pillCount);
      const now = Date.now();
      setLaps([{
        id: 1,
        pillCount: pillCount,
        lapDuration: 0,
        totalTime: 0,
        timestamp: getESTTime(),
        fullTimestamp: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
        actualTimestamp: now // Store actual millisecond timestamp
      }]);
      setPillCount(1);
      // Set elapsed time to 0 for first dose
      setElapsedTime(0);
    }
    setIsRunning(!isRunning);
  };

  const handleLap = () => {
    if (isRunning) {
      setShowPillInput(true);
    }
  };

  const confirmLap = () => {
    const now = Date.now();
    
    // Calculate lap duration from actual timestamps
    const lastLapTimestamp = laps[laps.length - 1].actualTimestamp;
    const actualLapDuration = now - lastLapTimestamp;
    
    // Calculate new total time from all timestamps
    const newTotalTime = calculateTotalTimeFromTimestamps([...laps, { actualTimestamp: now }]);
    
    setLaps([...laps, {
      id: laps.length + 1,
      pillCount: pillCount,
      lapDuration: actualLapDuration, // Use actual timestamp difference
      totalTime: newTotalTime,
      timestamp: getESTTime(),
      fullTimestamp: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
      actualTimestamp: now // Store actual millisecond timestamp
    }]);
    
    // Update the elapsed time to match the new total from timestamps
    setElapsedTime(newTotalTime);
    
    // Subtract from remaining pills
    setPillsRemaining(prev => prev - pillCount);
    
    setShowPillInput(false);
    setPillCount(1);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setLaps([]);
    setPillCount(1);
    setShowPillInput(false);
    setPillsRemaining(null);
    // Clear saved data
    localStorage.removeItem('pillTrackerData');
  };

  const pillOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  const totalPills = laps.reduce((sum, lap) => sum + lap.pillCount, 0);
  const time = formatTime(elapsedTime);

  return (
    <div className="min-h-screen flex flex-col p-4 font-sans overflow-hidden" style={{ background: currentTheme.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        body {
          overscroll-behavior: none;
          background: ${currentTheme.bg};
        }

        .yellow-button {
          background: #F4FF00;
          color: #000;
          border: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .yellow-button:active {
          transform: scale(0.96);
          background: #E0F000;
        }

        .dark-button {
          background: ${currentTheme.buttonBg};
          border: 2px solid #F4FF00;
          color: #F4FF00;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dark-button:active {
          transform: scale(0.96);
          background: ${currentTheme.buttonBgActive};
        }

        .pill-selector {
          background: ${currentTheme.buttonBg};
          border: 2px solid ${currentTheme.border};
          color: ${currentTheme.text};
          transition: all 0.2s;
        }

        .pill-selector.selected {
          background: #F4FF00;
          border-color: #F4FF00;
          color: #000;
        }

        .pill-selector:active {
          transform: scale(0.96);
        }

        .increment-button {
          background: ${currentTheme.buttonBg};
          border: 2px solid ${currentTheme.border};
          color: #F4FF00;
          transition: all 0.2s;
          min-width: 60px;
        }

        .increment-button:active {
          transform: scale(0.96);
          background: ${currentTheme.buttonBgActive};
        }

        .lap-card {
          background: ${currentTheme.cardBg};
          border-radius: 16px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-bg {
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .stat-box {
          background: ${currentTheme.cardBg};
          border-radius: 12px;
          padding: 12px 16px;
        }

        .theme-toggle {
          background: ${currentTheme.buttonBg};
          border: 2px solid ${currentTheme.borderSecondary};
          color: ${currentTheme.text};
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .theme-toggle:active {
          transform: scale(0.96);
          background: ${currentTheme.buttonBgActive};
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-2 pt-2 px-4">
        <div>
          <div className="text-xs uppercase tracking-widest mb-1" style={{ color: currentTheme.textSecondary }}>PILL TRACKER</div>
          <div className="text-lg font-normal" style={{ color: currentTheme.text }}>{getESTTime()} EST</div>
        </div>
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Initial Pill Selection */}
      {!isRunning && laps.length === 0 && (
        <div className="flex-1 flex flex-col justify-center -mt-20 px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ color: currentTheme.text }}>Start Session</h2>
            <p className="text-sm" style={{ color: currentTheme.textSecondary }}>Set up your tracking</p>
          </div>

          {/* Pills Remaining Input */}
          <div className="mb-6">
            <label className="text-sm mb-3 block" style={{ color: currentTheme.textSecondary }}>Pills Remaining (Total)</label>
            <input
              type="number"
              value={initialPillCount}
              onChange={(e) => setInitialPillCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full border-2 rounded-2xl px-6 py-5 text-5xl font-bold text-center focus:border-yellow-400 focus:outline-none"
              style={{
                background: currentTheme.inputBg,
                borderColor: currentTheme.inputBorder,
                color: currentTheme.text
              }}
              min="1"
              inputMode="numeric"
            />
          </div>

          {/* First Dose */}
          <div className="mb-8">
            <label className="text-sm mb-3 block" style={{ color: currentTheme.textSecondary }}>First Dose (Pills)</label>
            <div className="grid grid-cols-3 gap-3">
              {pillOptions.map((count) => (
                <button
                  key={count}
                  onClick={() => setPillCount(count)}
                  className={`pill-selector py-5 rounded-2xl font-bold text-xl ${
                    pillCount === count ? 'selected' : ''
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartStop}
            className="yellow-button w-full py-5 rounded-3xl font-bold text-lg"
          >
            Start Tracking
          </button>
        </div>
      )}

      {/* Timer Display */}
      {(isRunning || laps.length > 0) && (
        <>
          <div className="flex-1 flex flex-col justify-start pt-6">
            {/* My Time Label */}
            <div className="text-base mb-8 px-4" style={{ color: currentTheme.textSecondary }}>My Time</div>

            <div className="relative px-4 mb-8">
              {/* Background Chart Effect */}
              <div className="absolute inset-0 flex items-center justify-center gap-1 px-12" style={{ opacity: theme === 'dark' ? 0.12 : 0.08 }}>
                {[...Array(15)].map((_, i) => {
                  const height = Math.random() * 70 + 30;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded"
                      style={{
                        height: `${height}%`,
                        maxWidth: '12px',
                        background: currentTheme.textSecondary
                      }}
                    />
                  );
                })}
              </div>

              {/* Main Content - Side by Side */}
              <div className="relative z-10 flex items-center justify-between">
                {/* Left: Timer - Vertical Stack */}
                <div className="flex flex-col">
                  <div className="flex items-baseline mb-1">
                    <span className="font-light tracking-tighter leading-none" style={{ fontSize: '7rem', color: currentTheme.textSecondary }}>{time.hours}</span>
                    <span className="text-2xl font-light ml-3" style={{ color: currentTheme.textSecondary }}>h</span>
                  </div>
                  <div className="flex items-baseline mb-1">
                    <span className="font-light tracking-tighter leading-none" style={{ fontSize: '7rem', color: '#F4FF00' }}>{time.minutes}</span>
                    <span className="text-2xl font-light ml-3" style={{ color: '#F4FF00' }}>m</span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="font-light tracking-tighter leading-none" style={{ fontSize: '7rem', color: currentTheme.text }}>{time.seconds}</span>
                    <span className="text-2xl font-light ml-3" style={{ color: currentTheme.textSecondary }}>s</span>
                  </div>
                </div>

                {/* Right: Stats - Vertical Stack */}
                <div className="flex flex-col items-end gap-6 pr-2">
                  <div className="text-right">
                    <div className="text-sm mb-1" style={{ color: '#F4FF00' }}>Doses</div>
                    <div className="text-4xl font-normal" style={{ color: currentTheme.text }}>{laps.length}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm mb-1" style={{ color: currentTheme.textSecondary }}>Pills Today</div>
                    <div className="text-4xl font-normal" style={{ color: currentTheme.text }}>{totalPills}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm mb-1" style={{ color: currentTheme.textSecondary }}>Pills Left</div>
                    <div className="text-4xl font-normal" style={{ color: currentTheme.text }}>{pillsRemaining !== null ? pillsRemaining : 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Dose History - Compact */}
          {laps.length > 0 && (
            <div className="mb-4 px-4">
              <div className="text-xs uppercase tracking-wider mb-3" style={{ color: currentTheme.textSecondary }}>Recent Doses</div>
              <div className="space-y-2">
                {[...laps].reverse().slice(0, 2).map((lap, index) => (
                  <div key={lap.id} className="lap-card p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold" style={{ color: currentTheme.textSecondary }}>
                        #{laps.length - index}
                      </span>
                      <span className="text-sm font-mono" style={{ color: currentTheme.textSecondary }}>
                        {lap.timestamp}
                      </span>
                      <span className="font-mono text-sm" style={{ color: currentTheme.textSecondary }}>
                        {formatTimeString(lap.lapDuration)}
                      </span>
                    </div>
                    <div className="font-medium text-sm" style={{ color: currentTheme.text }}>
                      {lap.pillCount} pill{lap.pillCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-4 pb-6 px-4">
            {isRunning ? (
              <>
                <button
                  onClick={handleLap}
                  className="dark-button flex-1 py-5 rounded-3xl font-bold text-xl flex items-center justify-center gap-2"
                >
                  <span className="text-3xl leading-none" style={{ color: '#F4FF00' }}>+</span>
                </button>
                <button
                  onClick={handleStartStop}
                  className="yellow-button flex-1 py-5 rounded-3xl font-bold text-xl flex items-center justify-center"
                >
                  <span className="text-3xl leading-none">⏸</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleReset}
                  className="dark-button flex-1 py-5 rounded-3xl font-bold text-lg"
                >
                  Reset
                </button>
                <button
                  onClick={handleStartStop}
                  className="yellow-button flex-1 py-5 rounded-3xl font-bold text-xl flex items-center justify-center"
                >
                  <span className="text-3xl leading-none">▶</span>
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Pill Count Modal */}
      {showPillInput && (
        <div
          className="fixed inset-0 flex items-center justify-center p-6 z-50 modal-bg"
          style={{ background: currentTheme.modalOverlay }}
        >
          <div
            className="modal-content border-2 rounded-3xl p-6 max-w-md w-full"
            style={{
              background: currentTheme.modalBg,
              borderColor: currentTheme.modalBorder
            }}
          >
            <h2 className="text-2xl font-bold mb-2" style={{ color: currentTheme.text }}>Record Dose</h2>
            <p className="text-base mb-6" style={{ color: currentTheme.textSecondary }}>How many pills?</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {pillOptions.map((count) => (
                <button
                  key={count}
                  onClick={() => setPillCount(count)}
                  className={`pill-selector py-5 rounded-2xl font-bold text-xl ${
                    pillCount === count ? 'selected' : ''
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPillInput(false)}
                className="dark-button flex-1 py-4 rounded-3xl font-bold text-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmLap}
                className="yellow-button flex-1 py-4 rounded-3xl font-bold text-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
