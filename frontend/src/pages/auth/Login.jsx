import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock login logic
    const isAdmin = email === 'admin@game.com';
    onLogin(isAdmin);
    navigate(isAdmin ? '/admin' : '/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-full">
              <Gamepad2 className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl">Board Game Hub</CardTitle>
          <CardDescription>Đăng nhập để bắt đầu chơi game</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked)}
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Ghi nhớ đăng nhập
              </label>
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600">
              Đăng nhập
            </Button>
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="text-blue-600 hover:underline">
                  Đăng ký ngay
                </Link>
              </p>
              <p className="text-xs text-gray-500 italic">
                Gợi ý: Dùng admin@game.com để đăng nhập admin
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}