import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { Link, useRouteError } from "react-router-dom";

export const ErrorPage = () => {
  const error = useRouteError();
  console.log(error);

  useEffect(() => {
    toast.error("Failed to load the page. Please refresh or try again later.");
  }, []);

  return (
    <div className="fixed inset-0 min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-100 px-6 w-screen">
      <div className="p-6 bg-red-500/10 rounded-full mb-6">
        <AlertTriangle className="w-20 h-20 text-red-400" />
      </div>

      <h1 className="text-4xl font-bold text-red-400 mb-2">Oops!</h1>

      <p className="text-lg text-gray-300 mb-6">
        Something went wrong while loading the page.
      </p>
      <Link
        to="/"
        className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-400 rounded-lg hover:bg-red-500/30 transition "
      >
        Come back home
      </Link>
    </div>
  );
};
