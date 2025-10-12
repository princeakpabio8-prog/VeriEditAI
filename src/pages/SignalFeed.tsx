import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';

export default function SignalFeed({ embedded = false }: { embedded?: boolean }) {
  return (
    <div className={embedded ? "" : "min-h-screen bg-background"}>
      {!embedded && <Navigation />}
      <div className={embedded ? "py-8" : "pt-24 pb-24 md:pb-16 px-4"}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold">Signal Feed</h1>
          <p className="text-muted-foreground mt-2">Top verified stories coming soon</p>
        </div>
      </div>
      {!embedded && <Footer />}
    </div>
  );
}
