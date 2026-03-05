export const SubLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mt-20 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_320px] lg:grid-cols-[320px_1fr_320px] gap-0">
      {children}
    </div>
  );
};
