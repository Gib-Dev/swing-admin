"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Shield, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { CreateUserForm } from "./create-user-form";
import { EditUserForm } from "./edit-user-form";
import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/auth";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "super_admin";
  createdAt: Date;
}

interface UserListProps {
  users: User[];
  currentUserId: string;
  onCreate: (data: CreateUserInput) => Promise<{ success: boolean; error?: string }>;
  onUpdate: (id: string, data: UpdateUserInput) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function UserList({
  users,
  currentUserId,
  onCreate,
  onUpdate,
  onDelete,
}: UserListProps) {
  const t = useTranslations("users");
  const tc = useTranslations("common");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deletingUserId) return;
    setIsDeleting(true);

    try {
      const result = await onDelete(deletingUserId);

      if (result.success) {
        toast.success(t("userDeleted"));
      } else {
        toast.error(result.error ?? tc("error"));
      }
    } catch {
      toast.error(tc("error"));
    } finally {
      setIsDeleting(false);
      setDeletingUserId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
          {!showCreateForm && !editingUser && (
            <Button size="sm" onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("createUser")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreateForm && (
          <div className="rounded-lg border p-4">
            <CreateUserForm
              onSubmit={onCreate}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}

        {editingUser && (
          <div className="rounded-lg border p-4">
            <h4 className="mb-3 font-medium">{t("editUser")}</h4>
            <EditUserForm
              user={editingUser}
              onSubmit={onUpdate}
              onCancel={() => setEditingUser(null)}
            />
          </div>
        )}

        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  {user.role === "super_admin" ? (
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  ) : (
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.name}</p>
                    {user.id === currentUserId && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {t("you")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.role === "super_admin" ? t("roleSuperAdmin") : t("roleAdmin")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingUser(user);
                    setShowCreateForm(false);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {user.id !== currentUserId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingUserId(user.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <AlertDialog
        open={!!deletingUserId}
        onOpenChange={(open) => !open && setDeletingUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {tc("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
