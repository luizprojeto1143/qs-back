

interface SkeletonProps {
    className?: string;
    count?: number;
}

export const Skeleton = ({ className }: SkeletonProps) => {
    return (
        <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
    );
};

export const SkeletonCard = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
            </div>
        </div>
    </div>
);

export const SkeletonRow = () => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2 flex-1 max-w-sm">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
    </div>
);
