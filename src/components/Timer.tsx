import { useState, useEffect } from 'react';

interface TimerProps {
  taskId: string;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  getDuration: () => number;
}

export function Timer({ isRunning, onStart, onStop, onPause, getDuration }: TimerProps) {
  const [displayTime, setDisplayTime] = useState('00:00:00');

  useEffect(() => {
    let interval: number;
    
    if (isRunning) {
      interval = setInterval(() => {
        const seconds = getDuration();
        setDisplayTime(formatTime(seconds));
      }, 1000);
    } else {
      setDisplayTime('00:00:00');
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, getDuration]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timer-component">
      <div className="timer-display">
        {displayTime}
      </div>
      <div className="timer-controls">
        {!isRunning ? (
          <button 
            className="timer-btn start" 
            onClick={onStart}
            title="Start Timer"
          >
            ▶️
          </button>
        ) : (
          <>
            <button 
              className="timer-btn pause" 
              onClick={onPause}
              title="Pause Timer"
            >
              ⏸️
            </button>
            <button 
              className="timer-btn stop" 
              onClick={onStop}
              title="Stop Timer"
            >
              ⏹️
            </button>
          </>
        )}
      </div>
    </div>
  );
}