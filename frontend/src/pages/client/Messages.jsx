import { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { messagesApi } from '../../api/messages.api';

export default function Messages({ onLogout }) {
  const [contacts, setContacts] = useState([]); // friends list (left)
  const [selectedFriendId, setSelectedFriendId] = useState(null); // friend user_id
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const pollRef = useRef(null);

  const reloadContacts = async () => {
    setLoadingContacts(true);
    try {
      const data = await messagesApi.contacts({ q: search, limit: 100 });
      const list = data.contacts || [];
      setContacts(list);

      // auto-select first if none selected or selected not in list anymore
      if (!selectedFriendId && list.length) {
        setSelectedFriendId(list[0].friend_id);
      } else if (selectedFriendId && list.length) {
        const ok = list.some((c) => c.friend_id === selectedFriendId);
        if (!ok) setSelectedFriendId(list[0].friend_id);
      }
    } catch (e) {
      // TODO: error UI
    } finally {
      setLoadingContacts(false);
    }
  };

  const reloadMessages = async (friendId) => {
    if (!friendId) return;
    setLoadingMessages(true);
    try {
      const data = await messagesApi.list({ withUser: friendId, page: 1, limit: 50 });
      setMessages(data.messages || []);
    } catch (e) {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // initial load
  useEffect(() => {
    reloadContacts().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reload contacts on search (debounce nhẹ)
  useEffect(() => {
    const t = setTimeout(() => {
      reloadContacts().catch(() => {});
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // when select friend -> load chat
  useEffect(() => {
    reloadMessages(selectedFriendId).catch(() => {});
  }, [selectedFriendId]);

  // polling (không realtime)
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(() => {
      reloadContacts().catch(() => {});
      if (selectedFriendId) reloadMessages(selectedFriendId).catch(() => {});
    }, 6000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFriendId, search]);

  const selectedContact = useMemo(() => {
    return contacts.find((c) => c.friend_id === selectedFriendId) || null;
  }, [contacts, selectedFriendId]);

  const handleSend = async () => {
    if (!message.trim() || !selectedFriendId) return;

    try {
      await messagesApi.send({ receiverId: selectedFriendId, content: message.trim() });
      setMessage('');
      await reloadMessages(selectedFriendId);
      await reloadContacts();
    } catch (e) {
      alert(e?.response?.data?.message || 'Không thể gửi tin nhắn');
    }
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-4xl font-bold">Tin nhắn</h1>
          <Button variant="outline" onClick={reloadContacts} disabled={loadingContacts}>
            {loadingContacts ? 'Đang tải...' : 'Tải lại'}
          </Button>
        </div>

        <Card className="h-[calc(100vh-200px)]">
          <CardContent className="p-0 h-full flex">
            {/* LEFT: friends list */}
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b">
                <Input
                  placeholder="Tìm bạn bè..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-y-auto">
                {contacts.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">
                    {search.trim() ? 'Không tìm thấy bạn bè' : 'Bạn chưa có bạn bè để nhắn tin'}
                  </div>
                ) : (
                  contacts.map((c) => {
                    const f = c.friend;
                    const name = f?.display_name || f?.username || f?.email || `User #${c.friend_id}`;
                    const avatar = f?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
                    const lastTime = c.last?.created_at ? new Date(c.last.created_at).toLocaleString('vi-VN') : '';
                    const lastMsg = c.last?.content || '';

                    return (
                      <div
                        key={c.friend_id}
                        className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedFriendId === c.friend_id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedFriendId(c.friend_id)}
                      >
                        <Avatar>
                          <AvatarImage src={avatar} />
                          <AvatarFallback>{name[0]}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold truncate">{name}</p>
                            <span className="text-xs text-gray-500">{lastTime}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 truncate">{lastMsg}</p>
                            {c.unread > 0 && (
                              <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {c.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT: chat with selected friend */}
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b flex items-center gap-3">
                {selectedContact?.friend ? (
                  <>
                    <Avatar>
                      <AvatarImage src={selectedContact.friend.avatar_url} />
                      <AvatarFallback>
                        {(selectedContact.friend.display_name || selectedContact.friend.username || 'U')[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {selectedContact.friend.display_name || selectedContact.friend.username || selectedContact.friend.email}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {selectedContact.friend.username ? `@${selectedContact.friend.username}` : selectedContact.friend.email}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">Chọn một bạn bè để nhắn tin</p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="text-sm text-gray-500">Đang tải tin nhắn...</div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-gray-500">Chưa có tin nhắn</div>
                ) : (
                  messages.map((msg) => {
                    const isIncoming = msg.sender_id === selectedFriendId;
                    return (
                      <div key={msg.id} className={`flex ${isIncoming ? 'justify-start' : 'justify-end'}`}>
                        <div
                          className={`max-w-xs ${
                            isIncoming ? 'bg-gray-100 text-gray-900' : 'bg-blue-600 text-white'
                          } rounded-2xl px-4 py-2`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${isIncoming ? 'text-gray-500' : 'text-blue-200'}`}>
                            {msg.created_at
                              ? new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 border-t flex gap-2">
                <Input
                  placeholder={selectedFriendId ? 'Nhập tin nhắn...' : 'Chọn bạn bè để nhắn tin'}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={!selectedFriendId}
                />
                <Button onClick={handleSend} disabled={!selectedFriendId || !message.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}