import React, { useState, useEffect } from 'react';

export default function PillTracker() {
  const [pillsTaken, setPillsTaken] = useState(0);
  const [pillsRemaining, setPillsRemaining] = useState(10);
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTracking, setIsTracking] = useState(false);

  // Simple timer
  useEffect(() => {
    if (isTracking && startTime) {
      const interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTracking, startTime]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setStartTime(Date.now());
    setIsTracking(true);
  };

  const handleTakePill = () => {
    setPillsTaken(prev => prev + 1);
    setPillsRemaining(prev => Math.max(0, prev - 1));
  };

  const handleReset = () => {
    setPillsTaken(0);
    setPillsRemaining(10);
    setStartTime(null);
    setElapsedSeconds(0);
    setIsTracking(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000',
      color: '#fff',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Pill Tracker Lite</h1>

      {!isTracking ? (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <button
            onClick={handleStart}
            style={{
              backgroundColor: '#F4FF00',
              color: '#000',
              border: 'none',
              padding: '20px 40px',
              fontSize: '20px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Start Tracking
          </button>
        </div>
      ) : (
        <>
          <div style={{
            backgroundColor: '#1A1A1A',
            padding: '30px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '10px' }}>
              {formatTime(elapsedSeconds)}
            </div>
            <div style={{ color: '#888', fontSize: '14px' }}>Time Elapsed</div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            marginBottom: '30px'
          }}>
            <div style={{
              backgroundColor: '#1A1A1A',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#F4FF00' }}>
                {pillsTaken}
              </div>
              <div style={{ color: '#888', fontSize: '14px' }}>Pills Taken</div>
            </div>

            <div style={{
              backgroundColor: '#1A1A1A',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
                {pillsRemaining}
              </div>
              <div style={{ color: '#888', fontSize: '14px' }}>Pills Left</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleTakePill}
              style={{
                flex: 1,
                backgroundColor: '#F4FF00',
                color: '#000',
                border: 'none',
                padding: '20px',
                fontSize: '18px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              + Take Pill
            </button>

            <button
              onClick={handleReset}
              style={{
                backgroundColor: '#1A1A1A',
                color: '#F4FF00',
                border: '2px solid #F4FF00',
                padding: '20px',
                fontSize: '18px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  );
}
