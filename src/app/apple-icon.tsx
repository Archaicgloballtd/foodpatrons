import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <svg width="180" height="180" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="9" fill="#1B2560" />
        <path
          d="M20 5C13.373 5 8 10.373 8 17c0 9 12 16.5 12 16.5s12-7.5 12-16.5C32 10.373 26.627 5 20 5z"
          fill="#F97316"
        />
        <circle cx="26" cy="11" r="5.5" fill="#1B2560" />
      </svg>
    ),
    { ...size },
  );
}
