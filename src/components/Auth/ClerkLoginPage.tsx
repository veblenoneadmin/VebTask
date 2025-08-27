import React from 'react';
import { Link } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import veblenLogo from '@/assets/veblen-logo.png';

const ClerkLoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      <div className="absolute top-20 left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" />
      
      <Card className="glass w-full max-w-md p-8 relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="h-12 w-12 flex items-center justify-center">
              <img src={veblenLogo} alt="VebTask Logo" className="h-12 w-12 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">VebTask</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Task Management</p>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Welcome back!</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Sign in to your account to continue
          </p>
        </div>

        {/* Clerk Sign In Component */}
        <div className="w-full space-y-6">
          <SignIn 
            fallbackRedirectUrl="/dashboard"
            appearance={{
              elements: {
                formButtonPrimary: 'bg-gradient-primary hover:shadow-lg text-white font-medium py-3 rounded-md transition-all border-0 w-full mt-6',
                card: 'bg-transparent shadow-none border-0 p-0 w-full',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'bg-surface-elevated hover:bg-surface-elevated/80 text-foreground rounded-md transition-all border-0 py-3',
                dividerLine: 'bg-muted-foreground/20 h-px border-0 my-6',
                dividerText: 'text-muted-foreground text-xs opacity-60 px-3',
                formFieldInput: 'bg-surface-elevated text-foreground rounded-md px-4 py-3 transition-all border-0 w-full placeholder:text-muted-foreground placeholder:opacity-70',
                formFieldLabel: 'text-foreground font-medium mb-2 text-sm block',
                identityPreviewText: 'text-muted-foreground',
                formResendCodeLink: 'text-primary hover:text-primary-glow font-medium transition-colors text-sm',
                footerActionLink: 'text-primary hover:text-primary-glow font-medium transition-colors',
                footerActionText: 'text-muted-foreground opacity-80',
                footerText: 'text-muted-foreground opacity-80 text-center',
                footerPageLink: 'text-primary hover:text-primary-glow font-medium transition-colors',
                footer: 'bg-transparent p-0 mt-6 text-center border-0',
                footerAction: 'bg-transparent p-0 mt-4 text-center border-0',
                footerPages: 'bg-transparent p-0 mt-4 text-center border-0',
                main: 'bg-transparent border-0 p-0 w-full',
                rootBox: 'bg-transparent border-0 p-0 w-full',
                cardBox: 'bg-transparent border-0 shadow-none p-0 w-full',
                poweredByClerk: 'text-muted-foreground opacity-30 text-xs text-center mt-4',
                branded: 'text-muted-foreground opacity-30 text-xs text-center mt-4',
                form: 'space-y-5',
                formField: 'space-y-2 mb-5',
                socialButtons: 'space-y-3 mb-6',
              },
              layout: {
                socialButtonsPlacement: 'top',
              },
            }}
          />
        </div>

        {/* Demo Access */}
        <div className="mt-6 p-4 bg-info/10 border border-info/20 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="h-4 w-4 text-info" />
            <span className="text-sm font-medium text-info">Demo Access</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Use any email and password to explore the full system
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ClerkLoginPage;