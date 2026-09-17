import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
  showCount?: number;
}

export function StarRating({ value, onChange, readOnly = false, size = 14, showCount }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {stars.map((n) => (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n)}
            className={readOnly ? 'cursor-default' : 'cursor-pointer'}
          >
            <Star
              size={size}
              className={n <= Math.round(value) ? 'fill-ambre-pagne text-ambre-pagne' : 'text-brume/40'}
            />
          </button>
        ))}
      </div>
      {typeof showCount === 'number' && (
        <span className="text-xs text-brume">({showCount})</span>
      )}
    </div>
  );
}
