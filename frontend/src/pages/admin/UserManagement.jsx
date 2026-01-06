import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreVertical, UserPlus, Ban, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function UserManagement({ onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');

  const users = [
    {
      id: 1,
      name: 'GamePro',
      email: 'gamepro@email.com',
      level: 25,
      status: 'active',
      joinDate: '2024-01-15',
      avatar: 'user1',
    },
    {
      id: 2,
      name: 'CoolGamer99',
      email: 'coolgamer@email.com',
      level: 28,
      status: 'active',
      joinDate: '2023-12-20',
      avatar: 'user2',
    },
    {
      id: 3,
      name: 'ProPlayer123',
      email: 'proplayer@email.com',
      level: 32,
      status: 'banned',
      joinDate: '2023-11-05',
      avatar: 'user3',
    },
    {
      id: 4,
      name: 'NinjaWarrior',
      email: 'ninja@email.com',
      level: 24,
      status: 'active',
      joinDate: '2024-02-10',
      avatar: 'user4',
    },
    {
      id: 5,
      name: 'QueenBee',
      email: 'queen@email.com',
      level: 30,
      status: 'inactive',
      joinDate: '2023-10-15',
      avatar: 'user5',
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Hoạt động</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Không hoạt động</Badge>;
      case 'banned':
        return <Badge variant="destructive">Bị khóa</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Quản lý người dùng</h1>
            <p className="text-gray-600">Quản lý tất cả người dùng trong hệ thống</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-red-600">
                <UserPlus className="w-4 h-4 mr-2" />
                Thêm người dùng
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm người dùng mới</DialogTitle>
                <DialogDescription>Tạo tài khoản người dùng mới</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên người dùng</Label>
                  <Input id="name" placeholder="Nhập tên..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Input id="password" type="password" placeholder="••••••••" />
                </div>
                <Button className="w-full">Tạo tài khoản</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Danh sách người dùng</CardTitle>
                <CardDescription>Tổng số {users.length} người dùng</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}`} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Level {user.level}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{new Date(user.joinDate).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Ban className="w-4 h-4 mr-2" />
                            Khóa tài khoản
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}