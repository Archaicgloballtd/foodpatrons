import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1B2560" />
        <path
          d="M20 5C13.373 5 8 10.373 8 17c0 9 12 16.5 12 16.5s12-7.5 12-16.5C32 10.373 26.627 5 20 5z"
          fill="#F97316"
        />
        {/* bite, punched out in the same color as the background above */}
        <circle cx="26" cy="11" r="5.5" fill="#1B2560" />
      </svg>
    ),
    { ...size },
  );
}
