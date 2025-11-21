// API Base URL for backend integration. In production, set `REACT_APP_API_BASE_URL`
// in Netlify environment variables to point to your hosted backend (e.g. https://api.example.com/api)
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api'; // fallback to localhost for local dev

// We will no longer use MOCK_USERS as users will be managed by the backend.
export const MOCK_USERS = []; 

// Store current user in localStorage (will store token/user info from backend)
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
};

export const setCurrentUser = (user) => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

// --- Backend API Integration Functions ---
// These functions will replace the mock logic for auth and balance

export const login = async (username, password) => {
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Login failed');
    }
    const user = await response.json();
    setCurrentUser(user);
    return user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const register = async (username, email, password) => {
  try {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Registration failed');
    }
    const user = await response.json();
    setCurrentUser(user); // Log in user after registration
    return user;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('currentUser');
};

export const getUserBalance = async () => {
  const user = getCurrentUser();
  if (!user) return 0;
  try {
    const response = await fetch(`${BASE_URL}/user/balance/${user.username}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch balance');
    }
    const updatedUser = await response.json();
    setCurrentUser(updatedUser); // Update local storage with latest balance
    return updatedUser.balance;
  } catch (error) {
    console.error("Get user balance error:", error);
    return user.balance; // Return old balance if API call fails
  }
};

export const depositBalance = async (amount) => {
  const user = getCurrentUser();
  if (!user) throw new Error("No user logged in for deposit");
  try {
    const response = await fetch(`${BASE_URL}/user/deposit/${user.username}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Deposit failed');
    }
    const updatedUser = await response.json();
    setCurrentUser(updatedUser);
    return updatedUser.balance;
  } catch (error) {
    console.error("Deposit error:", error);
    throw error;
  }
};

export const withdrawBalance = async (amount) => {
  const user = getCurrentUser();
  if (!user) throw new Error("No user logged in for withdrawal");
  try {
    const response = await fetch(`${BASE_URL}/user/withdraw/${user.username}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Withdrawal failed');
    }
    const updatedUser = await response.json();
    setCurrentUser(updatedUser);
    return updatedUser.balance;
  } catch (error) {
    console.error("Withdrawal error:", error);
    throw error;
  }
};


// Mock game history
export const getGameHistory = () => {
  const historyStr = localStorage.getItem('gameHistory');
  return historyStr ? JSON.parse(historyStr) : [];
};

export const addGameHistory = (game) => {
  const history = getGameHistory();
  history.unshift(game);
  // Keep only last 50 games
  if (history.length > 50) history.pop();
  localStorage.setItem('gameHistory', JSON.stringify(history));
};

// Aviator game logic
export const simulateAviatorRound = () => {
  // Random crash point between 1.00x and 50.00x
  const randomCrash = Math.random();
  let crashPoint;
  
  if (randomCrash < 0.5) {
    crashPoint = 1.0 + Math.random() * 1.5; // 1.0x - 2.5x (50% chance)
  } else if (randomCrash < 0.8) {
    crashPoint = 2.5 + Math.random() * 2.5; // 2.5x - 5.0x (30% chance)
  } else if (randomCrash < 0.95) {
    crashPoint = 5.0 + Math.random() * 10; // 5.0x - 15.0x (15% chance)
  } else {
    crashPoint = 15.0 + Math.random() * 35; // 15.0x - 50.0x (5% chance)
  }
  
  return parseFloat(crashPoint.toFixed(2));
};

// Color prediction game logic
export const simulateColorRound = () => {
  const colors = ['red', 'green', 'violet'];
  const random = Math.random();
  
  // Red: 45%, Green: 45%, Violet: 10% (higher payout)
  if (random < 0.45) return 'red';
  if (random < 0.90) return 'green';
  return 'violet';
};

// Car game logic
export const simulateCarRace = () => {
  const cars = [
    { id: 1, name: 'Red Racer', color: '#ef4444' },
    { id: 2, name: 'Blue Thunder', color: '#3b82f6' },
    { id: 3, name: 'Green Machine', color: '#10b981' },
    { id: 4, name: 'Yellow Flash', color: '#f59e0b' }
  ];
  
  // Shuffle and assign positions
  const shuffled = [...cars].sort(() => Math.random() - 0.5);
  return shuffled.map((car, index) => ({
    ...car,
    position: index + 1,
    time: (8.5 + Math.random() * 2).toFixed(2) // Random finish time
  }));
};

// Calculate payouts
export const GAME_PAYOUTS = {
  aviator: (multiplier) => multiplier,
  color: {
    red: 2,
    green: 2,
    violet: 4.5
  },
  car: {
    1: 3.5,
    2: 2.5,
    3: 1.8,
    4: 1.2
  }
};
