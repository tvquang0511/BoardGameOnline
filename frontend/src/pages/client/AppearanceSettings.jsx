import React, { useState, useMemo, useEffect } from "react";
import Layout from "../../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, Check } from "lucide-react";

export default function AppearanceSettings({ onLogout }) {
  const { modeId, setModeId, modes } = useTheme();
  const [selectedMode, setSelectedMode] = useState('light'); // 'light' hoặc 'dark'
  const [selectedColor, setSelectedColor] = useState('default'); // 'default', 'blue', 'rose', etc.

  // Parse current theme id to get mode and color
  useEffect(() => {
    const currentMode = modes.find(m => m.id === modeId);
    if (currentMode) {
      setSelectedMode(currentMode.isDark ? 'dark' : 'light');
      
      // Extract color from id
      if (modeId === 'light' || modeId === 'dark') {
        setSelectedColor('default');
      } else if (modeId.includes('-dark')) {
        setSelectedColor(modeId.replace('-dark', ''));
      } else {
        setSelectedColor(modeId);
      }
    }
  }, [modeId, modes]);

  const colors = useMemo(() => {
    const colorOptions = [
      { id: 'default', name: 'Mặc định', lightClass: 'from-gray-100 to-gray-200', darkClass: 'from-gray-800 to-gray-900' },
      { id: 'blue', name: 'Xanh dương', lightClass: 'from-blue-100 to-blue-200', darkClass: 'from-blue-800 to-blue-900' },
      { id: 'rose', name: 'Hồng', lightClass: 'from-rose-100 to-rose-200', darkClass: 'from-rose-800 to-rose-900' },
      { id: 'emerald', name: 'Ngọc lục bảo', lightClass: 'from-emerald-100 to-emerald-200', darkClass: 'from-emerald-800 to-emerald-900' },
      { id: 'violet', name: 'Tím', lightClass: 'from-violet-100 to-violet-200', darkClass: 'from-violet-800 to-violet-900' },
      { id: 'amber', name: 'Hổ phách', lightClass: 'from-amber-100 to-amber-200', darkClass: 'from-amber-800 to-amber-900' },
      { id: 'cyan', name: 'Lục lam', lightClass: 'from-cyan-100 to-cyan-200', darkClass: 'from-cyan-800 to-cyan-900' },
      { id: 'lime', name: 'Chanh', lightClass: 'from-lime-100 to-lime-200', darkClass: 'from-lime-800 to-lime-900' },
      { id: 'fuchsia', name: 'Phấn hồng', lightClass: 'from-fuchsia-100 to-fuchsia-200', darkClass: 'from-fuchsia-800 to-fuchsia-900' },
      { id: 'orange', name: 'Cam', lightClass: 'from-orange-100 to-orange-200', darkClass: 'from-orange-800 to-orange-900' },
      { id: 'slate', name: 'Xám xanh', lightClass: 'from-slate-100 to-slate-200', darkClass: 'from-slate-800 to-slate-900' },
      { id: 'indigo', name: 'Chàm', lightClass: 'from-indigo-100 to-indigo-200', darkClass: 'from-indigo-800 to-indigo-900' },
    ];
    return colorOptions;
  }, []);

  const handleApply = () => {
    let newModeId;
    if (selectedColor === 'default') {
      newModeId = selectedMode; // 'light' hoặc 'dark'
    } else {
      newModeId = selectedMode === 'dark' ? `${selectedColor}-dark` : selectedColor;
    }
    setModeId(newModeId);
  };

  const isActive = (mode, color) => {
    const currentMode = modeId === 'light' || (!modes.find(m => m.id === modeId)?.isDark && !modeId.includes('-dark'));
    return (mode === 'light' ? !currentMode : currentMode) && selectedColor === color;
  };

  const getPreviewThemeId = () => {
    if (selectedColor === 'default') return selectedMode;
    return selectedMode === 'dark' ? `${selectedColor}-dark` : selectedColor;
  };

  const previewMode = modes.find(m => m.id === getPreviewThemeId()) || modes[0];

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold mb-2">Cài đặt giao diện</h1>
          <p className="text-muted-foreground">Chọn chế độ và màu sắc cho ứng dụng</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Chọn giao diện</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mode Selection */}
            <div className="space-y-4">
              <h3 className="font-medium">Chế độ</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedMode('light')}
                  className={`flex-1 flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all ${
                    selectedMode === 'light'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/30'
                  }`}
                >
                  <Sun className={`w-8 h-8 mb-2 ${selectedMode === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-medium">Sáng</span>
                  <span className="text-sm text-muted-foreground mt-1">Giao diện sáng</span>
                </button>
                
                <button
                  onClick={() => setSelectedMode('dark')}
                  className={`flex-1 flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all ${
                    selectedMode === 'dark'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/30'
                  }`}
                >
                  <Moon className={`w-8 h-8 mb-2 ${selectedMode === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-medium">Tối</span>
                  <span className="text-sm text-muted-foreground mt-1">Giao diện tối</span>
                </button>
              </div>
            </div>

            {/* Color Selection */}
            <div className="space-y-4">
              <h3 className="font-medium">Màu sắc</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    className={`aspect-square rounded-lg relative overflow-hidden transition-transform hover:scale-105 ${
                      selectedColor === color.id ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${
                      selectedMode === 'light' ? color.lightClass : color.darkClass
                    }`} />
                    {selectedColor === color.id && (
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 text-center">
                      <span className="text-xs font-medium text-white drop-shadow-md">{color.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <h3 className="font-medium">Xem trước</h3>
              <div className={`p-6 rounded-lg border ${
                selectedMode === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${
                      selectedMode === 'dark' 
                        ? selectedColor === 'default' ? 'bg-gray-700' : `bg-gradient-to-br ${colors.find(c => c.id === selectedColor)?.darkClass}`
                        : selectedColor === 'default' ? 'bg-gray-200' : `bg-gradient-to-br ${colors.find(c => c.id === selectedColor)?.lightClass}`
                    }`} />
                    <div>
                      <div className="font-medium">Card tiêu đề</div>
                      <div className={`text-sm ${selectedMode === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Nội dung mô tả
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    selectedMode === 'dark' 
                      ? 'bg-gray-700 text-gray-300' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    Tag
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <button className={`px-4 py-2 rounded-md ${
                    selectedMode === 'dark' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}>
                    Nút chính
                  </button>
                  <button className={`px-4 py-2 rounded-md border ${
                    selectedMode === 'dark' 
                      ? 'border-gray-600 hover:bg-gray-800' 
                      : 'border-gray-300 hover:bg-gray-100'
                  }`}>
                    Nút phụ
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Đang xem trước: <span className="font-medium">{selectedMode === 'light' ? 'Sáng' : 'Tối'} + {colors.find(c => c.id === selectedColor)?.name}</span>
              </div>
            </div>

            {/* Apply Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={handleApply}
                className="px-8"
                size="lg"
              >
                Áp dụng
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Theme Info */}
        <Card>
          <CardHeader>
            <CardTitle>Chủ đề hiện tại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{previewMode.name}</div>
                <div className="text-sm text-muted-foreground">
                  {previewMode.isDark ? 'Chế độ tối' : 'Chế độ sáng'}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                ID: {modeId}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}