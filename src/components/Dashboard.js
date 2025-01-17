import { useEffect, useState, useRef } from 'react';
import Spline from '@splinetool/react-spline';
import '../App.css'; // Include CSS

export default function App() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [rewards, setRewards] = useState([]);
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const splineRef = useRef(null);

  // Map levels to object names in Spline
  const objectMap = {
    1: 'BedTable', // Reward #1
    2: ['Lamp', 'LampLight'], // Reward #2
    3: 'Table', // Reward #3
    4: 'Window', // Reward #4
    5: 'Computer', // Reward #5
    6: 'Cup', // Reward #6
    7: 'Bed', // Reward #7
    8: 'Plant', // Reward #8
    9: 'Books', // Reward #9
    10: 'Clock', // Reward #10
  };

  // Default visible object
  const defaultVisibleObject = 'Floor';

  // Update visible objects based on rewards
  useEffect(() => {
    if (!splineRef.current) return;

    const spline = splineRef.current;

    // Hide all objects initially except the default visible object
    Object.values(objectMap)
      .flat()
      .concat(defaultVisibleObject)
      .forEach((objectName) => {
        const object = spline.findObjectByName(objectName);
        if (object) object.visible = false;
      });

    // Show only the default object and rewards
    [defaultVisibleObject]
      .concat(
        rewards.flatMap((reward) =>
          Array.isArray(objectMap[reward.replace('Reward #', '')])
            ? objectMap[reward.replace('Reward #', '')]
            : [objectMap[reward.replace('Reward #', '')]]
        )
      )
      .forEach((objectName) => {
        const object = spline.findObjectByName(objectName);
        if (object) object.visible = true;
      });
  }, [rewards]);

  // Fetch levels and rewards on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:5001/levels', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setCurrentLevel(data.currentLevel);
        setRewards(data.rewards || []);
      })
      .catch((err) => console.error('Error fetching levels:', err));
  }, []);

  // Start timer for unlocking rewards
  const startTimer = (level) => {
    if (currentLevel !== level) return; // Only start the timer if it's the current level
  
    if (timer) clearInterval(timer); // Clear any existing timer before starting a new one
  
    setTimeLeft(0.05 * 60); // Timer set to 15 minutes (900 seconds)
    const newTimer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(newTimer); // Clear the timer when it finishes
          setTimer(null); // Reset the timer state
          completeReward(level); // Complete the reward
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  
    setTimer(newTimer); // Store the new timer instance
  };
  

  // Reset the timer if the mouse leaves the button
  const resetTimer = () => {
    if (timer) clearInterval(timer); // Clear the timer
    setTimeLeft(0); // Reset time left
    setTimer(null); // Reset timer state
  };

  // Complete reward after timer ends
  const completeReward = (level) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:5001/start-reward', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ level }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          console.log(data.message);
          setRewards((prev) => [...prev, `Reward #${level}`]);
          setCurrentLevel(level + 1);
        }
      })
      .catch((err) => console.error('Error completing reward:', err));
  };

  // Reset all rewards and visibility
  const resetRewards = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:5001/reset-rewards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          console.log(data.message);
          setRewards([]);
          setCurrentLevel(1);
          setTimeLeft(0);
          if (timer) clearInterval(timer); // Clear any running timer
          setTimer(null);
        }
      })
      .catch((err) => console.error('Error resetting rewards:', err));
  };

  // Handle Spline onLoad event
  function onLoad(spline) {
    console.log('Spline loaded!', spline);
    splineRef.current = spline;

    // Initially hide all objects except the default visible object
    Object.values(objectMap)
      .flat()
      .concat(defaultVisibleObject)
      .forEach((objectName) => {
        const object = spline.findObjectByName(objectName);
        if (object) object.visible = false;
      });

    // Show default objects and rewards
    [defaultVisibleObject]
      .concat(
        rewards.flatMap((reward) =>
          Array.isArray(objectMap[reward.replace('Reward #', '')])
            ? objectMap[reward.replace('Reward #', '')]
            : [objectMap[reward.replace('Reward #', '')]]
        )
      )
      .forEach((objectName) => {
        const object = spline.findObjectByName(objectName);
        if (object) object.visible = true;
      });
  }

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <div className="app-container">
      <Spline
        scene="https://prod.spline.design/A2uE-ncxFdDyZ07D/scene.splinecode"
        onLoad={onLoad}
      />
      <div className="overlay">
        <div className="rewards-container">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
            const isClaimed = rewards.includes(`Reward #${level}`);
            const isCurrent = currentLevel === level;
            const isLocked = currentLevel < level;

            return (
              <button
                key={level}
                className={`reward-button ${isClaimed ? '' : ''} ${isLocked ? 'locked' : ''}`}
                onMouseEnter={() => {
                  if (!isLocked) startTimer(level); // Start timer only for unlocked and current button
                }}
                onMouseLeave={resetTimer}
                disabled={isLocked || timeLeft > 0}
              >
                {isClaimed
                  ? `Reward #${level} Claimed`
                  : isCurrent && timeLeft > 0
                  ? `Time Left: ${formatTime(timeLeft)}`
                  : `Start Reward #${level}`}
              </button>
            );
          })}
        </div>
        <button className="reset-button" onClick={resetRewards}>
          Reset Rewards
        </button>
      </div>
    </div>
  );
}
