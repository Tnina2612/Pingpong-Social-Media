import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuthUser } from "@/hooks";
import { useOnboardInterests } from "@/services/homepage/onboard-interests";
import { CATEGORIES } from "@/types/interests";

export default function OnboardingModal() {
  const navigate = useNavigate();
  const { mutateAsync: onboardInterests } = useOnboardInterests();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  };

  const handleSubmit = async () => {
    if (selectedTopics.length < 3) return;

    const authState = useAuthUser.getState();
    if (!authState.user || !authState.accessToken) {
      toast.error("Session expired. Please login again.");
      navigate("/login", { replace: true });
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await onboardInterests({ topics: selectedTopics });

      useAuthUser.getState().setAuthUser(
        {
          ...authState.user,
          hasCompletedOnboarding: true,
        },
        authState.accessToken,
      );

      toast.success(data.message || "Interests saved successfully");
      navigate("/homepage", { replace: true });
    } catch {
      // Error toast is handled in mutation onError
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-black text-white w-full max-w-2xl h-[80vh] flex flex-col rounded-2xl overflow-hidden border border-gray-800">
        {/* Header */}
        <div className="p-8 pb-4">
          <h1 className="text-3xl font-bold mb-2">What do you want to see?</h1>
          <p className="text-gray-400 text-sm">
            Select at least 3 interests to personalize your experience. They
            will be visible on your profile.
          </p>
        </div>

        {/* Scrollable Grid */}
        <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CATEGORIES.map((category) => {
              const isSelected = selectedTopics.includes(category);
              return (
                <button
                  key={category}
                  onClick={() => toggleTopic(category)}
                  className={`relative h-24 p-4 flex items-end rounded-xl border text-left transition-all duration-200
                    ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-gray-700 hover:bg-gray-900"
                    }`}
                >
                  <span className="font-semibold text-sm leading-tight">
                    {category}
                  </span>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex items-center justify-between mt-auto">
          <span className="text-sm text-gray-500">
            {selectedTopics.length} of 3 selected
          </span>
          <button
            onClick={handleSubmit}
            disabled={selectedTopics.length < 3 || isSubmitting}
            className={`px-8 py-3 rounded-full font-bold transition-colors
              ${
                selectedTopics.length >= 3
                  ? "bg-white text-black hover:bg-gray-200"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
          >
            {isSubmitting ? "Saving..." : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
