import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, MessageSquare, Swords, Check, X, Search } from 'lucide-react';
import { friendsApi } from '../../api/friends.api';
import { usersApi } from '../../api/users.api';

export default function Friends({ onLogout }) {
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');

  const reload = async () => {
    const [f, r, s] = await Promise.all([
      friendsApi.list(),
      friendsApi.requests(),
      friendsApi.suggestions({ limit: 10 }),
    ]);
    setFriends(f.friends || []);
    setIncoming(r.requests || []);
    setSuggestions(s.suggestions || []);
  };

  useEffect(() => {
    reload().catch(() => {
      // TODO(API): error state
    });
  }, []);

  const handleAccept = async (id) => {
    await friendsApi.accept(id);
    await reload();
  };

  const handleReject = async (id) => {
    await friendsApi.reject(id);
    await reload();
  };

  const handleRequest = async (userId) => {
    await friendsApi.request(userId);
    await reload();
  };

  const searchedUsers = useMemo(() => {
    return suggestions; // default suggestions list
  }, [suggestions]);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) {
      // back to suggestions
      const s = await friendsApi.suggestions({ limit: 10 });
      setSuggestions(s.suggestions || []);
      return;
    }
    // Search users globally
    const data = await usersApi.search({ q, limit: 10 });
    // TODO(API MISSING): backend không trả mutualFriends -> UI sẽ không có số bạn chung thật
    setSuggestions(
      (data.users || []).map((u) => ({
        user_id: u.id,
        username: u.username,
        display_name: u.display_name,
        level: u.level,
        avatar_url: u.avatar_url,
        mutualFriends: 0, // TODO(API MISSING)
      }))
    );
  };

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

  // Map friend relationship row -> display info
  // TODO(API MISSING): backend friends list currently returns relation rows only (ids/status),
  // not joined profile info. For now we show placeholders.
  const friendItems = friends.map((rel, idx) => ({
    id: rel.id,
    name: `Friend #${rel.id}`, // TODO(API MISSING): need join profiles in backend
    status: 'offline', // TODO(API MISSING): online presence
    level: 1, // TODO(API MISSING)
    avatar: `seed_friend_${idx}`,
  }));

  const requestItems = incoming.map((rel, idx) => ({
    id: rel.id,
    name: `User #${rel.requester_id}`, // TODO(API MISSING): need join profiles
    level: 1, // TODO(API MISSING)
    avatar: `seed_req_${idx}`,
  }));

  const suggestionItems = searchedUsers.map((u, idx) => ({
    user_id: u.user_id ?? u.id,
    name: u.display_name || u.username || `User #${u.user_id ?? u.id}`,
    level: u.level ?? 1,
    mutualFriends: u.mutualFriends ?? 0,
    avatar: u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=sug_${idx}`,
  }));

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Bạn bè</h1>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm bạn bè..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">Bạn bè ({friendItems.length})</TabsTrigger>
            <TabsTrigger value="requests">Lời mời ({requestItems.length})</TabsTrigger>
            <TabsTrigger value="suggestions">Gợi ý</TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Danh sách bạn bè</CardTitle>
                <CardDescription>Những người bạn của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {friendItems.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.avatar}`} />
                            <AvatarFallback>{friend.name[0]}</AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(friend.status)} rounded-full border-2 border-white`}
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
                  {requestItems.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAccept(request.id)}>
                          <Check className="w-4 h-4 mr-2" />
                          Chấp nhận
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleReject(request.id)}>
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
                  {suggestionItems.map((suggestion) => (
                    <div key={suggestion.user_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={suggestion.avatar} />
                          <AvatarFallback>{suggestion.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{suggestion.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Level {suggestion.level}</Badge>
                            <span className="text-sm text-gray-600">
                              {suggestion.mutualFriends} bạn chung {/* TODO(API MISSING) */}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleRequest(suggestion.user_id)}>
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