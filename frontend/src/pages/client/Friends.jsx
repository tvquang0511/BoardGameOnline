import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, MessageSquare, Swords, Check, X, Search } from 'lucide-react';

export default function Friends({ onLogout }) {
  const friends = [
    { name: 'CoolGamer99', status: 'online', level: 28, avatar: 'seed1' },
    { name: 'ProPlayer123', status: 'online', level: 32, avatar: 'seed2' },
    { name: 'NinjaWarrior', status: 'offline', level: 24, avatar: 'seed3' },
    { name: 'QueenBee', status: 'playing', level: 30, avatar: 'seed4' },
    { name: 'SpeedRunner', status: 'online', level: 26, avatar: 'seed5' },
  ];

  const pendingRequests = [
    { name: 'NewPlayer88', level: 12, avatar: 'seed6' },
    { name: 'GameMaster', level: 35, avatar: 'seed7' },
  ];

  const suggestions = [
    { name: 'StarPlayer', level: 29, mutualFriends: 3, avatar: 'seed8' },
    { name: 'ChampionX', level: 31, mutualFriends: 5, avatar: 'seed9' },
    { name: 'LegendKiller', level: 27, mutualFriends: 2, avatar: 'seed10' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'playing':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Bạn bè</h1>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Tìm kiếm bạn bè..." className="pl-10" />
            </div>
          </div>
        </div>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              Bạn bè ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Lời mời ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="suggestions">
              Gợi ý
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Danh sách bạn bè</CardTitle>
                <CardDescription>Những người bạn của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {friends.map((friend) => (
                    <div
                      key={friend.name}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.avatar}`} />
                            <AvatarFallback>{friend.name[0]}</AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(
                              friend.status
                            )} rounded-full border-2 border-white`}
                          />
                        </div>
                        <div>
                          <p className="font-semibold">{friend.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Level {friend.level}</Badge>
                            <span className="text-sm text-gray-600 capitalize">{friend.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Nhắn tin
                        </Button>
                        <Button size="sm">
                          <Swords className="w-4 h-4 mr-2" />
                          Thách đấu
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Lời mời kết bạn</CardTitle>
                <CardDescription>Những người muốn kết bạn với bạn</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.name}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${request.avatar}`} />
                          <AvatarFallback>{request.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{request.name}</p>
                          <Badge variant="secondary">Level {request.level}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <Check className="w-4 h-4 mr-2" />
                          Chấp nhận
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                          <X className="w-4 h-4 mr-2" />
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suggestions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gợi ý kết bạn</CardTitle>
                <CardDescription>Những người bạn có thể quen biết</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.name}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${suggestion.avatar}`} />
                          <AvatarFallback>{suggestion.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{suggestion.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Level {suggestion.level}</Badge>
                            <span className="text-sm text-gray-600">
                              {suggestion.mutualFriends} bạn chung
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Kết bạn
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}