import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';

export default function SignalFeed() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold">Signal Feed</h1>
          <p className="text-muted-foreground mt-2">Top verified stories coming soon</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
