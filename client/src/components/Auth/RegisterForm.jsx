import React, { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';

const RegisterForm = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
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

  const validateForm = () => {
    if (!formData.username.trim() || !formData.email.trim() || !formData.password) {
      return 'Please fill in all fields';
    }

    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }

    if (!formData.email.includes('@')) {
      return 'Please enter a valid email address';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    // UPDATED: Include password in registration data
    const userData = {
      id: Date.now().toString(),
      username: formData.username.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password, // NEW: Include password
      joinedAt: new Date().toISOString()
    };

    console.log('Sending registration data:', { 
      username: userData.username, 
      email: userData.email,
      hasPassword: true 
    });

    // Send registration to server
    socket.emit('user:register', userData);

    // Listen for response
    socket.once('register:success', (data) => {
      setIsLoading(false);
      console.log('Registration successful, user:', data.user);
      onLogin(data.user);
    });

    socket.once('register:error', (data) => {
      setIsLoading(false);
      setError(data.message);
      console.error(' Registration error:', data.message);
    });

    // Timeout fallback
    setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setError('Registration timeout. Please try again.');
      }
    }, 5000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Username</span>
        </label>
        <input
          type="text"
          name="username"
          placeholder="Choose a username"
          className="input input-bordered w-full"
          value={formData.username}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Email</span>
        </label>
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
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
          placeholder="Create a password (min 6 characters)"
          className="input input-bordered w-full"
          value={formData.password}
          onChange={handleChange}
          minLength="6"
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Confirm Password</span>
        </label>
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm your password"
          className="input input-bordered w-full"
          value={formData.confirmPassword}
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
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>

      <div className="alert alert-info">
        <span>Your password will be securely encrypted</span>
      </div>
    </form>
  );
};

export default RegisterForm;