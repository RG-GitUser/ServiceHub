export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900">Cookies & Local Storage</h1>
          <p className="mt-4 text-gray-700">
            ServiceHub uses cookies/local storage to make the app work properly (authentication + cart) and to improve
            your experience.
          </p>

          <div className="mt-6 space-y-4 text-gray-700">
            <div>
              <div className="font-semibold text-gray-900">Essential</div>
              <p className="mt-1">
                We store your cart in your browser so it persists between page refreshes. We also use session cookies
                required by Appwrite authentication.
              </p>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Preference</div>
              <p className="mt-1">
                We remember whether you accepted this cookie notice.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


