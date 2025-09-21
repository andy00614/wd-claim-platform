"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  hasItems: boolean;
  buttonText?: string;
}

export default function SubmitButton({
  hasItems,
  buttonText = "Submit Claim",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <div className="text-center mt-6">
      <button
        type="button"
        onClick={() => window.history.back()}
        className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 mr-4"
        disabled={pending}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={pending || !hasItems}
        className={`px-6 py-2 text-white ${
          pending || !hasItems
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-black hover:bg-gray-800"
        }`}
      >
        {pending ? (
          <span className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Submitting...
          </span>
        ) : (
          buttonText
        )}
      </button>
    </div>
  );
}
