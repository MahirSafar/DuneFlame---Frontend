"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Search,
  Lock,
  Unlock,
  Loader2,
  RotateCw,
  ShieldCheck,
  UserCog,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import toast from "react-hot-toast"
import {
  AdminUser,
  assignUserRole,
  getAdminUsers,
  toggleUserBan,
} from "@/lib/services/adminUsers"
import { getErrorMessage } from "@/lib/utils"

const AVAILABLE_ROLES = ["Customer", "Admin"]

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Role modal state
  const [roleModalUser, setRoleModalUser] = useState<AdminUser | null>(null)
  const [selectedRole, setSelectedRole] = useState("")
  const [assigningRole, setAssigningRole] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAdminUsers()
      setUsers(data)
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleToggleBan = async (user: AdminUser) => {
    setTogglingId(user.id)
    try {
      await toggleUserBan(user.id)
      toast.success(
        user.isLockedOut
          ? `${user.fullName} has been unblocked`
          : `${user.fullName} has been blocked`
      )
      await fetchUsers()
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to update user status")
    } finally {
      setTogglingId(null)
    }
  }

  const handleAssignRole = async () => {
    if (!roleModalUser || !selectedRole) return
    setAssigningRole(true)
    try {
      await assignUserRole(roleModalUser.id, selectedRole)
      toast.success(`Role updated to ${selectedRole} for ${roleModalUser.fullName}`)
      setRoleModalUser(null)
      await fetchUsers()
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to assign role")
    } finally {
      setAssigningRole(false)
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-primary dark:text-secondary mb-2">
            Users Management
          </h1>
          <p className="text-muted-foreground">
            Manage customer accounts and permissions
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
          disabled={loading}
          className="glass border-border"
        >
          <RotateCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="glass rounded-lg p-4">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-0 pl-12 focus-visible:ring-accent/50"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass rounded-xl overflow-hidden card-depth">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <UserCog className="w-12 h-12 opacity-30" />
            <p className="text-lg font-medium">No users found</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/5">
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Name & Email</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Role</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border hover:bg-accent/5 transition-smooth group"
                >
                  {/* Name & Email */}
                  <td className="py-4 px-6">
                    <p className="font-semibold text-foreground">{user.fullName}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
                  </td>

                  {/* Role */}
                  <td className="py-4 px-6">
                    <button
                      onClick={() => {
                        setRoleModalUser(user)
                        setSelectedRole(user.roles[0] ?? "Customer")
                      }}
                      title="Click to change role"
                      className="group/role"
                    >
                      <Badge
                        variant="secondary"
                        className="bg-accent/10 text-accent hover:bg-accent/20 transition-smooth cursor-pointer gap-1"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {user.roles[0] ?? "—"}
                      </Badge>
                    </button>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6">
                    {user.isLockedOut ? (
                      <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20">
                        Blocked
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20">
                        Active
                      </Badge>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={togglingId === user.id}
                      onClick={() => handleToggleBan(user)}
                      className={
                        user.isLockedOut
                          ? "border-green-500/40 text-green-600 dark:text-green-400 hover:bg-green-500/10"
                          : "border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                      }
                    >
                      {togglingId === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : user.isLockedOut ? (
                        <>
                          <Unlock className="w-4 h-4 mr-1.5" />
                          Unblock
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-1.5" />
                          Block
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Role Assignment Modal */}
      <Dialog
        open={!!roleModalUser}
        onOpenChange={(open) => { if (!open) setRoleModalUser(null) }}
      >
        <DialogContent className="glass-dark dark:glass card-depth max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary dark:text-secondary">
              Change User Role
            </DialogTitle>
          </DialogHeader>

          {roleModalUser && (
            <div className="space-y-5 pt-2">
              <p className="text-sm text-muted-foreground">
                Assigning role for{" "}
                <span className="font-semibold text-foreground">{roleModalUser.fullName}</span>
              </p>

              <div className="space-y-2">
                {AVAILABLE_ROLES.map((role) => (
                  <label
                    key={role}
                    className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/5 transition-smooth cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={selectedRole === role}
                      onChange={() => setSelectedRole(role)}
                      className="w-4 h-4 accent-accent"
                    />
                    <span className="text-foreground font-medium">{role}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setRoleModalUser(null)}
                  disabled={assigningRole}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-warm-btn text-accent-foreground"
                  onClick={handleAssignRole}
                  disabled={assigningRole || selectedRole === roleModalUser.roles[0]}
                >
                  {assigningRole ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Update Role"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
