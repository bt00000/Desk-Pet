import { useEffect, useState, useRef } from 'react';
import Spline from '@splinetool/react-spline';
import '../App.css'; // Include CSS

export default function App() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [rewards, setRewards] = useState([]);
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const splineRef = useRef(null);

  const objectMap = {
    1: 'BedTable',
    2: ['Lamp', 'LampLight'],
    3: 'Table',
    4: 'Window',
    5: 'Computer',
    6: 'Cup',
    7: 'Bed',
    8: 'Plant',
    9: 'Books',
    10: 'Clock',
  };

  const defaultVisibleObject = 'Floor';

  const updateVisibility = () => {
    if (!splineRef.current) return;

    const spline = splineRef.current;

    const visibleObjects = [defaultVisibleObject].concat(
      rewards.flatMap((reward) =>
        Array.isArray(objectMap[reward.replace('Reward #', '')])
          ? objectMap[reward.replace('Reward #', '')]
          : [objectMap[reward.replace('Reward #', '')]]
      )
    );

    Object.values(objectMap)
      .flat()
      .forEach((objectName) => {
        const object = spline.findObjectByName(objectName);
        if (object) {
          object.visible = visibleObjects.includes(objectName);
        }
      });

    const floorObject = spline.findObjectByName(defaultVisibleObject);
    if (floorObject) floorObject.visible = true;
  };

  const loadRewards = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return;
    }

    try {
      const res = await fetch('http://localhost:5001/levels', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCurrentLevel(data.currentLevel);
      setRewards(data.rewards || []);
    } catch (err) {
      console.error('Error fetching levels:', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/'; // Redirect to login page
  };

  useEffect(() => {
    updateVisibility();
  }, [rewards]);

  const onLoad = (spline) => {
    splineRef.current = spline;
    updateVisibility();
  };

  const startTimer = (level) => {
    if (currentLevel !== level) return;

    if (timer) clearInterval(timer);

    setTimeLeft(3); // Demo: 3 seconds
    const newTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(newTimer);
          setTimer(null);
          completeReward(level);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimer(newTimer);
  };

  const resetTimer = () => {
    if (timer) clearInterval(timer);
    setTimeLeft(0);
    setTimer(null);
  };

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
        setRewards((prev) => [...prev, `Reward #${level}`]);
        setCurrentLevel(level + 1);
      })
      .catch((err) => console.error('Error completing reward:', err));
  };

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
      .then(() => {
        setRewards([]);
        setCurrentLevel(1);
        setTimeLeft(0);
        if (timer) clearInterval(timer);
        setTimer(null);
      })
      .catch((err) => console.error('Error resetting rewards:', err));
  };

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
        <button className="logout-button" onClick={logout}>
          Logout
        </button>
        <button className="load-button" onClick={loadRewards}>
          Load Owned Rewards
        </button>
        <div className="rewards-container">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
          const isClaimed = rewards.includes(`Reward #${level}`);
          const isCurrent = currentLevel === level;
          const isLocked = currentLevel < level;

          let buttonClass = "reward-button"; // Base class
          if (isClaimed) {
            buttonClass += " claimed";
          } else if (isCurrent) {
            buttonClass += " current";
          } else if (isLocked) {
            buttonClass += " locked";
          }

          return (
            <button
              key={level}
              className={buttonClass}
              onMouseEnter={() => isCurrent && startTimer(level)}
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
