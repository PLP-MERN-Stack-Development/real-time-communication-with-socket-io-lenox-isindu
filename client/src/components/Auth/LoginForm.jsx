import React, { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';

const LoginForm = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { socket } = useSocket();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError('');

    // UPDATED: Send email and password for authentication
    const loginData = {
      email: formData.email.trim().toLowerCase(),
      password: formData.password
    };

    console.log(' Sending login data:', { email: loginData.email, hasPassword: true });

    // Send login to server
    socket.emit('user:login', loginData);

    // Listen for response
    socket.once('login:success', (data) => {
      setIsLoading(false);
      console.log('Login successful, user:', data.user);
      onLogin(data.user);
    });

    socket.once('login:error', (data) => {
      setIsLoading(false);
      setError(data.message);
      console.error('Login error:', data.message);
    });

    // Timeout fallback
    setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setError('Login timeout. Please try again.');
      }
    }, 5000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Email</span>
        </label>
        <input
          type="email"
          name="email"
          placeholder="Enter your registered email"
          className="input input-bordered w-full"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Password</span>
        </label>
        <input
          type="password"
          name="password"
          placeholder="Enter your password"
          className="input input-bordered w-full"
          value={formData.password}
          onChange={handleChange}
          minLength="6"
          required
        />
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <button 
        type="submit"
        className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
        disabled={isLoading}
      >
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>

      <div className="alert alert-info">
        <span>Enter your email and password to sign in</span>
      </div>
    </form>
  );
};

export default LoginForm;