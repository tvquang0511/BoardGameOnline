import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';

export default function Settings({ onLogout }) {
  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Cài đặt</h1>
          <p className="text-gray-600">Tùy chỉnh trải nghiệm của bạn</p>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt chung</CardTitle>
            <CardDescription>Các cài đặt cơ bản của ứng dụng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Thông báo</Label>
                <p className="text-sm text-gray-500">Nhận thông báo khi có người thách đấu</p>
              </div>
              <Switch id="notifications" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound">Âm thanh</Label>
                <p className="text-sm text-gray-500">Bật/tắt âm thanh trong game</p>
              </div>
              <Switch id="sound" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="music">Nhạc nền</Label>
                <p className="text-sm text-gray-500">Phát nhạc nền khi chơi</p>
              </div>
              <Switch id="music" />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Âm lượng hiệu ứng</Label>
                <Slider defaultValue={[70]} max={100} step={1} />
              </div>
              <div className="space-y-2">
                <Label>Âm lượng nhạc nền</Label>
                <Slider defaultValue={[50]} max={100} step={1} />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="language">Ngôn ngữ</Label>
              <Select defaultValue="vi">
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngôn ngữ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Game Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt game</CardTitle>
            <CardDescription>Tùy chỉnh cách chơi game</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoSave">Tự động lưu</Label>
                <p className="text-sm text-gray-500">Tự động lưu tiến trình mỗi 5 phút</p>
              </div>
              <Switch id="autoSave" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="hints">Hiển thị gợi ý</Label>
                <p className="text-sm text-gray-500">Hiện gợi ý khi cần</p>
              </div>
              <Switch id="hints" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="animations">Hiệu ứng chuyển động</Label>
                <p className="text-sm text-gray-500">Bật/tắt animation trong game</p>
              </div>
              <Switch id="animations" defaultChecked />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="difficulty">Độ khó mặc định</Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue placeholder="Chọn độ khó" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Dễ</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="hard">Khó</SelectItem>
                  <SelectItem value="expert">Chuyên gia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Quyền riêng tư</CardTitle>
            <CardDescription>Quản lý quyền riêng tư của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showOnline">Hiện trạng thái online</Label>
                <p className="text-sm text-gray-500">Cho phép bạn bè xem bạn đang online</p>
              </div>
              <Switch id="showOnline" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showStats">Hiển thị thống kê</Label>
                <p className="text-sm text-gray-500">Cho phép người khác xem thống kê của bạn</p>
              </div>
              <Switch id="showStats" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="friendRequests">Lời mời kết bạn</Label>
                <p className="text-sm text-gray-500">Cho phép nhận lời mời kết bạn</p>
              </div>
              <Switch id="friendRequests" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Hành động</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Xuất dữ liệu cá nhân
            </Button>
            <Button variant="outline" className="w-full justify-start text-orange-600 border-orange-300 hover:bg-orange-50">
              Xóa bộ nhớ cache
            </Button>
            <Button variant="outline" className="w-full justify-start text-red-600 border-red-300 hover:bg-red-50">
              Xóa tài khoản
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline">Hủy</Button>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600">Lưu thay đổi</Button>
        </div>
      </div>
    </Layout>
  );
}