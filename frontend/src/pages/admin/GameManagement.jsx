import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings } from 'lucide-react';

export default function GameManagement({ onLogout }) {
  const [games, setGames] = useState([
    {
      id: 1,
      name: 'Cờ Caro 5',
      emoji: '⭕',
      status: 'active',
      players: 4500,
      avgTime: '12 phút',
      difficulty: 'medium',
    },
    {
      id: 2,
      name: 'Cờ Caro 4',
      emoji: '🔵',
      status: 'active',
      players: 3200,
      avgTime: '8 phút',
      difficulty: 'easy',
    },
    {
      id: 3,
      name: 'Tic-Tac-Toe',
      emoji: '❌',
      status: 'active',
      players: 3800,
      avgTime: '5 phút',
      difficulty: 'easy',
    },
    {
      id: 4,
      name: 'Rắn săn mồi',
      emoji: '🐍',
      status: 'maintenance',
      players: 3200,
      avgTime: '15 phút',
      difficulty: 'hard',
    },
    {
      id: 5,
      name: 'Ghép hàng 3',
      emoji: '💎',
      status: 'active',
      players: 2900,
      avgTime: '10 phút',
      difficulty: 'medium',
    },
    {
      id: 6,
      name: 'Candy Rush',
      emoji: '🍬',
      status: 'inactive',
      players: 2400,
      avgTime: '12 phút',
      difficulty: 'medium',
    },
  ]);

  const toggleGameStatus = (gameId) => {
    setGames(
      games.map((game) =>
        game.id === gameId
          ? {
              ...game,
              status: game.status === 'active' ? 'inactive' : 'active',
            }
          : game
      )
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Hoạt động</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Không hoạt động</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-500">Bảo trì</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return <Badge variant="outline" className="border-green-500 text-green-700">Dễ</Badge>;
      case 'medium':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Trung bình</Badge>;
      case 'hard':
        return <Badge variant="outline" className="border-red-500 text-red-700">Khó</Badge>;
      default:
        return <Badge variant="outline">{difficulty}</Badge>;
    }
  };

  return (
    <AdminLayout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Quản lý Game</h1>
            <p className="text-gray-600">Cấu hình và quản lý các trò chơi</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-red-600">
                <Plus className="w-4 h-4 mr-2" />
                Thêm game mới
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm game mới</DialogTitle>
                <DialogDescription>Tạo trò chơi mới trong hệ thống</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="gameName">Tên game</Label>
                  <Input id="gameName" placeholder="Nhập tên game..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gameEmoji">Emoji/Icon</Label>
                  <Input id="gameEmoji" placeholder="🎮" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Độ khó</Label>
                  <Input id="difficulty" placeholder="easy, medium, hard" />
                </div>
                <Button className="w-full">Tạo game</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Danh sách game</TabsTrigger>
            <TabsTrigger value="settings">Cài đặt chung</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <Card key={game.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{game.emoji}</div>
                        <div>
                          <h3 className="text-lg font-semibold">{game.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(game.status)}
                            {getDifficultyBadge(game.difficulty)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Người chơi</p>
                        <p className="font-semibold">{game.players.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">TB thời gian</p>
                        <p className="font-semibold">{game.avgTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={game.status === 'active'}
                          onCheckedChange={() => toggleGameStatus(game.id)}
                        />
                        <Label className="text-sm">
                          {game.status === 'active' ? 'Kích hoạt' : 'Vô hiệu hóa'}
                        </Label>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Settings className="w-4 h-4 mr-2" />
                            Cấu hình
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Cấu hình {game.name}</DialogTitle>
                            <DialogDescription>Điều chỉnh các thông số game</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Kích thước bàn chơi</Label>
                              <Input placeholder="15x15" />
                            </div>
                            <div className="space-y-2">
                              <Label>Thời gian tối đa (phút)</Label>
                              <Input type="number" placeholder="30" />
                            </div>
                            <div className="space-y-2">
                              <Label>Điểm thưởng khi thắng</Label>
                              <Input type="number" placeholder="100" />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Cho phép lưu game</Label>
                              <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Hiển thị gợi ý</Label>
                              <Switch defaultChecked />
                            </div>
                            <Button className="w-full">Lưu cấu hình</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt hệ thống game</CardTitle>
                <CardDescription>Cấu hình chung cho tất cả game</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Cho phép chế độ nhiều người chơi</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Người dùng có thể thách đấu với nhau
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Bật AI đối thủ</Label>
                    <p className="text-sm text-gray-500 mt-1">Cho phép chơi với máy</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Hiển thị bảng xếp hạng</Label>
                    <p className="text-sm text-gray-500 mt-1">Cho phép xem ranking</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label>Thời gian giữa các lượt (giây)</Label>
                  <Input type="number" defaultValue={30} />
                </div>
                <div className="space-y-2">
                  <Label>Điểm tối thiểu để lên level</Label>
                  <Input type="number" defaultValue={1000} />
                </div>
                <Button className="w-full">Lưu cài đặt</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}