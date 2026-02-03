import { HomePageHeader } from "@/components/homepage/header";

export const HomePage = () => {
  return (
    <div className="min-h-screen w-full relative bg-black pt-28">
        {/* X Organizations Black Background with Top Glow */} {" "}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(120, 180, 255, 0.25), transparent 70%), #000000",
        }}
      />
      <HomePageHeader />
      <div className="relative text-2xl text-white z-50  ">check</div>
    </div>
  );
};
