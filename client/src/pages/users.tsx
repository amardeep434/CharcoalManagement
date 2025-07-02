import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Shield, Eye, Users as UsersIcon, UserCheck } from "lucide-react";
import type { User } from "@shared/schema";
// import { NewUserModal } from "@/components/modals/new-user-modal";
// import { EditUserModal } from "@/components/modals/edit-user-modal";

export default function UsersPage() {
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", `/api/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deleted",
        description: "User has been successfully deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/users/${userId}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User status updated",
        description: "User status has been successfully updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4" />;
      case "manager":
        return <UserCheck className="w-4 h-4" />;
      case "operator":
        return <UsersIcon className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "manager":
        return "default";
      case "operator":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        </div>
        <div className="text-center">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage user accounts and access permissions</p>
        </div>
        <Button onClick={() => setShowNewUserModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid gap-6">
        {users && users.length > 0 ? (
          users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                      {(user.firstName?.[0] || user.username[0]).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.username}
                      </CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center space-x-1">
                      {getRoleIcon(user.role)}
                      <span className="capitalize">{user.role}</span>
                    </Badge>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p>Username: <span className="font-mono">{user.username}</span></p>
                    {user.lastLoginAt && (
                      <p>Last login: {new Date(user.lastLoginAt).toLocaleString()}</p>
                    )}
                    <p>Created: {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingUser(user)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant={user.isActive ? "secondary" : "default"}
                      size="sm"
                      onClick={() => toggleUserStatusMutation.mutate({ 
                        userId: user.id, 
                        isActive: !user.isActive 
                      })}
                      disabled={toggleUserStatusMutation.isPending}
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    {user.username !== "admin" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this user?")) {
                            deleteUserMutation.mutate(user.id);
                          }
                        }}
                        disabled={deleteUserMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <UsersIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first user</p>
              <Button onClick={() => setShowNewUserModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* <NewUserModal
        isOpen={showNewUserModal}
        onClose={() => setShowNewUserModal(false)}
      />

      {editingUser && (
        <EditUserModal
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
        />
      )} */}
    </div>
  );
}