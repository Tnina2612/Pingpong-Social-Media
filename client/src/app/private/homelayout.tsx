import { Outlet } from "react-router-dom";
import { HomePageHeader } from "@/components/homepage";

export const HomeLayout = () => {
  return (
    <div className="min-h-screen bg-black">
      <HomePageHeader />

      <div className="relative">
        <Outlet />
      </div>
    </div>
  );
};
