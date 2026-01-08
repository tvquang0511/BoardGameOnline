import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { messagesApi } from '../../api/messages.api';

export default function Messages({ onLogout }) {
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [message, setMessage] = useState('');

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);

  const reloadConversations = async () => {
    const data = await messagesApi.conversations();
    setConversations(data.conversations || []);
    if (!selectedPartnerId && (data.conversations || []).length) {
      setSelectedPartnerId(data.conversations[0].partner_id);
    }
  };

  const reloadMessages = async (partnerId) => {
    if (!partnerId) return;
    const data = await messagesApi.list({ withUser: partnerId, page: 1, limit: 50 });
    setMessages(data.messages || []);
  };

  useEffect(() => {
    reloadConversations().catch(() => {
      // TODO(API): error state
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    reloadMessages(selectedPartnerId).catch(() => {});
  }, [selectedPartnerId]);

  const chatItems = useMemo(() => {
    return conversations.map((c, idx) => {
      const lastTime = c.last?.created_at ? new Date(c.last.created_at) : null;
      return {
        partner_id: c.partner_id,
        name: `User #${c.partner_id}`, // TODO(API MISSING): backend chưa join profile
        avatar: `seed_chat_${idx}`,
        lastMessage: c.last?.content || '',
        time: lastTime ? lastTime.toLocaleString('vi-VN') : '',
        unread: c.unread || 0,
        online: false, // TODO(API MISSING)
      };
    });
  }, [conversations]);

  const selectedChat = useMemo(() => {
    return chatItems.find((c) => c.partner_id === selectedPartnerId) || chatItems[0];
  }, [chatItems, selectedPartnerId]);

  const handleSend = async () => {
    if (!message.trim() || !selectedPartnerId) return;
    await messagesApi.send({ receiverId: selectedPartnerId, content: message.trim() });
    setMessage('');
    await reloadMessages(selectedPartnerId);
    await reloadConversations();
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <h1 className="text-4xl font-bold">Tin nhắn</h1>

        <Card className="h-[calc(100vh-200px)]">
          <CardContent className="p-0 h-full flex">
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b">
                <Input placeholder="Tìm kiếm... (TODO API)" />
              </div>
              <div className="flex-1 overflow-y-auto">
                {chatItems.map((chat) => (
                  <div
                    key={chat.partner_id}
                    className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedPartnerId === chat.partner_id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedPartnerId(chat.partner_id)}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.avatar}`} />
                        <AvatarFallback>{chat.name[0]}</AvatarFallback>
                      </Avatar>
                      {chat.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold truncate">{chat.name}</p>
                        <span className="text-xs text-gray-500">{chat.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                        {chat.unread > 0 && (
                          <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b flex items-center gap-3">
                {selectedChat ? (
                  <>
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChat.avatar}`} />
                      <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedChat.name}</p>
                      <p className="text-sm text-gray-600">
                        {selectedChat.online ? 'Đang hoạt động' : 'Không hoạt động'} {/* TODO(API MISSING) */}
                      </p>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === selectedPartnerId ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs ${
                        msg.sender_id === selectedPartnerId ? 'bg-gray-100 text-gray-900' : 'bg-blue-600 text-white'
                      } rounded-2xl px-4 py-2`}
                    >
                      <p>{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender_id === selectedPartnerId ? 'text-gray-500' : 'text-blue-200'
                        }`}
                      >
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t flex gap-2">
                <Input
                  placeholder="Nhập tin nhắn..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <Button onClick={handleSend}>
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