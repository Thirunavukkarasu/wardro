import Image from "next/image";

interface PhoneShotProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}

export default function PhoneShot({
  src,
  alt,
  priority = false,
  className = "",
}: PhoneShotProps) {
  return (
    <div className={`phone-shell ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={860}
        height={1776}
        priority={priority}
        className="h-auto w-full"
        sizes="(max-width: 768px) 78vw, 390px"
      />
    </div>
  );
}
