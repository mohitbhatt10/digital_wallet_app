import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Layout currentPage="profile">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold mb-6 tracking-tight">Profile</h1>
        <div className="grid gap-6">
          <div className="card p-6">
            <h2 className="text-lg font-medium mb-4">Account Details</h2>
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Username</dt>
                <dd className="font-medium text-gray-800">{user.username}</dd>
              </div>
              {user.firstName && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">First Name</dt>
                  <dd className="font-medium text-gray-800">
                    {user.firstName}
                  </dd>
                </div>
              )}
              {user.lastName && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Last Name</dt>
                  <dd className="font-medium text-gray-800">{user.lastName}</dd>
                </div>
              )}
              {user.email && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Email</dt>
                  <dd className="font-medium text-gray-800">{user.email}</dd>
                </div>
              )}
              {user.country && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Country</dt>
                  <dd className="font-medium text-gray-800">{user.country}</dd>
                </div>
              )}
              {user.currency && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Currency</dt>
                  <dd className="font-medium text-gray-800">{user.currency}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </Layout>
  );
}
