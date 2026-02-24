import { HomePageHeader } from "./header";

export const HomeLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-black">
      <HomePageHeader />

      <div className="pt-20 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_320px] lg:grid-cols-[320px_1fr_320px] gap-0">
          {children}
        </div>
      </div>
    </div>
  );
};
