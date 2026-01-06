export const LoadingState = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
        <p className="mt-6 text-gray-500">A IA está processando seus dados...</p>
    </div>
);
