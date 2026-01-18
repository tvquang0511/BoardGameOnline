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

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const PAGE_SIZE = 5;

function PaginationBar({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  // Simple window pages: show up to 5 links
  const windowSize = 5;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(page - half, 1);
  let end = Math.min(start + windowSize - 1, totalPages);
  start = Math.max(end - windowSize + 1, 1);

  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div className="flex justify-center pt-4">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={(e) => {
                e.preventDefault();
                onPageChange(Math.max(page - 1, 1));
              }}
            />
          </PaginationItem>

          {pages.map((p) => (
            <PaginationItem key={p}>
              <PaginationLink
                isActive={p === page}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(p);
                }}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={(e) => {
                e.preventDefault();
                onPageChange(Math.min(page + 1, totalPages));
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export default function Friends({ onLogout }) {
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [friendsMeta, setFriendsMeta] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [incomingMeta, setIncomingMeta] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [outgoingMeta, setOutgoingMeta] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [suggestionsMeta, setSuggestionsMeta] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestionsQuery, setSuggestionsQuery] = useState(''); // query used for suggestions API

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');

  const getAvatarUrl = (user) => {
    if (user.avatar_url) return user.avatar_url;
    const seed = user.username || user.email || 'user';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const reloadTab = async (tab, { page } = {}) => {
    const p =
      page ??
      (tab === 'friends'
        ? friendsMeta.page
        : tab === 'incoming'
          ? incomingMeta.page
          : tab === 'outgoing'
            ? outgoingMeta.page
            : suggestionsMeta.page);

    if (tab === 'friends') {
      const data = await friendsApi.list({ page: p, limit: PAGE_SIZE });
      setFriends(data.friends || []);
      setFriendsMeta(data.meta || { page: p, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      return;
    }
    if (tab === 'incoming') {
      const data = await friendsApi.requests({ page: p, limit: PAGE_SIZE });
      setIncoming(data.requests || []);
      setIncomingMeta(data.meta || { page: p, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      return;
    }
    if (tab === 'outgoing') {
      const data = await friendsApi.outgoing({ page: p, limit: PAGE_SIZE });
      setOutgoing(data.requests || []);
      setOutgoingMeta(data.meta || { page: p, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      return;
    }
    if (tab === 'suggestions') {
      const data = await friendsApi.suggestions({ q: suggestionsQuery || undefined, page: p, limit: PAGE_SIZE });
      setSuggestions(data.suggestions || []);
      setSuggestionsMeta(data.meta || { page: p, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      return;
    }
  };

  const reloadAll = async () => {
    setLoading(true);
    try {
      const [f, r, o, s] = await Promise.all([
        friendsApi.list({ page: 1, limit: PAGE_SIZE }),
        friendsApi.requests({ page: 1, limit: PAGE_SIZE }),
        friendsApi.outgoing({ page: 1, limit: PAGE_SIZE }),
        friendsApi.suggestions({ q: suggestionsQuery || undefined, page: 1, limit: PAGE_SIZE }),
      ]);

      setFriends(f.friends || []);
      setIncoming(r.requests || []);
      setOutgoing(o.requests || []);
      setSuggestions(s.suggestions || []);

      setFriendsMeta(f.meta || { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      setIncomingMeta(r.meta || { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      setOutgoingMeta(o.meta || { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      setSuggestionsMeta(s.meta || { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
    } catch (error) {
      console.error('Lỗi khi tải danh sách bạn bè:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAccept = async (friendshipId) => {
    try {
      await friendsApi.accept(friendshipId);
      await reloadAll();
    } catch (error) {
      console.error('Lỗi khi chấp nhận:', error);
    }
  };

  const handleReject = async (friendshipId) => {
    try {
      await friendsApi.reject(friendshipId);
      await reloadAll();
    } catch (error) {
      console.error('Lỗi khi từ chối:', error);
    }
  };

  const handleCancel = async (friendshipId) => {
    try {
      await friendsApi.cancel(friendshipId);
      await reloadAll();
    } catch (error) {
      console.error('Lỗi khi hủy:', error);
    }
  };

  const handleUnfriend = async (friendshipId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy kết bạn?')) return;
    try {
      await friendsApi.unfriend(friendshipId);
      await reloadAll();
    } catch (error) {
      console.error('Lỗi khi hủy kết bạn:', error);
    }
  };

  const handleRequest = async (userId) => {
    try {
      await friendsApi.request(userId);
      // sau khi request thành công: reload outgoing page 1 và suggestions page 1
      setActiveTab('outgoing');
      await Promise.all([
        reloadTab('outgoing', { page: 1 }),
        reloadTab('suggestions', { page: 1 }),
      ]);
    } catch (error) {
      console.error('Lỗi khi gửi lời mời:', error);
      alert(error.response?.data?.message || 'Không thể gửi lời mời');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    // Search chỉ áp dụng cho suggestions API
    const q = searchQuery.trim();
    setSuggestionsQuery(q);
    setActiveTab('suggestions');

    try {
      const s = await friendsApi.suggestions({ q: q || undefined, page: 1, limit: PAGE_SIZE });
      setSuggestions(s.suggestions || []);
      setSuggestionsMeta(s.meta || { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
    }
  };

  // Nếu bạn vẫn muốn filter client-side cho tab friends: có thể bỏ, vì giờ phân trang server-side rồi.
  const filteredFriends = useMemo(() => friends, [friends]);

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
                  placeholder="Tìm kiếm người dùng để kết bạn..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit">Tìm kiếm</Button>
            </form>
          </div>
          <Button variant="outline" onClick={reloadAll} disabled={loading}>
            {loading ? 'Đang tải...' : 'Tải lại'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Bạn bè ({friendsMeta.total || friends.length})
            </TabsTrigger>
            <TabsTrigger value="incoming" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Lời mời ({incomingMeta.total || incoming.length})
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Đã gửi ({outgoingMeta.total || outgoing.length})
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Gợi ý ({suggestionsMeta.total || suggestions.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab Bạn bè */}
          <TabsContent value="friends" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Danh sách bạn bè</CardTitle>
                <CardDescription>
                  Trang {friendsMeta.page}/{friendsMeta.totalPages} • Tổng {friendsMeta.total} bạn bè
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredFriends.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">Bạn chưa có bạn bè nào.</div>
                ) : (
                  <div className="space-y-4">
                    {filteredFriends.map((friend) => (
                      <div
                        key={friend.friendship_id ?? friend.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={getAvatarUrl(friend)} />
                            <AvatarFallback>{friend.username?.[0] || 'U'}</AvatarFallback>
                          </Avatar>

                          <div>
                            <p className="font-semibold">{friend.display_name || friend.username}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">Level {friend.level}</Badge>
                              <span className="text-xs text-gray-500">@{friend.username}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => (window.location.href = `/messages?to=${friend.user_id ?? friend.id}`)}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Nhắn tin
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUnfriend(friend.friendship_id)}
                            disabled={!friend.friendship_id}
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Hủy kết bạn
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <PaginationBar
                  page={friendsMeta.page}
                  totalPages={friendsMeta.totalPages}
                  onPageChange={async (p) => {
                    setFriendsMeta((m) => ({ ...m, page: p }));
                    await reloadTab('friends', { page: p });
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Lời mời đến */}
          <TabsContent value="incoming" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Lời mời kết bạn</CardTitle>
                <CardDescription>
                  Trang {incomingMeta.page}/{incomingMeta.totalPages} • Tổng {incomingMeta.total} lời mời
                </CardDescription>
              </CardHeader>
              <CardContent>
                {incoming.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">Không có lời mời kết bạn nào</div>
                ) : (
                  <div className="space-y-4">
                    {incoming.map((request) => (
                      <div
                        key={request.friendship_id ?? request.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={getAvatarUrl(request)} />
                            <AvatarFallback>{request.username?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{request.display_name || request.username}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">Level {request.level}</Badge>
                              <span className="text-xs text-gray-500">Gửi ngày {formatDate(request.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleAccept(request.friendship_id)}
                            disabled={!request.friendship_id}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Chấp nhận
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleReject(request.friendship_id)}
                            disabled={!request.friendship_id}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Từ chối
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <PaginationBar
                  page={incomingMeta.page}
                  totalPages={incomingMeta.totalPages}
                  onPageChange={async (p) => {
                    setIncomingMeta((m) => ({ ...m, page: p }));
                    await reloadTab('incoming', { page: p });
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Đã gửi */}
          <TabsContent value="outgoing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Lời mời đã gửi</CardTitle>
                <CardDescription>
                  Trang {outgoingMeta.page}/{outgoingMeta.totalPages} • Tổng {outgoingMeta.total} lời mời
                </CardDescription>
              </CardHeader>
              <CardContent>
                {outgoing.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">Bạn chưa gửi lời mời kết bạn nào</div>
                ) : (
                  <div className="space-y-4">
                    {outgoing.map((request) => (
                      <div
                        key={request.friendship_id ?? request.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={getAvatarUrl(request)} />
                            <AvatarFallback>{request.username?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{request.display_name || request.username}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">Level {request.level}</Badge>
                              <span className="text-xs text-gray-500">Gửi ngày {formatDate(request.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(request.friendship_id)}
                          disabled={!request.friendship_id}
                        >
                          Hủy lời mời
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <PaginationBar
                  page={outgoingMeta.page}
                  totalPages={outgoingMeta.totalPages}
                  onPageChange={async (p) => {
                    setOutgoingMeta((m) => ({ ...m, page: p }));
                    await reloadTab('outgoing', { page: p });
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Gợi ý */}
          <TabsContent value="suggestions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gợi ý kết bạn</CardTitle>
                <CardDescription>
                  Trang {suggestionsMeta.page}/{suggestionsMeta.totalPages} • Tổng {suggestionsMeta.total} kết quả
                  {suggestionsQuery ? ` • Từ khóa "${suggestionsQuery}"` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {suggestions.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    {suggestionsQuery ? 'Không tìm thấy người dùng nào' : 'Không có gợi ý nào vào lúc này'}
                  </div>
                ) : (
                  <div className="space-y-4">
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

                <PaginationBar
                  page={suggestionsMeta.page}
                  totalPages={suggestionsMeta.totalPages}
                  onPageChange={async (p) => {
                    setSuggestionsMeta((m) => ({ ...m, page: p }));
                    await reloadTab('suggestions', { page: p });
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}