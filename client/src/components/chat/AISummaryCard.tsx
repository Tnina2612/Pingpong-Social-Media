import type { FC } from "react";

export const AISummaryCard: FC = () => (
  <div className="ml-16.5 mr-4 my-1">
    <div className="bg-[rgba(30,32,36,0.9)] border border-indigo-500/30 rounded-lg p-4 backdrop-blur-sm">
      <p className="font-bold text-white text-sm mb-2.5">
        Summary of the dinner discussion:
      </p>
      <ul className="list-disc pl-4 text-[#dcddde] text-sm space-y-1 leading-relaxed">
        <li>
          The group is deciding between{" "}
          <strong className="text-white">Italian</strong> or{" "}
          <strong className="text-white">Sushi</strong>.
        </li>
        <li>
          <strong className="text-white">Time:</strong> 7:00 PM tonight.
        </li>
        <li>
          <strong className="text-white">Location Idea:</strong> "Sakura"
          (Sushi) downtown.
        </li>
        <li>
          <strong className="text-white">Estimated Cost:</strong> ~$120 total
          for the group.
        </li>
      </ul>
      <div className="flex gap-2 mt-3">
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-3.5 py-1.5 rounded transition-colors">
          Create Poll
        </button>
        <button className="bg-transparent text-gray-400 hover:text-gray-200 border border-[#4f545c] hover:border-gray-400 text-xs font-semibold px-3.5 py-1.5 rounded transition-colors">
          Show Restaurant Map
        </button>
      </div>
    </div>
  </div>
);
