const corners = ["top-0 left-0", "top-0 right-0", "bottom-0 left-0"];

/**
 * The three finder patterns of a QR code, placed on the corners of the
 * nearest positioned ancestor. Frames every scan target in the scanner.
 */
export function FinderFrame({ className = "" }: { className?: string }) {
  return (
    <>
      {corners.map((position) => (
        <svg
          key={position}
          viewBox="0 0 7 7"
          aria-hidden="true"
          className={`absolute ${position} fill-current ${className}`}
        >
          <path fillRule="evenodd" d="M0 0h7v7H0zM1 1v5h5V1zM2 2h3v3H2z" />
        </svg>
      ))}
    </>
  );
}
