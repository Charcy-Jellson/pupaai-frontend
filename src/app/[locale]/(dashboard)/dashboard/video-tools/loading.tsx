import { LoadingSpinner } from "@/components/common/loading-spinner";

export default function VideoToolsLoading() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <LoadingSpinner size="lg" />
    </div>
  );
}

