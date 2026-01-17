import React, { useState, useMemo, useEffect, useCallback } from "react";
import Layout from "../../components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/context/ThemeContext";
import { 
  Sun, 
  Moon, 
  Check, 
  Palette, 
  Type, 
  Square,
  Sparkles, 
  Layers,
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  Save,
  RotateCcw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

export default function AdvancedAppearanceSettings({ onLogout }) {
  const { modeId, setModeId, modes } = useTheme();
  const [selectedMode, setSelectedMode] = useState('light');
  const [selectedColor, setSelectedColor] = useState('default');
  
  // Các settings mới
  const [fontFamily, setFontFamily] = useState('inter');
  const [fontSize, setFontSize] = useState(1);
  const [borderRadius, setBorderRadius] = useState(0.5);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [shadowIntensity, setShadowIntensity] = useState(1);
  const [viewMode, setViewMode] = useState('desktop');

  // Lưu settings vào localStorage
  const saveSettings = useCallback(() => {
    const settings = {
      fontFamily,
      fontSize,
      borderRadius,
      animationSpeed,
      shadowIntensity,
    };
    localStorage.setItem('appearance_settings_v2', JSON.stringify(settings));
  }, [fontFamily, fontSize, borderRadius, animationSpeed, shadowIntensity]);

  // Tải settings từ localStorage
  useEffect(() => {
    const saved = localStorage.getItem('appearance_settings_v2');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setFontFamily(settings.fontFamily || 'inter');
        setFontSize(settings.fontSize || 1);
        setBorderRadius(settings.borderRadius || 0.5);
        setAnimationSpeed(settings.animationSpeed || 1);
        setShadowIntensity(settings.shadowIntensity || 1);
      } catch (e) {
        console.error('Error loading appearance settings:', e);
      }
    }
  }, []);

  useEffect(() => {
    const currentMode = modes.find(m => m.id === modeId);
    if (currentMode) {
      setSelectedMode(currentMode.isDark ? 'dark' : 'light');
      
      if (modeId === 'light' || modeId === 'dark') {
        setSelectedColor('default');
      } else if (modeId.includes('-dark')) {
        setSelectedColor(modeId.replace('-dark', ''));
      } else {
        setSelectedColor(modeId);
      }
    }
  }, [modeId, modes]);

  const colors = useMemo(() => [
    { id: 'default', name: 'Neutral', lightClass: 'from-gray-100 to-gray-200', darkClass: 'from-gray-800 to-gray-900', label: 'Classic' },
    { id: 'blue', name: 'Azure', lightClass: 'from-blue-100 to-blue-200', darkClass: 'from-blue-800 to-blue-900', label: 'Cool' },
    { id: 'rose', name: 'Blush', lightClass: 'from-rose-100 to-rose-200', darkClass: 'from-rose-800 to-rose-900', label: 'Warm' },
    { id: 'emerald', name: 'Jade', lightClass: 'from-emerald-100 to-emerald-200', darkClass: 'from-emerald-800 to-emerald-900', label: 'Fresh' },
    { id: 'violet', name: 'Amethyst', lightClass: 'from-violet-100 to-violet-200', darkClass: 'from-violet-800 to-violet-900', label: 'Royal' },
    { id: 'amber', name: 'Sunset', lightClass: 'from-amber-100 to-amber-200', darkClass: 'from-amber-800 to-amber-900', label: 'Warm' },
    { id: 'cyan', name: 'Ocean', lightClass: 'from-cyan-100 to-cyan-200', darkClass: 'from-cyan-800 to-cyan-900', label: 'Calm' },
    { id: 'lime', name: 'Lime', lightClass: 'from-lime-100 to-lime-200', darkClass: 'from-lime-800 to-lime-900', label: 'Vibrant' },
    { id: 'fuchsia', name: 'Magenta', lightClass: 'from-fuchsia-100 to-fuchsia-200', darkClass: 'from-fuchsia-800 to-fuchsia-900', label: 'Bold' },
    { id: 'orange', name: 'Tangerine', lightClass: 'from-orange-100 to-orange-200', darkClass: 'from-orange-800 to-orange-900', label: 'Energetic' },
    { id: 'slate', name: 'Graphite', lightClass: 'from-slate-100 to-slate-200', darkClass: 'from-slate-800 to-slate-900', label: 'Professional' },
    { id: 'indigo', name: 'Midnight', lightClass: 'from-indigo-100 to-indigo-200', darkClass: 'from-indigo-800 to-indigo-900', label: 'Deep' },
  ], []);

  const fonts = useMemo(() => [
    { id: 'inter', name: 'Inter', class: 'font-inter', description: 'Modern sans-serif' },
    { id: 'system', name: 'System UI', class: 'font-system', description: 'Your system font' },
    { id: 'roboto', name: 'Roboto', class: 'font-roboto', description: 'Google Material' },
    { id: 'geist', name: 'Geist', class: 'font-geist', description: 'Tech/Modern' },
    { id: 'serif', name: 'Serif', class: 'font-serif', description: 'Traditional' },
    { id: 'mono', name: 'Monospace', class: 'font-mono', description: 'Code style' },
  ], []);

  const applyAllSettings = () => {
    // Áp dụng theme
    let newModeId;
    if (selectedColor === 'default') {
      newModeId = selectedMode;
    } else {
      newModeId = selectedMode === 'dark' ? `${selectedColor}-dark` : selectedColor;
    }
    setModeId(newModeId);
    
    // Áp dụng CSS custom properties cho toàn app
    const root = document.documentElement;
    
    // Font size
    root.style.setProperty('--font-size-scale', fontSize.toString());
    
    // Border radius
    root.style.setProperty('--radius-scale', borderRadius.toString());
    
    // Animation speed
    root.style.setProperty('--animation-speed', animationSpeed.toString());
    root.style.setProperty('--transition-speed', `${animationSpeed * 100}ms`);
    
    // Shadow intensity
    root.style.setProperty('--shadow-intensity', shadowIntensity.toString());
    
    // Font family - quan trọng nhất
    document.body.className = document.body.className.replace(/\bfont-\S+/g, '');
    document.body.classList.add(`font-${fontFamily}`);
    
    // Lưu settings
    saveSettings();
  };

  const resetToDefaults = () => {
    setSelectedMode('light');
    setSelectedColor('default');
    setFontFamily('inter');
    setFontSize(1);
    setBorderRadius(0.5);
    setAnimationSpeed(1);
    setShadowIntensity(1);
    
    // Reset CSS properties
    const root = document.documentElement;
    root.style.removeProperty('--font-size-scale');
    root.style.removeProperty('--radius-scale');
    root.style.removeProperty('--animation-speed');
    root.style.removeProperty('--shadow-intensity');
    root.style.removeProperty('--transition-speed');
    
    // Reset font family
    document.body.className = document.body.className.replace(/\bfont-\S+/g, '');
    document.body.classList.add('font-inter');
    
    // Reset theme
    setModeId('light');
    localStorage.removeItem('appearance_settings_v2');
  };

  const previewMode = useMemo(() => {
    const themeId = selectedColor === 'default' ? selectedMode : (selectedMode === 'dark' ? `${selectedColor}-dark` : selectedColor);
    return modes.find(m => m.id === themeId) || modes[0];
  }, [selectedMode, selectedColor, modes]);

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Visual Customization Studio
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
              Fine-tune every aspect of your visual experience
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={resetToDefaults} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset All
            </Button>
            <Button onClick={applyAllSettings} className="gap-2 bg-gradient-to-r from-primary to-primary/80">
              <Save className="w-4 h-4" />
              Apply All Changes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="themes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="themes" className="gap-2">
              <Palette className="w-4 h-4" />
              Color Themes
            </TabsTrigger>
            <TabsTrigger value="typography" className="gap-2">
              <Type className="w-4 h-4" />
              Typography
            </TabsTrigger>
            <TabsTrigger value="layout" className="gap-2">
              <Layers className="w-4 h-4" />
              Layout & Effects
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Color Themes */}
          <TabsContent value="themes" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Visual Mode & Color Palette</CardTitle>
                <CardDescription>
                  Choose your base interface tone and accent color scheme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Mode Selection */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Visual Mode</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setSelectedMode('light')}
                          className={`p-6 rounded-xl border-2 transition-all ${
                            selectedMode === 'light'
                              ? 'border-primary bg-gradient-to-r from-primary/5 to-primary/10'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <div className="text-center">
                            <Sun className={`w-10 h-10 mb-3 mx-auto ${selectedMode === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="block font-bold">Light Mode</span>
                            <span className="block text-sm text-muted-foreground mt-1">Clean & Bright</span>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => setSelectedMode('dark')}
                          className={`p-6 rounded-xl border-2 transition-all ${
                            selectedMode === 'dark'
                              ? 'border-primary bg-gradient-to-r from-primary/5 to-primary/10'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <div className="text-center">
                            <Moon className={`w-10 h-10 mb-3 mx-auto ${selectedMode === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="block font-bold">Dark Mode</span>
                            <span className="block text-sm text-muted-foreground mt-1">Sleek & Modern</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Color Palette */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Color Palette</h3>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                        {colors.map((color) => (
                          <button
                            key={color.id}
                            onClick={() => setSelectedColor(color.id)}
                            className={`aspect-square rounded-lg relative overflow-hidden ${
                              selectedColor === color.id ? 'ring-2 ring-primary ring-offset-2' : ''
                            }`}
                          >
                            <div className={`absolute inset-0 bg-gradient-to-br ${
                              selectedMode === 'light' ? color.lightClass : color.darkClass
                            }`} />
                            {selectedColor === color.id && (
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <Check className="w-6 h-6 text-white" />
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                              <div className="text-white text-xs font-medium text-center">{color.name}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Live Preview</h3>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setViewMode('desktop')}
                          className={viewMode === 'desktop' ? 'bg-primary/10' : ''}
                        >
                          <Monitor className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setViewMode('tablet')}
                          className={viewMode === 'tablet' ? 'bg-primary/10' : ''}
                        >
                          <Tablet className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setViewMode('mobile')}
                          className={viewMode === 'mobile' ? 'bg-primary/10' : ''}
                        >
                          <Smartphone className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                      selectedMode === 'dark' ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'
                    } ${viewMode === 'tablet' ? 'max-w-md mx-auto' : viewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl ${
                            selectedMode === 'dark' 
                              ? selectedColor === 'default' ? 'bg-gray-700' : `bg-gradient-to-br ${colors.find(c => c.id === selectedColor)?.darkClass}`
                              : selectedColor === 'default' ? 'bg-gray-200' : `bg-gradient-to-br ${colors.find(c => c.id === selectedColor)?.lightClass}`
                          } flex items-center justify-center`}>
                            <Palette className={`w-6 h-6 ${selectedMode === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                          </div>
                          <div>
                            <div className="font-bold text-lg">Theme Preview</div>
                            <div className={`text-sm ${selectedMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {selectedMode === 'light' ? 'Light' : 'Dark'} • {colors.find(c => c.id === selectedColor)?.name}
                            </div>
                          </div>
                        </div>
                        <Badge variant={selectedMode === 'dark' ? 'secondary' : 'outline'}>
                          Preview
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 mt-6">
                        <Button className="rounded-lg">Primary Action</Button>
                        <Button variant="secondary" className="rounded-lg">Secondary</Button>
                        <Button variant="outline" className="rounded-lg">Outline</Button>
                      </div>
                      
                      <div className={`mt-6 p-4 rounded-lg ${
                        selectedMode === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
                      }`}>
                        <div className="text-sm opacity-90">Selected: <span className="font-bold">{selectedMode === 'light' ? 'Light Mode' : 'Dark Mode'} • {colors.find(c => c.id === selectedColor)?.name} Palette</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Typography */}
          <TabsContent value="typography" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Typography Settings</CardTitle>
                <CardDescription>
                  Customize fonts and text sizes for optimal reading experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Font Family */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Font Family</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {fonts.map((font) => (
                          <button
                            key={font.id}
                            onClick={() => setFontFamily(font.id)}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${
                              fontFamily === font.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/30'
                            } ${font.class}`}
                          >
                            <div className="text-xl mb-2">
                              Aa
                            </div>
                            <div className="font-medium">{font.name}</div>
                            <div className="text-xs text-muted-foreground">{font.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Font Size</h3>
                        <span className="text-sm text-muted-foreground">
                          Scale: {fontSize.toFixed(1)}x
                        </span>
                      </div>
                      <Slider
                        value={[fontSize]}
                        onValueChange={([value]) => setFontSize(value)}
                        min={0.8}
                        max={1.2}
                        step={0.05}
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Small</span>
                        <span>Medium</span>
                        <span>Large</span>
                      </div>
                    </div>
                  </div>

                  {/* Typography Preview */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Typography Preview</h3>
                    <div className={`p-6 rounded-xl border bg-card space-y-4 ${fonts.find(f => f.id === fontFamily)?.class}`}>
                      <div style={{ fontSize: `${fontSize * 2.5}rem` }} className="font-bold">
                        Heading 1
                      </div>
                      <div style={{ fontSize: `${fontSize * 2}rem` }} className="font-bold">
                        Heading 2
                      </div>
                      <div style={{ fontSize: `${fontSize * 1.75}rem` }} className="font-bold">
                        Heading 3
                      </div>
                      <div style={{ fontSize: `${fontSize * 1.25}rem` }} className="font-semibold">
                        Subheading
                      </div>
                      <div style={{ fontSize: `${fontSize * 1}rem` }} className="leading-relaxed">
                        This is a sample paragraph showing how the selected font family and size will appear. The quick brown fox jumps over the lazy dog.
                      </div>
                      <div style={{ fontSize: `${fontSize * 0.875}rem` }} className="text-muted-foreground">
                        This is smaller text for captions and descriptions.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Layout & Effects */}
          <TabsContent value="layout" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Layout & Visual Effects</CardTitle>
                <CardDescription>
                  Adjust spacing, animations, and visual effects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Controls */}
                  <div className="space-y-8">
                    {/* Border Radius */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Square className="w-5 h-5 text-muted-foreground" />
                          <h3 className="text-lg font-semibold">Border Radius</h3>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Level: {borderRadius === 0 ? 'None' : borderRadius === 0.25 ? 'Small' : borderRadius === 0.5 ? 'Medium' : borderRadius === 0.75 ? 'Large' : 'Extra Large'}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {[0, 0.25, 0.5, 0.75, 1].map((value) => (
                          <button
                            key={value}
                            onClick={() => setBorderRadius(value)}
                            className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${
                              borderRadius === value
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/30'
                            }`}
                          >
                            <div 
                              className="w-12 h-12 bg-primary/20 border-2 border-primary/40 mb-2"
                              style={{ borderRadius: `${value}rem` }}
                            />
                            <span className="text-sm">
                              {value === 0 ? 'None' : value === 0.25 ? 'S' : value === 0.5 ? 'M' : value === 0.75 ? 'L' : 'XL'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Animation Speed */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-muted-foreground" />
                          <h3 className="text-lg font-semibold">Animation Speed</h3>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {animationSpeed.toFixed(1)}x
                        </span>
                      </div>
                      <Slider
                        value={[animationSpeed]}
                        onValueChange={([value]) => setAnimationSpeed(value)}
                        min={0.5}
                        max={1.5}
                        step={0.1}
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Slow</span>
                        <span>Normal</span>
                        <span>Fast</span>
                      </div>
                    </div>

                    {/* Shadow Intensity */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Shadow Intensity</h3>
                        <span className="text-sm text-muted-foreground">
                          Level: {shadowIntensity === 0 ? 'None' : shadowIntensity === 0.5 ? 'Subtle' : shadowIntensity === 1 ? 'Normal' : shadowIntensity === 1.5 ? 'Strong' : 'Heavy'}
                        </span>
                      </div>
                      <Slider
                        value={[shadowIntensity]}
                        onValueChange={([value]) => setShadowIntensity(value)}
                        min={0}
                        max={2}
                        step={0.5}
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Layout Preview</h3>
                    <div className="space-y-4">
                      {/* Cards with different border radius */}
                      <div className="grid grid-cols-2 gap-4">
                        <div 
                          className="p-4 bg-card border shadow-sm"
                          style={{ borderRadius: `${borderRadius}rem` }}
                        >
                          <div className="font-medium mb-2">Card</div>
                          <div className="text-sm text-muted-foreground">Border radius: {borderRadius}rem</div>
                        </div>
                        <div 
                          className="p-4 bg-primary text-primary-foreground shadow-sm"
                          style={{ borderRadius: `${borderRadius}rem` }}
                        >
                          <div className="font-medium mb-2">Primary</div>
                          <div className="text-sm opacity-90">Same border radius</div>
                        </div>
                      </div>

                      {/* Buttons with different styles */}
                      <div className="flex flex-wrap gap-3 mt-6">
                        <Button 
                          className="transition-all"
                          style={{ 
                            borderRadius: `${borderRadius}rem`,
                            boxShadow: `0 ${shadowIntensity * 4}px ${shadowIntensity * 6}px rgba(0,0,0,0.1)`
                          }}
                        >
                          Primary Button
                        </Button>
                        <Button 
                          variant="outline"
                          className="transition-all"
                          style={{ borderRadius: `${borderRadius}rem` }}
                        >
                          Outline Button
                        </Button>
                      </div>

                      {/* Animation preview */}
                      <div className="mt-8">
                        <h4 className="font-medium mb-4">Animation Preview</h4>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full animate-pulse"
                            style={{ 
                              animationDuration: `${2 / animationSpeed}s`
                            }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Pulse animation speed: {animationSpeed.toFixed(1)}x
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Summary Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Settings Summary</CardTitle>
            <CardDescription>
              Review and apply all your customizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Theme</div>
                <div className="font-medium">{selectedMode === 'light' ? 'Light' : 'Dark'} • {colors.find(c => c.id === selectedColor)?.name}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Typography</div>
                <div className="font-medium">{fonts.find(f => f.id === fontFamily)?.name} • {fontSize.toFixed(1)}x</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Layout</div>
                <div className="font-medium">Radius: {borderRadius} • Anim: {animationSpeed.toFixed(1)}x</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Effects</div>
                <div className="font-medium">Shadow: {shadowIntensity}x</div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={resetToDefaults}>
                Reset All
              </Button>
              <Button 
                onClick={applyAllSettings}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                size="lg"
              >
                <Save className="w-4 h-4 mr-2" />
                Apply All Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}