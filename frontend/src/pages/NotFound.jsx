import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-white mb-4">404</h1>
          <p className="text-3xl font-semibold text-white mb-2">Không tìm thấy trang</p>
          <p className="text-white/80 text-lg">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link to="/">
            <Button className="bg-white text-purple-600 hover:bg-gray-100">
              <Home className="w-4 h-4 mr-2" />
              Về trang chủ
            </Button>
          </Link>
          <Button
            variant="outline"
            className="bg-transparent border-white text-white hover:bg-white/10"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>

        <div className="mt-12 text-white/60 text-sm">
          <p>Game bạn đang tìm có thể đang ở đây:</p>
          <div className="flex gap-2 justify-center mt-2 text-6xl">
            <span>🎮</span>
            <span>🎯</span>
            <span>🎲</span>
            <span>🃏</span>
          </div>
        </div>
      </div>
    </div>
  );
}