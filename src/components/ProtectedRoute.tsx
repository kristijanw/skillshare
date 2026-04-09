import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
  allowUnverified?: boolean;
}

const ProtectedRoute = ({ children, allowUnverified = false }: Props) => {
  const { user, loading, onboardingCompleted } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Onboarding route (allowUnverified) — skip further checks
  if (allowUnverified) return <>{children}</>;

  if (!user.email_confirmed_at) return <Navigate to="/verify-email" replace />;

  if (onboardingCompleted === false) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
