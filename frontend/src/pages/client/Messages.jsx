import { useState } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';

export default function Messages({ onLogout }) {
  const [selectedChat, setSelectedChat] = useState(0);
  const [message, setMessage] = useState('');

  const chats = [
    {
      id: 0,
      name: 'CoolGamer99',
      avatar: 'seed1',
      lastMessage: 'Chơi một ván nữa không?',
      time: '5 phút trước',
      unread: 2,
      online: true,
    },
    {
      id: 1,
      name: 'ProPlayer123',
      avatar: 'seed2',
      lastMessage: 'GG bro!',
      time: '1 giờ trước',
      unread: 0,
      online: true,
    },
    {
      id: 2,
      name: 'QueenBee',
      avatar: 'seed4',
      lastMessage: 'Cảm ơn nhé!',
      time: '2 giờ trước',
      unread: 1,
      online: false,
    },
    {
      id: 3,
      name: 'SpeedRunner',
      avatar: 'seed5',
      lastMessage: 'Mai chơi tiếp nhé',
      time: 'Hôm qua',
      unread: 0,
      online: false,
    },
  ];

  const messages = [
    { sender: 'other', text: 'Hey! Lâu quá không gặp', time: '10:30' },
    { sender: 'me', text: 'Yeah! Dạo này bận quá', time: '10:32' },
    { sender: 'other', text: 'Chơi một ván cờ caro không?', time: '10:33' },
    { sender: 'me', text: 'Ok! Tạo phòng đi', time: '10:35' },
    { sender: 'other', text: 'Chơi một ván nữa không?', time: '10:45' },
  ];

  const handleSend = () => {
    if (message.trim()) {
      setMessage('');
    }
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <h1 className="text-4xl font-bold">Tin nhắn</h1>

        <Card className="h-[calc(100vh-200px)]">
          <CardContent className="p-0 h-full flex">
            {/* Chat List */}
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b">
                <Input placeholder="Tìm kiếm..." />
              </div>
              <div className="flex-1 overflow-y-auto">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedChat === chat.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedChat(chat.id)}
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

            {/* Chat Window */}
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chats[selectedChat].avatar}`} />
                  <AvatarFallback>{chats[selectedChat].name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{chats[selectedChat].name}</p>
                  <p className="text-sm text-gray-600">
                    {chats[selectedChat].online ? 'Đang hoạt động' : 'Không hoạt động'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs ${
                        msg.sender === 'me'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      } rounded-2xl px-4 py-2`}
                    >
                      <p>{msg.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender === 'me' ? 'text-blue-200' : 'text-gray-500'
                        }`}
                      >
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t flex gap-2">
                <Input
                  placeholder="Nhập tin nhắn..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
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