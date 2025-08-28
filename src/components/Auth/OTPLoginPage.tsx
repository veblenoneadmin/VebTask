import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Mail, 
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import veblenLogo from '@/assets/veblen-logo.png';
import { authClient } from '@/lib/auth-client';

const OTPLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Email is required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in"
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setIsOtpSent(true);
      toast.success('Verification code sent to your email!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await authClient.signIn.emailOtp({
        email,
        otp
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in"
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast.success('New verification code sent!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md p-8 glass">
        <div className="text-center mb-8">
          <img 
            src={veblenLogo} 
            alt="Veblen" 
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold gradient-text flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6" />
            {isOtpSent ? 'Enter Code' : 'Sign In'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isOtpSent 
              ? 'Enter the 6-digit code sent to your email'
              : 'Enter your email to receive a verification code'
            }
          </p>
        </div>

        {!isOtpSent ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? 'Sending Code...' : (
                <>
                  Send Verification Code
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-medium">
                Verification Code
              </Label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="pl-10 text-center text-lg font-mono tracking-wider"
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Code sent to {email}
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? 'Verifying...' : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center space-y-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOtpSent(false)}
                className="text-sm"
                disabled={isLoading}
              >
                Change Email
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleResendOTP}
                className="text-sm"
                disabled={isLoading}
              >
                Resend Code
              </Button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default OTPLoginPage;