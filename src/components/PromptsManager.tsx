import React, { useState, useEffect } from 'react';
import { BottomSheet } from './ui/BottomSheet';
import { Button } from './ui/Button';
import { Heart, BarChart2 } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

export function PromptsManager() {
  const [showDonation, setShowDonation] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    // Check Analytics Permission
    const analyticsAccepted = localStorage.getItem('analytics_accepted');
    if (analyticsAccepted === 'true') {
      setAnalyticsEnabled(true);
    } else if (analyticsAccepted !== 'false') {
      const lastAnalyticsPrompt = localStorage.getItem('last_analytics_prompt');
      const now = Date.now();
      const twentyDays = 20 * 24 * 60 * 60 * 1000;
      
      if (!lastAnalyticsPrompt || now - parseInt(lastAnalyticsPrompt) > twentyDays) {
        setShowAnalytics(true);
        localStorage.setItem('last_analytics_prompt', now.toString());
      }
    }

    // Check Donation Prompt
    const donationAccepted = localStorage.getItem('donation_accepted');
    if (donationAccepted !== 'true') {
      const lastDonationPrompt = localStorage.getItem('last_donation_prompt');
      const now = Date.now();
      const fiveDays = 5 * 24 * 60 * 60 * 1000;
      
      if (!lastDonationPrompt || now - parseInt(lastDonationPrompt) > fiveDays) {
        // Show donation only if analytics is not showing to avoid stacking
        if (!showAnalytics) {
          setShowDonation(true);
          localStorage.setItem('last_donation_prompt', now.toString());
        }
      }
    }
  }, [showAnalytics]);

  const handleAcceptAnalytics = () => {
    localStorage.setItem('analytics_accepted', 'true');
    setAnalyticsEnabled(true);
    setShowAnalytics(false);
  };

  const handleDeclineAnalytics = () => {
    localStorage.setItem('analytics_accepted', 'false');
    setShowAnalytics(false);
  };

  const handleDonate = () => {
    localStorage.setItem('donation_accepted', 'true');
    window.open('https://ko-fi.com/landecsorg', '_blank');
    setShowDonation(false);
  };

  const handleDismissDonation = () => {
    setShowDonation(false);
  };

  return (
    <>
      {analyticsEnabled && <Analytics />}

      <BottomSheet
        isOpen={showAnalytics}
        onClose={handleDeclineAnalytics}
        title="Help Us Improve"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl mx-auto mb-4">
            <BarChart2 className="w-8 h-8" />
          </div>
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            We use Vercel Analytics to understand how you use LanTrack and improve your experience. 
            No personal data is collected. Would you like to enable analytics?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={handleDeclineAnalytics}>
              Not Now
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleAcceptAnalytics}>
              Enable Analytics
            </Button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={showDonation}
        onClose={handleDismissDonation}
        title="Support LanTrack"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-center w-16 h-16 bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400 rounded-2xl mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            LanTrack is free to use. If you find it helpful, consider supporting the development with a small donation. 
            It helps keep the servers running and new features coming!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={handleDismissDonation}>
              Maybe Later
            </Button>
            <Button variant="primary" className="flex-1 bg-pink-600 hover:bg-pink-700 text-white border-none" onClick={handleDonate}>
              Donate on Ko-fi
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
