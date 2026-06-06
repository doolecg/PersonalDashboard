export const shellBackgroundClassName = [
  "pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]",
  "before:absolute before:inset-0 before:bg-black/55 before:content-['']"
].join(" ");

export const shellBackgroundImageClassName = [
  "absolute inset-[-4%] scale-110 bg-cover bg-center bg-no-repeat blur-3xl"
].join(" ");

export const shellForegroundClassName = "relative z-10 flex min-h-[calc(100svh-2rem)] flex-col gap-4";
