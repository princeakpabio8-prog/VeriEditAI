import { ReengagementDashboard } from '@/components/ReengagementDashboard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function ReengagementAnalytics() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/admin')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Admin
      </Button>
      
      <ReengagementDashboard />
    </div>
  );
}
