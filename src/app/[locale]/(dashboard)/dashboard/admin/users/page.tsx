"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { RoleGate } from "@/components/common/role-gate";
import type { UserRole, UserTier } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Search,
  MoreHorizontal,
  Crown,
  User as UserIcon,
  Sparkles,
  Star,
  Gem,
  Building2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface UserWithRole {
  id: string;
  user_id: string;
  role: UserRole;
  tier: UserTier;
  created_at: string;
  updated_at: string;
}

// Tier configuration for display
const TIER_CONFIG: Record<UserTier, { label: string; color: string; icon: React.ReactNode }> = {
  free: { label: "Free", color: "border-slate-500/50 bg-slate-500/10 text-slate-400", icon: <UserIcon className="w-3 h-3 mr-1" /> },
  plus: { label: "Plus", color: "border-blue-500/50 bg-blue-500/10 text-blue-400", icon: <Star className="w-3 h-3 mr-1" /> },
  pro: { label: "Pro", color: "border-violet-500/50 bg-violet-500/10 text-violet-400", icon: <Sparkles className="w-3 h-3 mr-1" /> },
  premium: { label: "Premium", color: "border-amber-500/50 bg-amber-500/10 text-amber-400", icon: <Gem className="w-3 h-3 mr-1" /> },
  business: { label: "Business", color: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400", icon: <Building2 className="w-3 h-3 mr-1" /> },
};

// Badge component for roles
function RoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        role === "admin"
          ? "border-red-500/50 bg-red-500/10 text-red-400"
          : "border-slate-500/50 bg-slate-500/10 text-slate-400"
      )}
    >
      {role === "admin" ? (
        <Crown className="w-3 h-3 mr-1" />
      ) : (
        <UserIcon className="w-3 h-3 mr-1" />
      )}
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  );
}

// Badge component for tiers
function TierBadge({ tier }: { tier: UserTier }) {
  const config = TIER_CONFIG[tier];
  return (
    <Badge variant="outline" className={cn("font-medium", config.color)}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

export default function UserManagementPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const pathname = usePathname();
  const t = useTranslations("admin.users");
  const tc = useTranslations("common");
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);
  const [newUserId, setNewUserId] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("user");
  const [newUserTier, setNewUserTier] = useState<UserTier>("free");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close dialogs when route changes to prevent overlay from getting stuck
  useEffect(() => {
    setAddDialogOpen(false);
    setDeleteDialogOpen(false);
  }, [pathname]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to load users");
      const { users: data } = await res.json();
      setUsers(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserId.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: newUserId.trim(), role: newUserRole, tier: newUserTier }),
      });
      const success = res.ok;
      
      if (success) {
        toast({
          title: t("userAdded"),
          description: t("userAddedDesc", { role: newUserRole, tier: newUserTier }),
        });
        setAddDialogOpen(false);
        setNewUserId("");
        setNewUserRole("user");
        setNewUserTier("free");
        loadUsers();
      } else {
        throw new Error("Failed to add user");
      }
    } catch (error) {
      toast({
        title: tc("error"),
        description: t("addUserFailed"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role }),
      });
      const success = res.ok;
      
      if (success) {
        setUsers((prev) =>
          prev.map((u) => (u.user_id === userId ? { ...u, role } : u))
        );
        toast({
          title: t("roleUpdated"),
          description: t("roleUpdatedDesc", { role }),
        });
      } else {
        throw new Error("Failed to update role");
      }
    } catch (error) {
      toast({
        title: tc("error"),
        description: t("updateRoleFailed"),
        variant: "destructive",
      });
    }
  };

  const handleUpdateTier = async (userId: string, tier: UserTier) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, tier }),
      });
      const success = res.ok;
      
      if (success) {
        setUsers((prev) =>
          prev.map((u) => (u.user_id === userId ? { ...u, tier } : u))
        );
        toast({
          title: t("tierUpdated"),
          description: t("tierUpdatedDesc", { tier: TIER_CONFIG[tier].label }),
        });
      } else {
        throw new Error("Failed to update tier");
      }
    } catch (error) {
      toast({
        title: tc("error"),
        description: t("updateTierFailed"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/users?user_id=${encodeURIComponent(userToDelete.user_id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to remove user");

      setUsers((prev) => prev.filter((u) => u.user_id !== userToDelete.user_id));
      toast({
        title: "User Removed",
        description: "User has been removed from the system.",
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) => u.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleGate
      allowedRoles={["admin"]}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-muted-foreground max-w-md">
            You don&apos;t have permission to access this page. Please contact an
            administrator if you believe this is an error.
          </p>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Users className="w-5 h-5 text-white" />
              </div>
              User Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage user accounts and permissions
            </p>
          </div>

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Add a user to the system by their Clerk User ID.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">Clerk User ID</Label>
                  <Input
                    id="userId"
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    placeholder="user_2abc..."
                  />
                  <p className="text-xs text-muted-foreground">
                    You can find this in the Clerk Dashboard
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">{t("role")}</Label>
                  <Select
                    value={newUserRole}
                    onValueChange={(value) => setNewUserRole(value as UserRole)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{t("roles.user")}</SelectItem>
                      <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tier">{t("tier")}</Label>
                  <Select
                    value={newUserTier}
                    onValueChange={(value) => setNewUserTier(value as UserTier)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">{t("tiers.free")}</SelectItem>
                      <SelectItem value="plus">{t("tiers.plus")}</SelectItem>
                      <SelectItem value="pro">{t("tiers.pro")}</SelectItem>
                      <SelectItem value="premium">{t("tiers.premium")}</SelectItem>
                      <SelectItem value="business">{t("tiers.business")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  onClick={handleAddUser}
                  disabled={isSubmitting || !newUserId.trim()}
                >
                  {isSubmitting ? "Adding..." : "Add User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{users.length}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {users.filter((u) => u.role === "admin").length}
                </p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        {t("userId")}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        {t("role")}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        {t("tier")}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        {t("createdAt")}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((userRow, index) => (
                      <motion.tr
                        key={userRow.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-medium">
                              {userRow.user_id.slice(5, 7).toUpperCase()}
                            </div>
                            <p className="text-sm font-medium text-white font-mono">
                              {userRow.user_id}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <RoleBadge role={userRow.role} />
                        </td>
                        <td className="py-3 px-4">
                          <TierBadge tier={userRow.tier || "free"} />
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(userRow.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              
                              {/* Role Actions */}
                              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                {t("changeRole")}
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleUpdateRole(userRow.user_id, "user")}
                                disabled={userRow.user_id === user?.id || userRow.role === "user"}
                              >
                                <UserIcon className="w-4 h-4 mr-2" />
                                {t("roles.user")}
                                {userRow.role === "user" && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateRole(userRow.user_id, "admin")}
                                disabled={userRow.user_id === user?.id || userRow.role === "admin"}
                              >
                                <Crown className="w-4 h-4 mr-2" />
                                {t("roles.admin")}
                                {userRow.role === "admin" && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              {/* Tier Actions */}
                              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                {t("changeTier")}
                              </DropdownMenuLabel>
                              {(["free", "plus", "pro", "premium", "business"] as UserTier[]).map((tier) => (
                                <DropdownMenuItem
                                  key={tier}
                                  onClick={() => handleUpdateTier(userRow.user_id, tier)}
                                  disabled={(userRow.tier || "free") === tier}
                                >
                                  {TIER_CONFIG[tier].icon}
                                  <span className="ml-1">{t(`tiers.${tier}`)}</span>
                                  {(userRow.tier || "free") === tier && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                                </DropdownMenuItem>
                              ))}
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setUserToDelete(userRow);
                                  setDeleteDialogOpen(true);
                                }}
                                disabled={userRow.user_id === user?.id}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t("removeUser")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this user? Their role will be
              deleted from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RoleGate>
  );
}



