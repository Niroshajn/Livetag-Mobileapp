
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import Text from "../components/AppText";
import api from "../lib/api";
import { Trash2, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react-native";

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  roles: { id: string; name: string }[];
}

interface UsersResponse {
  data: User[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

interface Role {
  id: string;
  name: string;
}

export default function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<UsersResponse["meta"] | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async (currentPage: number) => {
    try {
      setLoading(true);

      const res = await api.get<UsersResponse>(
        `/tenant/users?page=${currentPage}`
      );

      setUsers(res.data.data || []);
      setMeta(res.data.meta);
    } catch (error) {
      Alert.alert("Error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page);
  }, [page, fetchUsers]);

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get("/tenant/roles");
        setRoles(res.data || []);
      } catch {
        Alert.alert("Error", "Failed to load roles");
      }
    };

    fetchRoles();
  }, []);

  // Delete user
  const handleDelete = async () => {
    if (!userToDelete || deleting) return;

    try {
      setDeleting(true);

      await api.delete(`/platform/users/${userToDelete.id}`);

      Alert.alert("Success", "User deleted");

      setShowDeleteModal(false);
      setUserToDelete(null);

      // If the last user on this page is deleted,
      // move to the previous page.
      if (users.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchUsers(page);
      }
    } catch {
      Alert.alert("Error", "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  // Change role
  const handleRoleChange = async (roleId: string) => {
    if (!selectedUser || updatingRole) return;

    try {
      setUpdatingRole(true);

      await api.put(`/tenant/users/${selectedUser.id}/roles`, {
        roleIds: [roleId],
      });

      Alert.alert("Success", "Role updated");

      setShowRoleModal(false);
      setSelectedUser(null);

      fetchUsers(page);
    } catch {
      Alert.alert("Error", "Role update failed");
    } finally {
      setUpdatingRole(false);
    }
  };

  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  // User card
  const renderUser = ({ item }: { item: User }) => {
    return (
      <View className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-3">

        <View className="flex-row justify-between items-start">
          <View className="flex-1 mr-3">
            <Text className="text-base font-semibold text-gray-900 dark:text-white">
              {item.name}
            </Text>

            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {item.email}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => openDeleteModal(item)}
            className="p-2 rounded-lg bg-red-50 dark:bg-red-950"
          >
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View className="border-t border-gray-200 dark:border-gray-700 my-3" />

        <Text className="text-xs text-gray-500 dark:text-gray-400">
          Created
        </Text>

        <Text className="text-sm text-gray-800 dark:text-gray-200 mt-1">
          {item.createdAt
            ? new Date(item.createdAt).toLocaleDateString()
            : "-"}
        </Text>

        <View className="mt-3">
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Current Role
          </Text>

          <Text className="text-sm font-medium text-gray-900 dark:text-white mt-1">
            {item.roles?.map((role) => role.name).join(", ") || "No Role"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => openRoleModal(item)}
          className="flex-row items-center justify-between border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-3 mt-3"
        >
          <Text className="text-sm text-gray-800 dark:text-white">
            Change Role
          </Text>

          <ChevronDown size={18} color="#888" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black px-4 pt-4">

      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-5">
        User Management
      </Text>

      {/* User list */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-gray-500 mt-3">Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-10">
              <Text className="text-gray-500 dark:text-gray-400">
                No Users Found
              </Text>
            </View>
          }
          ListFooterComponent={
            <View className="flex-row items-center justify-between py-4">
              <TouchableOpacity
                disabled={!meta?.hasPrevious || loading}
                onPress={() => setPage((p) => Math.max(p - 1, 1))}
                className={`flex-row items-center border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 ${
                  !meta?.hasPrevious ? "opacity-40" : ""
                }`}
              >
                <ChevronLeft size={17} color="#888" />
                <Text className="text-gray-800 dark:text-white ml-1">
                  Previous
                </Text>
              </TouchableOpacity>

              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Page {meta?.page || 1} of {meta?.totalPages || 1}
              </Text>

              <TouchableOpacity
                disabled={!meta?.hasNext || loading}
                onPress={() => setPage((p) => p + 1)}
                className={`flex-row items-center border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 ${
                  !meta?.hasNext ? "opacity-40" : ""
                }`}
              >
                <Text className="text-gray-800 dark:text-white mr-1">
                  Next
                </Text>
                <ChevronRight size={17} color="#888" />
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Delete confirmation modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-5">
          <View className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 w-full">

            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Delete User
              </Text>

              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                <X size={22} color="#888" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-gray-600 dark:text-gray-300 mb-5">
              Are you sure you want to delete{" "}
              {userToDelete?.name}? This action cannot be undone.
            </Text>

            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700"
              >
                <Text className="text-gray-800 dark:text-white">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDelete}
                disabled={deleting}
                className="px-4 py-3 rounded-lg bg-red-600"
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change role modal */}
      <Modal
        visible={showRoleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-[#1a1a1a] rounded-t-2xl p-5 max-h-[70%]">

            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Change Role
              </Text>

              <TouchableOpacity
                onPress={() => setShowRoleModal(false)}
                disabled={updatingRole}
              >
                <X size={22} color="#888" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Select a role for {selectedUser?.name}
            </Text>

            <ScrollView>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.id}
                  disabled={updatingRole}
                  onPress={() => handleRoleChange(role.id)}
                  className="flex-row items-center justify-between border-b border-gray-200 dark:border-gray-700 py-4"
                >
                  <Text className="text-gray-900 dark:text-white">
                    {role.name}
                  </Text>

                  {selectedUser?.roles?.some((r) => r.id === role.id) && (
                    <Text className="text-indigo-500 font-semibold">
                      Current
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {updatingRole && (
              <ActivityIndicator className="mt-3" color="#6366f1" />
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}
