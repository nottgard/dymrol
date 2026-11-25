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
        className={`group fixed left-0 top-0 z-9999 pointer-events-none hidden -translate-x-1/2 -translate-y-[22%] ${className}`}
        aria-hidden="true"
      >
        <img
          className="block size-22 group-[.golpe]:animate-golpe object-contain origin-[50%_94%] [transform:rotate(32deg)] [filter:drop-shadow(0_4px_6px_rgba(0,0,0,0.45))] select-none [-webkit-user-drag:none]"
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
