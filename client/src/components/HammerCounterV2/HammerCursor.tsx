import { forwardRef } from 'react';

export interface HammerCursorProps {
  className?: string;
  src?: string;
}

export const HammerCursor = forwardRef<HTMLDivElement, HammerCursorProps>(
  function HammerCursor({ className = '', src = '/assets/hammer/h1.svg' }, ref) {
    return (
      <div
        ref={ref}
        id="martillo"
        className={`hammer-cursor ${className}`}
        aria-hidden="true"
      >
        <img
          src={src}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      </div>
    );
  }
);

export default HammerCursor;
