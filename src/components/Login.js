import React, { useState } from 'react';
import '../App.css';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false); // Toggle between Login and Register
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const backendUrl = 'http://localhost:5001'; // Backend server URL

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${backendUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${backendUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');
      alert('Registration successful! Please log in.');
      setIsRegister(false); // Switch to login after successful registration
      clearForm(); // Clear form and error state
    } catch (err) {
      setError(err.message);
    }
  };

  const clearForm = () => {
    setUsername('');
    setPassword('');
    setError('');
  };

  const handleSwitchToLogin = () => {
    clearForm();
    setIsRegister(false);
  };

  const handleSwitchToRegister = () => {
    clearForm();
    setIsRegister(true);
  };

  return (
    <section>
      <div className="video-container">
        <video id="video-background" autoPlay loop muted>
          <source src="/deskpet_login_background.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="form-box">
        <div className="form-value">
          {isRegister ? (
            // Register Form
            <form onSubmit={handleRegister}>
              <h2>Register</h2>
              <div className="inputbox">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  required
                />
              </div>
              <div className="inputbox">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
              </div>
              {error && <p style={{ color: 'red' }}>{error}</p>}
              <button type="submit">Register</button>
              <div className="toggle">
                <p>
                  Already have an account?{' '}
                  <a href="#" onClick={handleSwitchToLogin}>
                    Log in
                  </a>
                </p>
              </div>
            </form>
          ) : (
            // Login Form
            <form onSubmit={handleLogin}>
              <h2>Login</h2>
              <div className="inputbox">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  required
                />
              </div>
              <div className="inputbox">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
              </div>
              {error && <p style={{ color: 'red' }}>{error}</p>}
              <button type="submit">Log In</button>
              <div className="toggle">
                <p>
                  Don't have an account?{' '}
                  <a href="#" onClick={handleSwitchToRegister}>
                    Register
                  </a>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
