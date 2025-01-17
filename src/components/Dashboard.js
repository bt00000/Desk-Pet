import { useRef, useEffect, useState } from 'react';
import Spline from '@splinetool/react-spline';
import '../App.css'; // Include CSS

export default function App() {
  const splineRef = useRef(null);
  const [isRewardClaimed, setIsRewardClaimed] = useState(false); // Track if reward is claimed

  useEffect(() => {
    // Fetch rewards from the backend on load
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:5001/rewards', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.rewards && data.rewards.includes('Computer')) {
          setIsRewardClaimed(true);
        }
      })
      .catch((err) => console.error('Error fetching rewards:', err));
  }, []);

  const claimReward = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:5001/claim-reward', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reward: 'Computer' }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          console.log(data.message);
          setIsRewardClaimed(true);
          makeObjectVisible();
        } else if (data.error) {
          console.error(data.error);
        }
      })
      .catch((err) => console.error('Error claiming reward:', err));
  };

  const resetReward = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:5001/reset-reward', {
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
          setIsRewardClaimed(false);
          makeObjectInvisible();
        } else if (data.error) {
          console.error(data.error);
        }
      })
      .catch((err) => console.error('Error resetting reward:', err));
  };

  const makeObjectVisible = () => {
    if (!splineRef.current) return;
    const spline = splineRef.current;
    const objectById = spline.findObjectById('B81FF516-4487-4311-A610-2E741369AEEF');
    if (objectById) {
      objectById.visible = true;
      console.log('Object "Computer" is now visible.');
    }
  };

  const makeObjectInvisible = () => {
    if (!splineRef.current) return;
    const spline = splineRef.current;
    const objectById = spline.findObjectById('B81FF516-4487-4311-A610-2E741369AEEF');
    if (objectById) {
      objectById.visible = false;
      console.log('Object "Computer" is now invisible.');
    }
  };

  function onLoad(spline) {
    console.log('Spline loaded!', spline);
    splineRef.current = spline;

    if (!isRewardClaimed) {
      makeObjectInvisible();
    } else {
      makeObjectVisible();
    }
  }

  return (
    <div className="app-container">
      <Spline
        scene="https://prod.spline.design/A2uE-ncxFdDyZ07D/scene.splinecode"
        onLoad={onLoad}
      />
      <button
        className="claim-button"
        onClick={claimReward}
        disabled={isRewardClaimed}
      >
        {isRewardClaimed ? 'Reward Claimed' : 'Claim Reward'}
      </button>
      <button
        className="reset-button"
        onClick={resetReward}
      >
        Reset Reward
      </button>
    </div>
  );
}
