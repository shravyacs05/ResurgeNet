import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithPhoneNumber, 
  RecaptchaVerifier 
} from 'firebase/auth';
import { auth } from '../../firebase'; // <-- updated path
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';   // <-- updated path
import { useNavigate } from 'react-router-dom';

const UserSignup = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleBasicInfoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password should be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      // Mock OTP sending for development
      console.log('Development: Simulating OTP sent');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStep(2);
      
    } catch (error) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Mock OTP verification - accept any 6-digit code for development
      if (!formData.otp || formData.otp.length !== 6) {
        throw new Error('Please enter a 6-digit OTP. Use 123456 for testing.');
      }

      console.log('Creating user account...');

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;
      console.log('User created:', user.uid);

      // Update profile with name
      await updateProfile(user, {
        displayName: formData.name
      });
      console.log('Profile updated');

      // Try to store in Firestore (but don't block on error)
      try {
        await setDoc(doc(db, 'users', user.uid), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || '',
          role: 'user',
          trustScore: 85,
          createdAt: new Date(),
          isPhoneVerified: true,
          isEmailVerified: false
        });
        console.log('User data saved to Firestore');
      } catch (firestoreError) {
        console.warn('Firestore error (user can still proceed):', firestoreError);
      }

      // Create user data for login
      const userData = {
        id: user.uid,
        name: formData.name,
        email: user.email,
        phone: formData.phone || '',
        role: 'user',
        trustScore: 85,
        isPhoneVerified: true,
        isEmailVerified: false
      };

      console.log('Calling onLogin with:', userData);
      
      // Call the login handler
      onLogin(userData);
      
      // Show success message
      setSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Signup error:', error);
      setError(getErrorMessage(error.code) || error.message);
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please try logging in instead.';
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      default:
        return 'Failed to create account. Please try again.';
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const resendOTP = () => {
    setError('OTP resent! Use 123456 for testing.');
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="bg-green-500/10 border border-green-500 text-green-300 px-4 py-3 rounded-lg mb-6">
            <div className="text-4xl mb-2">✅</div>
            <h2 className="text-2xl font-bold">Account Created Successfully!</h2>
            <p className="mt-2">Redirecting to dashboard...</p>
          </div>
          <Link to="/dashboard" className="text-blue-400 hover:text-blue-300">
            Click here if not redirected automatically
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link to="/" className="inline-block mb-4 text-blue-400 hover:text-blue-300">
            ← Back to Role Selection
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create User Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            {step === 1 ? 'Enter your details' : 'Verify your phone number'}
          </p>

          {/* Progress Steps */}
          <div className="mt-6 flex items-center justify-center">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'bg-blue-600 border-blue-600' : 'border-gray-500'}`}>
                1
              </div>
              <span className="ml-2 text-sm">Basic Info</span>
            </div>
            <div className={`mx-4 w-20 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-500'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'bg-blue-600 border-blue-600' : 'border-gray-500'}`}>
                2
              </div>
              <span className="ml-2 text-sm">Verify OTP</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-300 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form className="mt-8 space-y-6" onSubmit={handleBasicInfoSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300">Full Name *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white rounded-md bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white rounded-md bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300">Phone Number *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white rounded-md bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="+911234567890"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password *</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white rounded-md bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">Confirm Password *</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white rounded-md bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleOTPVerification}>
            <div className="text-center">
              <h3 className="text-lg font-medium text-white">Verify Your Phone</h3>
              <p className="text-gray-400 mt-2">
                Enter <span className="text-blue-400 font-mono">123456</span> for testing
              </p>
            </div>

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-300">Enter Verification Code</label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                maxLength="6"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white rounded-md bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-xl tracking-widest sm:text-sm"
                placeholder="123456"
                value={formData.otp}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 px-4 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="button"
                onClick={resendOTP}
                className="flex-1 py-3 px-4 border border-blue-600 text-sm font-medium rounded-md text-blue-400 bg-blue-600/20 hover:bg-blue-600/30"
                disabled={loading}
              >
                Resend OTP
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Verify & Create Account'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center">
          <Link to="/user-login" className="font-medium text-blue-400 hover:text-blue-300">
            Already have an account? Sign in
          </Link>
        </div>

        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500 rounded-lg">
          <h4 className="text-sm font-medium text-blue-300 mb-2">Development Mode:</h4>
          <ul className="text-xs text-blue-400 space-y-1">
            <li>• Use any 6-digit OTP (123456 recommended)</li>
            <li>• Phone verification is mocked for testing</li>
            <li>• Account will be created in Firebase Auth</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserSignup;