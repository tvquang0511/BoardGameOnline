import { useEffect, useRef, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreVertical,
  UserPlus,
  Ban,
  Edit,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { adminApi } from "../../api/admin.api";

export default function UserManagement({ onLogout }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);

  // pagination / infinite scroll
  const [page, setPage] = useState(1);
  const limit = 20;
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [creating, setCreating] = useState(false);

  // edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editing, setEditing] = useState(false);

  const sentinelRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const loadPage = async (targetPage = 1, reset = false, q = searchQuery) => {
    if (targetPage === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const data = await adminApi.users({ q, page: targetPage, limit });
      const items = data.users || [];

      if (reset) {
        setUsers(items);
      } else {
        setUsers((prev) => {
          // avoid duplicates: check last item id
          if (!prev.length) return items;
          const ids = new Set(prev.map((p) => p.id));
          const newItems = items.filter((it) => !ids.has(it.id));
          return [...prev, ...newItems];
        });
      }

      setHasMore(items.length === limit);
      setPage(targetPage);
    } catch (err) {
      // TODO: show nicer error UI
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // initial load
    loadPage(1, true).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // observe sentinel to trigger loading more
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !loadingMore && !loading && hasMore) {
            loadPage(page + 1, false).catch(() => {});
          }
        });
      },
      { root: null, rootMargin: "200px", threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, loadingMore, loading, hasMore]);

  // search handler with small debounce and reset pagination
  const handleSearchChange = (v) => {
    setSearchQuery(v);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadPage(1, true, v).catch(() => {});
    }, 250);
  };

  const getStatusBadge = (u) => {
    const status = u.is_enabled ? "active" : "inactive";
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Hoạt động</Badge>;
      case "inactive":
        return <Badge variant="secondary">Không hoạt động</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleToggleEnabled = async (u) => {
    await adminApi.updateUser(u.id, { is_enabled: !u.is_enabled });
    // refresh current page results
    loadPage(1, true, searchQuery).catch(() => {});
  };

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword) {
      alert("Email và mật khẩu là bắt buộc");
      return;
    }
    setCreating(true);
    try {
      await adminApi.createUser({
        email: newEmail,
        password: newPassword,
        display_name: newDisplayName,
      });
      // reload first page
      await loadPage(1, true);
      setCreateOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewDisplayName("");
      alert("Tạo người dùng thành công");
    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "Lỗi khi tạo người dùng";
      alert(msg);
    } finally {
      setCreating(false);
    }
  };

  // Edit flow
  const openEdit = (u) => {
    setEditingUser(u);
    setEditEmail(u.email || "");
    setEditDisplayName((u.profile && u.profile.display_name) || "");
    setEditPassword("");
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    if (!editEmail) {
      alert("Email không được để trống");
      return;
    }
    setEditing(true);
    try {
      const payload = { email: editEmail, display_name: editDisplayName };
      if (editPassword && editPassword.length > 0)
        payload.password = editPassword;
      await adminApi.updateUser(editingUser.id, payload);
      await loadPage(1, true, searchQuery);
      setEditOpen(false);
      setEditingUser(null);
      setEditEmail("");
      setEditPassword("");
      setEditDisplayName("");
      alert("Cập nhật thành công");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Lỗi khi cập nhật người dùng";
      alert(msg);
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async (u) => {
    const ok = window.confirm(
      `Bạn có chắc chắn muốn xóa user ${
        u.email || u.id
      }? Hành động này không thể hoàn tác.`
    );
    if (!ok) return;
    try {
      await adminApi.deleteUser(u.id);
      await loadPage(1, true, searchQuery);
      alert("Xóa thành công");
    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "Lỗi khi xóa người dùng";
      alert(msg);
    }
  };

  return (
    <AdminLayout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Quản lý người dùng</h1>
            <p className="text-gray-600">
              Quản lý tất cả người dùng trong hệ thống
            </p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-red-600">
                <UserPlus className="w-4 h-4 mr-2" />
                Thêm người dùng
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm người dùng mới</DialogTitle>
                <DialogDescription>
                  Tạo người dùng mới bằng email, mật khẩu và tên hiển thị.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên người dùng (hiển thị)</Label>
                  <Input
                    id="name"
                    placeholder="Nhập tên..."
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleCreateUser}
                    disabled={creating}
                  >
                    {creating ? "Đang tạo..." : "Tạo tài khoản"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setCreateOpen(false)}
                    disabled={creating}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
                <DialogDescription>
                  Cập nhật email, mật khẩu (nếu muốn đổi) và tên hiển thị.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_name">Tên người dùng (hiển thị)</Label>
                  <Input
                    id="edit_name"
                    placeholder="Nhập tên..."
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    placeholder="email@example.com"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_password">
                    Mật khẩu mới (để trống nếu không đổi)
                  </Label>
                  <Input
                    id="edit_password"
                    type="password"
                    placeholder="••••••••"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleSaveEdit}
                    disabled={editing}
                  >
                    {editing ? "Đang lưu..." : "Lưu"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setEditOpen(false)}
                    disabled={editing}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Danh sách người dùng</CardTitle>
                <CardDescription>
                  Tổng số {users.length} người dùng (hiển thị{" "}
                  {Math.min(users.length, page * limit)})
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tham gia</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const name =
                    (u.profile &&
                      (u.profile.display_name || u.profile.username)) ||
                    `User #${u.id}`;
                  const level = 1; // TODO: nếu có field level từ profile hãy hiện
                  const avatarSeed = `user_${u.id}`;
                  const joinDate = u.created_at
                    ? new Date(u.created_at).toLocaleDateString("vi-VN")
                    : "";

                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                            />
                            <AvatarFallback>{name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Level {level}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(u)}</TableCell>
                      <TableCell>{joinDate}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(u)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleEnabled(u)}
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              {u.is_enabled ? "Khóa tài khoản" : "Mở khóa"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(u)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* sentinel for infinite scroll */}
            <div
              ref={sentinelRef}
              className="h-8 flex items-center justify-center mt-4"
            >
              {loadingMore && (
                <span className="text-sm text-gray-500">Đang tải thêm...</span>
              )}
              {!hasMore && !loading && (
                <span className="text-sm text-gray-500">Đã tải hết</span>
              )}
            </div>

            {/* initial/global loading */}
            {loading && users.length === 0 && (
              <div className="py-6 text-center text-gray-500">Đang tải...</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
