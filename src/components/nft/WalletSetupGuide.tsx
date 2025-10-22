import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download, Smartphone, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export function WalletSetupGuide() {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const wallets = [
    {
      id: 'metamask',
      name: 'MetaMask',
      color: 'bg-orange-500',
      icon: 'M',
      description: 'Most popular crypto wallet',
      difficulty: 'Easy',
      iosUrl: 'https://apps.apple.com/app/metamask/id1438144202',
      androidUrl: 'https://play.google.com/store/apps/details?id=io.metamask',
      steps: [
        'Download MetaMask from your app store',
        'Open app and tap "Get Started"',
        'Create new wallet or import existing',
        'Write down your secret recovery phrase',
        'Come back here and tap "Connect Wallet"'
      ]
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      color: 'bg-blue-500',
      icon: 'T',
      description: 'User-friendly for beginners',
      difficulty: 'Very Easy',
      iosUrl: 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409',
      androidUrl: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp',
      steps: [
        'Download Trust Wallet from app store',
        'Tap "Create a New Wallet"',
        'Back up your recovery phrase securely',
        'Verify your recovery phrase',
        'Return here and connect your wallet'
      ]
    },
    {
      id: 'rainbow',
      name: 'Rainbow',
      color: 'bg-purple-500',
      icon: 'R',
      description: 'Beautiful and simple',
      difficulty: 'Easy',
      iosUrl: 'https://apps.apple.com/app/rainbow-ethereum-wallet/id1457119021',
      androidUrl: 'https://play.google.com/store/apps/details?id=me.rainbow',
      steps: [
        'Download Rainbow from app store',
        'Open and tap "Create New Wallet"',
        'Save your secret recovery phrase',
        'Complete the backup verification',
        'Come back and tap "Connect Wallet"'
      ]
    }
  ];

  const selectedWalletData = wallets.find(w => w.id === selectedWallet);

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-bold text-foreground">Set Up Your Wallet</h3>
        <p className="text-sm text-muted-foreground">
          Choose a wallet and follow the simple steps
        </p>
      </div>

      {!selectedWallet ? (
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <Card
              key={wallet.id}
              className="p-4 cursor-pointer hover:border-primary/50 transition-colors bg-background/50"
              onClick={() => setSelectedWallet(wallet.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${wallet.color} rounded-lg flex items-center justify-center text-white text-xl font-bold`}>
                  {wallet.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{wallet.name}</p>
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {wallet.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{wallet.description}</p>
                </div>
                <Smartphone className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          ))}

          <div className="pt-2 text-center">
            <p className="text-xs text-muted-foreground">
              All wallets are free and secure. Choose based on your preference.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 ${selectedWalletData?.color} rounded-lg flex items-center justify-center text-white text-xl font-bold`}>
                {selectedWalletData?.icon}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{selectedWalletData?.name}</p>
                <p className="text-xs text-muted-foreground">{selectedWalletData?.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedWallet(null)}
              >
                Change
              </Button>
            </div>

            {/* Download Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.open(selectedWalletData?.iosUrl, '_blank')}
              >
                <Download className="h-4 w-4" />
                iOS App
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.open(selectedWalletData?.androidUrl, '_blank')}
              >
                <Download className="h-4 w-4" />
                Android
              </Button>
            </div>

            {/* Setup Steps */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground mb-2">Setup Steps:</p>
              {selectedWalletData?.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{idx + 1}</span>
                  </div>
                  <p className="text-xs text-foreground">{step}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Important Tips */}
          <Card className="p-4 bg-amber-500/10 border-amber-500/20">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">
              ⚠️ Important Security Tips
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Never share your recovery phrase with anyone</li>
              <li>• Write it down on paper (don't screenshot)</li>
              <li>• Store it in a safe place offline</li>
              <li>• Your recovery phrase = access to your wallet</li>
            </ul>
          </Card>

          {/* Success Indicator */}
          <Card className="p-4 bg-green-500/10 border-green-500/20">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  Wallet Set Up?
                </p>
                <p className="text-xs text-muted-foreground">
                  Return to minting and tap "Connect Wallet"
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
