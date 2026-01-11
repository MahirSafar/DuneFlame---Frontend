import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import UserProfile from "@/components/dashboard/user-profile"
import OrderHistory from "@/components/dashboard/order-history"
import SavedCoffees from "@/components/dashboard/saved-coffees"
import Rewards from "@/components/dashboard/rewards"

export default function DashboardPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary dark:text-secondary">My Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your account, orders, and rewards</p>
          </div>

          <div className="space-y-12">
            <UserProfile />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <OrderHistory />
              </div>
              <div className="lg:col-span-1">
                <Rewards />
              </div>
            </div>

            <SavedCoffees />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
