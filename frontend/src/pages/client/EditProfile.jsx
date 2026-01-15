import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, RefreshCw, Search, Check } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { profilesApi } from '../../api/profiles.api';

export default function EditProfile({ onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState(null);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    avatar_url: ''
  });
  const [customSeed, setCustomSeed] = useState('');
  const [avatarSamples, setAvatarSamples] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState('');

  // Load user data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const meData = await authApi.me();
        if (!mounted) return;
        setMe(meData);
        
        // Initialize form data
        const profile = meData.profile || {};
        setFormData({
          display_name: profile.display_name || '',
          bio: profile.bio || '',
          avatar_url: profile.avatar_url || ''
        });
        setSelectedAvatar(profile.avatar_url || '');
        
        // Generate custom seed from username/email if no avatar
        if (!profile.avatar_url) {
          const seed = profile.username || meData.user?.email || 'user';
          setCustomSeed(seed);
        } else {
          // Try to extract seed from existing avatar URL
          const url = new URL(profile.avatar_url);
          const params = new URLSearchParams(url.search);
          const seed = params.get('seed') || profile.username || '';
          setCustomSeed(seed);
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Generate sample avatars
  useEffect(() => {
    if (!me) return;
    
    const baseSeed = me.profile?.username || me.user?.email || 'user';
    const samples = [];
    
    // Generate 30 sample avatars
    for (let i = 0; i < 30; i++) {
      const seed = `${baseSeed}${i}`;
      samples.push({
        seed,
        url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`
      });
    }
    
    setAvatarSamples(samples);
  }, [me]);

  // Generate avatar from custom seed
  const generateCustomAvatar = () => {
    if (!customSeed.trim()) return;
    const seed = customSeed.trim();
    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
    setSelectedAvatar(url);
    setFormData(prev => ({ ...prev, avatar_url: url }));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle avatar selection from samples
  const handleSelectAvatar = (url) => {
    setSelectedAvatar(url);
    setFormData(prev => ({ ...prev, avatar_url: url }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      
      // Prepare update data
      const updateData = {};
      if (formData.display_name !== me.profile?.display_name) {
        updateData.display_name = formData.display_name;
      }
      if (formData.bio !== me.profile?.bio) {
        updateData.bio = formData.bio;
      }
      if (formData.avatar_url !== me.profile?.avatar_url) {
        updateData.avatar_url = formData.avatar_url;
      }

      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        await profilesApi.updateMe(updateData);
        
        // Show success message (you can add toast here)
        alert('Cập nhật hồ sơ thành công!');
        navigate('/profile');
      } else {
        navigate('/profile');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật:', error);
      alert('Có lỗi xảy ra khi cập nhật hồ sơ. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout onLogout={onLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Đang tải...</div>
        </div>
      </Layout>
    );
  }

  const currentAvatar = selectedAvatar || formData.avatar_url || 
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(me?.profile?.username || 'user')}`;

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold">Chỉnh sửa hồ sơ</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Avatar Selection */}
            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ảnh đại diện</CardTitle>
                  <CardDescription>
                    Chọn ảnh đại diện mới cho tài khoản
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Current Avatar Preview */}
                    <div className="flex flex-col items-center">
                      <Avatar className="w-32 h-32 border-4 border-white shadow-lg mb-4">
                        <AvatarImage src={currentAvatar} />
                        <AvatarFallback className="text-3xl">
                          {me?.profile?.display_name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm text-gray-500 text-center">
                        Ảnh đại diện hiện tại
                      </p>
                    </div>

                    {/* Avatar Selection Tabs */}
                    <Tabs defaultValue="samples" className="w-full">
                      <TabsList className="grid grid-cols-2">
                        <TabsTrigger value="samples">Mẫu có sẵn</TabsTrigger>
                        <TabsTrigger value="custom">Tự tạo</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="samples" className="space-y-4">
                        <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
                          {avatarSamples.map((avatar, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleSelectAvatar(avatar.url)}
                              className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                                selectedAvatar === avatar.url 
                                  ? 'border-blue-500 ring-2 ring-blue-200' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <img 
                                src={avatar.url} 
                                alt={`Avatar ${avatar.seed}`}
                                className="w-full h-auto aspect-square"
                              />
                              {selectedAvatar === avatar.url && (
                                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                  <Check className="w-6 h-6 text-white bg-blue-500 rounded-full p-1" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          Bấm vào ảnh để chọn. Tổng cộng 30 mẫu.
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="custom" className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="custom-seed">Seed (từ khóa)</Label>
                          <div className="flex gap-2">
                            <Input
                              id="custom-seed"
                              value={customSeed}
                              onChange={(e) => setCustomSeed(e.target.value)}
                              placeholder="Nhập từ khóa (tên, email, số, ...)"
                            />
                            <Button 
                              type="button" 
                              onClick={generateCustomAvatar}
                              className="whitespace-nowrap"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Tạo
                            </Button>
                          </div>
                        </div>
                        
                        {selectedAvatar && selectedAvatar.includes(customSeed) && (
                          <div className="space-y-2">
                            <Label>Xem trước</Label>
                            <div className="flex justify-center">
                              <img 
                                src={selectedAvatar} 
                                alt="Custom avatar preview"
                                className="w-32 h-32 rounded-lg border"
                              />
                            </div>
                            <div className="text-xs text-gray-500 text-center">
                              URL: {selectedAvatar}
                            </div>
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-500">
                          <p className="font-semibold">Gợi ý seed:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Tên của bạn: "john", "anna", "nguyen"</li>
                            <li>Email: "john@example.com"</li>
                            <li>Biệt danh: "superplayer", "gamer123"</li>
                            <li>Số ngẫu nhiên: "12345", "player2024"</li>
                          </ul>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Profile Information */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
                  <CardDescription>
                    Cập nhật thông tin hiển thị công khai
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Display Name */}
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Tên hiển thị</Label>
                    <Input
                      id="display_name"
                      name="display_name"
                      value={formData.display_name}
                      onChange={handleInputChange}
                      placeholder="Nhập tên hiển thị của bạn"
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500">
                      Tên này sẽ được hiển thị cho người khác thấy
                    </p>
                  </div>

                  {/* Username (read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="username">Tên đăng nhập</Label>
                    <Input
                      id="username"
                      value={me?.profile?.username || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">
                      Tên đăng nhập không thể thay đổi
                    </p>
                  </div>

                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={me?.user?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Giới thiệu bản thân</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Giới thiệu về bản thân, sở thích, ..."
                      rows={4}
                      maxLength={500}
                    />
                    <div className="flex justify-between">
                      <p className="text-xs text-gray-500">
                        Giới thiệu ngắn gọn về bản thân
                      </p>
                      <p className="text-xs text-gray-500">
                        {formData.bio.length}/500 ký tự
                      </p>
                    </div>
                  </div>

                  {/* Stats Preview */}
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3">Thông tin thống kê (chỉ xem)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Level</p>
                        <p className="text-lg font-semibold">{me?.profile?.level || 1}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Điểm</p>
                        <p className="text-lg font-semibold">{(me?.profile?.points || 0).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/profile')}
                  disabled={saving}
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Lưu thay đổi
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}