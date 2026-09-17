import { useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck } from 'lucide-react';
import { useAuth } from '../features/auth/authContext';
import { useFollow } from '../hooks/useFollow';

interface FollowButtonProps {
  storeId: string;
  className?: string;
}

export function FollowButton({ storeId, className = '' }: FollowButtonProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { isFollowing, toggle } = useFollow(storeId);

  const handleClick = async () => {
    if (!profile) {
      navigate('/connexion?mode=register');
      return;
    }
    await toggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`btn-outline text-sm flex items-center gap-1.5 ${isFollowing ? 'border-vert-marche text-vert-marche' : ''} ${className}`}
    >
      {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
      {isFollowing ? 'Suivi' : 'Suivre'}
    </button>
  );
}
