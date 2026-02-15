import { HomePageHeader } from "./header";

export const HomeLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-black">
      <HomePageHeader />

      <div className="pt-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-3 gap-6">
          {children}
        </div>
      </div>
    </div>
  );
};
