import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '../features/auth/authContext';
import { useFavorite } from '../hooks/useFavorites';

interface FavoriteButtonProps {
  productId?: string;
  storeId?: string;
  className?: string;
  size?: number;
}

export function FavoriteButton({ productId, storeId, className = '', size = 18 }: FavoriteButtonProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggle } = useFavorite({ productId, storeId });

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
      title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={`flex items-center justify-center rounded-full bg-white/90 dark:bg-encre-nuit/90 p-2 shadow-sm transition-colors ${className}`}
    >
      <Heart
        size={size}
        className={isFavorite ? 'fill-corail-alerte text-corail-alerte' : 'text-encre-nuit dark:text-sable-chaud'}
      />
    </button>
  );
}
