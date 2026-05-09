import { ImageResponse } from "next/og";
import { PwaIcon } from "../lib/pwa-icon";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<PwaIcon label="NS" size={size.width} />, size);
}
