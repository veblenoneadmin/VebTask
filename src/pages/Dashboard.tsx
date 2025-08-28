import { useSession, signOut } from '../lib/auth-client';

export default function Dashboard() {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut();
    // The useSession hook will detect the session change
    // and the user will be redirected via the App component
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">🎉 VebTask Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {session?.user?.name || session?.user?.email}!
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🎯 Authentication Working!
              </h2>
              <p className="text-gray-600 mb-6">
                You have successfully logged in with better-auth
              </p>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Information</h3>
                <div className="text-left space-y-2">
                  <p><strong>User ID:</strong> {session?.user?.id}</p>
                  <p><strong>Email:</strong> {session?.user?.email}</p>
                  <p><strong>Name:</strong> {session?.user?.name}</p>
                  <p><strong>Email Verified:</strong> {session?.user?.emailVerified ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">🚀 Ready for Features!</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">📋 Tasks</h4>
                    <p className="text-sm text-blue-600">Task management system</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900">⏰ Time Tracking</h4>
                    <p className="text-sm text-green-600">Track time spent on tasks</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900">📊 Reports</h4>
                    <p className="text-sm text-purple-600">Generate productivity reports</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}