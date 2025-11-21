import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { getCurrentUser, getUserBalance, depositBalance, withdrawBalance } from '../mock'; // Assuming these functions exist or will be created
import { Wallet, DollarSign, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const ProfilePage = ({ onBalanceChange }) => {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setBalance(getUserBalance());
  }, []);

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid deposit amount.",
        variant: "destructive",
      });
      return;
    }
    depositBalance(amount); // Update mock balance
    setBalance(getUserBalance()); // Get updated balance
    setDepositAmount('');
    onBalanceChange(); // Notify parent (Dashboard) to refresh balance
    toast({
      title: "Success",
      description: `Successfully deposited ₹${amount.toFixed(2)}.`,
    });
  };

  const handleWithdrawal = () => {
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive",
      });
      return;
    }
    if (amount > balance) {
      toast({
        title: "Error",
        description: "Insufficient balance for withdrawal.",
        variant: "destructive",
      });
      return;
    }
    withdrawBalance(amount); // Update mock balance
    setBalance(getUserBalance()); // Get updated balance
    setWithdrawalAmount('');
    onBalanceChange(); // Notify parent (Dashboard) to refresh balance
    toast({
      title: "Success",
      description: `Successfully withdrew ₹${amount.toFixed(2)}.`,
    });
  };

  if (!user) {
    return (
      <div className="text-center text-white text-xl">Loading user profile...</div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Wallet className="w-8 h-8 text-yellow-400" />
          <div>
            <p className="text-gray-400 text-lg">Current Balance</p>
            <h2 className="text-4xl font-bold text-white">₹{balance.toFixed(2)}</h2>
          </div>
        </div>
      </Card>

      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 p-6 space-y-4">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <ArrowUp className="w-6 h-6 text-green-400" /> Deposit Funds
        </h3>
        <div className="flex gap-4">
          <div className="grid flex-1 items-center gap-1.5">
            <Label htmlFor="deposit-amount" className="text-gray-400">Amount</Label>
            <Input
              id="deposit-amount"
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="e.g., 1000"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <Button onClick={handleDeposit} className="mt-auto bg-green-600 hover:bg-green-700">
            Deposit
          </Button>
        </div>
      </Card>

      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 p-6 space-y-4">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <ArrowDown className="w-6 h-6 text-red-400" /> Withdraw Funds
        </h3>
        <div className="flex gap-4">
          <div className="grid flex-1 items-center gap-1.5">
            <Label htmlFor="withdrawal-amount" className="text-gray-400">Amount</Label>
            <Input
              id="withdrawal-amount"
              type="number"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              placeholder="e.g., 500"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <Button onClick={handleWithdrawal} className="mt-auto bg-red-600 hover:bg-red-700">
            Withdraw
          </Button>
        </div>
      </Card>

      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 p-6 space-y-4">
        <h3 className="text-2xl font-bold text-white">User Information</h3>
        <div className="space-y-2 text-gray-300">
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          {/* Add other user details as needed */}
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
