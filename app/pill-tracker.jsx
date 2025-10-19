import React, { useState, useEffect, useRef } from 'react';

export default function PillTracker() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [laps, setLaps] = useState([]);
  const [pillCount, setPillCount] = useState(1);
  const [showPillInput, setShowPillInput] = useState(false);
  const [pillsRemaining, setPillsRemaining] = useState(null);
  const [initialPillCount, setInitialPillCount] = useState(10);
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
    <div className="min-h-screen bg-black flex flex-col p-4 font-sans overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        
        body {
          overscroll-behavior: none;
          background: #000;
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
          background: #1A1A1A;
          border: 2px solid #F4FF00;
          color: #F4FF00;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .dark-button:active {
          transform: scale(0.96);
          background: #252525;
        }
        
        .pill-selector {
          background: #1A1A1A;
          border: 2px solid #333;
          color: #fff;
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
          background: #1A1A1A;
          border: 2px solid #333;
          color: #F4FF00;
          transition: all 0.2s;
          min-width: 60px;
        }
        
        .increment-button:active {
          transform: scale(0.96);
          background: #252525;
        }
        
        .lap-card {
          background: #1A1A1A;
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
          background: #1A1A1A;
          border-radius: 12px;
          padding: 12px 16px;
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-2 pt-2 px-4">
        <div>
          <div className="text-gray-600 text-xs uppercase tracking-widest mb-1">PILL TRACKER</div>
          <div className="text-white text-lg font-normal">{getESTTime()} EST</div>
        </div>
      </div>

      {/* Initial Pill Selection */}
      {!isRunning && laps.length === 0 && (
        <div className="flex-1 flex flex-col justify-center -mt-20 px-4">
          <div className="text-center mb-8">
            <h2 className="text-white text-3xl font-bold mb-2">Start Session</h2>
            <p className="text-gray-400 text-sm">Set up your tracking</p>
          </div>
          
          {/* Pills Remaining Input */}
          <div className="mb-6">
            <label className="text-gray-400 text-sm mb-3 block">Pills Remaining (Total)</label>
            <input
              type="number"
              value={initialPillCount}
              onChange={(e) => setInitialPillCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl px-6 py-5 text-white text-5xl font-bold text-center focus:border-yellow-400 focus:outline-none"
              min="1"
              inputMode="numeric"
            />
          </div>
          
          {/* First Dose */}
          <div className="mb-8">
            <label className="text-gray-400 text-sm mb-3 block">First Dose (Pills)</label>
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
            <div className="text-gray-500 text-base mb-8 px-4">My Time</div>
            
            <div className="relative px-4 mb-8">
              {/* Background Chart Effect */}
              <div className="absolute inset-0 flex items-center justify-center gap-1 px-12" style={{ opacity: 0.12 }}>
                {[...Array(15)].map((_, i) => {
                  const height = Math.random() * 70 + 30;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-gray-600 rounded"
                      style={{ height: `${height}%`, maxWidth: '12px' }}
                    />
                  );
                })}
              </div>
              
              {/* Main Content - Side by Side */}
              <div className="relative z-10 flex items-center justify-between">
                {/* Left: Timer - Vertical Stack */}
                <div className="flex flex-col">
                  <div className="flex items-baseline mb-1">
                    <span className="text-gray-600 font-light tracking-tighter leading-none" style={{ fontSize: '7rem' }}>{time.hours}</span>
                    <span className="text-gray-600 text-2xl font-light ml-3">h</span>
                  </div>
                  <div className="flex items-baseline mb-1">
                    <span className="font-light tracking-tighter leading-none" style={{ fontSize: '7rem', color: '#F4FF00' }}>{time.minutes}</span>
                    <span className="text-2xl font-light ml-3" style={{ color: '#F4FF00' }}>m</span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-white font-light tracking-tighter leading-none" style={{ fontSize: '7rem' }}>{time.seconds}</span>
                    <span className="text-gray-400 text-2xl font-light ml-3">s</span>
                  </div>
                </div>
                
                {/* Right: Stats - Vertical Stack */}
                <div className="flex flex-col items-end gap-6 pr-2">
                  <div className="text-right">
                    <div className="text-sm mb-1" style={{ color: '#F4FF00' }}>Doses</div>
                    <div className="text-white text-4xl font-normal">{laps.length}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-sm mb-1">Pills Today</div>
                    <div className="text-white text-4xl font-normal">{totalPills}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-sm mb-1">Pills Left</div>
                    <div className="text-white text-4xl font-normal">{pillsRemaining !== null ? pillsRemaining : 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Dose History - Compact */}
          {laps.length > 0 && (
            <div className="mb-4 px-4">
              <div className="text-gray-500 text-xs uppercase tracking-wider mb-3">Recent Doses</div>
              <div className="space-y-2">
                {[...laps].reverse().slice(0, 2).map((lap, index) => (
                  <div key={lap.id} className="lap-card p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-500 text-sm font-semibold">
                        #{laps.length - index}
                      </span>
                      <span className="text-gray-400 text-sm font-mono">
                        {lap.timestamp}
                      </span>
                      <span className="text-gray-400 font-mono text-sm">
                        {formatTimeString(lap.lapDuration)}
                      </span>
                    </div>
                    <div className="text-white font-medium text-sm">
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
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-6 z-50 modal-bg">
          <div className="modal-content bg-black border-2 border-gray-800 rounded-3xl p-6 max-w-md w-full">
            <h2 className="text-white text-2xl font-bold mb-2">Record Dose</h2>
            <p className="text-gray-400 text-base mb-6">How many pills?</p>
            
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
