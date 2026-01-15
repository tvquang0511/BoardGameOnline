import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, MessageSquare, Check, X, Search, UserX, Clock, Users } from 'lucide-react';
import { friendsApi } from '../../api/friends.api';

export default function Friends({ onLogout }) {
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');

  const reload = async () => {
    setLoading(true);
    try {
      const [f, r, o, s] = await Promise.all([
        friendsApi.list(),
        friendsApi.requests(),
        friendsApi.outgoing(),
        friendsApi.suggestions({ limit: 15 }),
      ]);
      setFriends(f.friends || []);
      setIncoming(r.requests || []);
      setOutgoing(o.requests || []);
      setSuggestions(s.suggestions || []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách bạn bè:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const handleAccept = async (id) => {
    try {
      await friendsApi.accept(id);
      await reload();
    } catch (error) {
      console.error('Lỗi khi chấp nhận:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await friendsApi.reject(id);
      await reload();
    } catch (error) {
      console.error('Lỗi khi từ chối:', error);
    }
  };

  const handleCancel = async (id) => {
    try {
      await friendsApi.cancel(id);
      await reload();
    } catch (error) {
      console.error('Lỗi khi hủy:', error);
    }
  };

  const handleUnfriend = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy kết bạn?')) return;
    
    try {
      await friendsApi.unfriend(id);
      await reload();
    } catch (error) {
      console.error('Lỗi khi hủy kết bạn:', error);
    }
  };

  const handleRequest = async (userId) => {
    try {
      await friendsApi.request(userId);
      await reload();
      // Chuyển sang tab "Đã gửi" để xem request
      setActiveTab('outgoing');
    } catch (error) {
      console.error('Lỗi khi gửi lời mời:', error);
      alert(error.response?.data?.message || 'Không thể gửi lời mời');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      // Load lại suggestions mặc định
      const s = await friendsApi.suggestions({ limit: 15 });
      setSuggestions(s.suggestions || []);
      setActiveTab('suggestions');
      return;
    }

    try {
      // Tìm kiếm trong suggestions
      const s = await friendsApi.suggestions({ q: searchQuery, limit: 15 });
      setSuggestions(s.suggestions || []);
      setActiveTab('suggestions');
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
    }
  };

  // Lọc bạn bè theo search (client-side)
  const filteredFriends = useMemo(() => {
    if (!searchQuery) return friends;
    const query = searchQuery.toLowerCase();
    return friends.filter(friend => 
      friend.username?.toLowerCase().includes(query) ||
      friend.display_name?.toLowerCase().includes(query) ||
      friend.email?.toLowerCase().includes(query)
    );
  }, [friends, searchQuery]);

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

  const getAvatarUrl = (user) => {
    if (user.avatar_url) return user.avatar_url;
    const seed = user.username || user.email || 'user';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Bạn bè</h1>
            <p className="text-gray-600 mt-1">Quản lý danh sách bạn bè và lời mời</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên, email..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit">Tìm kiếm</Button>
            </form>
          </div>
          <Button variant="outline" onClick={reload} disabled={loading}>
            {loading ? 'Đang tải...' : 'Tải lại'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Bạn bè ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="incoming" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Lời mời ({incoming.length})
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Đã gửi ({outgoing.length})
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Gợi ý ({suggestions.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab Bạn bè */}
          <TabsContent value="friends" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Danh sách bạn bè</CardTitle>
                <CardDescription>
                  {searchQuery 
                    ? `Tìm thấy ${filteredFriends.length} bạn bè cho "${searchQuery}"`
                    : `Bạn có ${friends.length} người bạn`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredFriends.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    {searchQuery 
                      ? 'Không tìm thấy bạn bè nào phù hợp'
                      : 'Bạn chưa có bạn bè nào. Hãy tìm và kết bạn!'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredFriends.map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={getAvatarUrl(friend)} />
                              <AvatarFallback>{friend.username?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor('offline')} rounded-full border-2 border-white`} />
                          </div>
                          <div>
                            <p className="font-semibold">{friend.display_name || friend.username}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">Level {friend.level}</Badge>
                              <span className="text-xs text-gray-500">@{friend.username}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => window.location.href = `/messages?to=${friend.id}`}>
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Nhắn tin
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleUnfriend(friend.id)}>
                            <UserX className="w-4 h-4 mr-1" />
                            Hủy kết bạn
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Lời mời đến */}
          <TabsContent value="incoming" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Lời mời kết bạn</CardTitle>
                <CardDescription>Những người muốn kết bạn với bạn</CardDescription>
              </CardHeader>
              <CardContent>
                {incoming.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    Không có lời mời kết bạn nào
                  </div>
                ) : (
                  <div className="space-y-4">
                    {incoming.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={getAvatarUrl(request)} />
                            <AvatarFallback>{request.username?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{request.display_name || request.username}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">Level {request.level}</Badge>
                              <span className="text-xs text-gray-500">
                                Gửi ngày {formatDate(request.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAccept(request.id)}>
                            <Check className="w-4 h-4 mr-1" />
                            Chấp nhận
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleReject(request.id)}>
                            <X className="w-4 h-4 mr-1" />
                            Từ chối
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Đã gửi */}
          <TabsContent value="outgoing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Lời mời đã gửi</CardTitle>
                <CardDescription>Những lời mời kết bạn bạn đã gửi</CardDescription>
              </CardHeader>
              <CardContent>
                {outgoing.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    Bạn chưa gửi lời mời kết bạn nào
                  </div>
                ) : (
                  <div className="space-y-4">
                    {outgoing.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={getAvatarUrl(request)} />
                            <AvatarFallback>{request.username?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{request.display_name || request.username}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">Level {request.level}</Badge>
                              <span className="text-xs text-gray-500">
                                Gửi ngày {formatDate(request.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleCancel(request.id)}>
                          Hủy lời mời
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Gợi ý */}
          <TabsContent value="suggestions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gợi ý kết bạn</CardTitle>
                <CardDescription>
                  {searchQuery 
                    ? `Gợi ý cho "${searchQuery}"`
                    : 'Những người bạn có thể muốn kết bạn'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {suggestions.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    {searchQuery 
                      ? 'Không tìm thấy người dùng nào'
                      : 'Không có gợi ý nào vào lúc này'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestions.map((user) => (
                      <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={getAvatarUrl(user)} />
                            <AvatarFallback>{user.username?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{user.display_name || user.username}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">Level {user.level}</Badge>
                              <span className="text-xs text-gray-500">@{user.username}</span>
                            </div>
                            {user.mutual_friends > 0 && (
                              <p className="text-xs text-blue-600 mt-1">{user.mutual_friends} bạn chung</p>
                            )}
                          </div>
                        </div>
                        <Button size="sm" onClick={() => handleRequest(user.user_id)}>
                          <UserPlus className="w-4 h-4 mr-1" />
                          Kết bạn
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}