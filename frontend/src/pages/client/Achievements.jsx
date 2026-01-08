import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock } from 'lucide-react';
import { achievementsApi } from '../../api/achievements.api';

export default function Achievements({ onLogout }) {
  const [catalog, setCatalog] = useState([]);
  const [mine, setMine] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [c, m] = await Promise.all([achievementsApi.catalog(), achievementsApi.my()]);
        if (!mounted) return;
        setCatalog(c.achievements || []);
        setMine(m.achievements || []);
      } catch {
        // TODO(API): backend unreachable -> fallback mock
        setCatalog([]);
        setMine([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const myMap = useMemo(() => {
    const map = new Map();
    for (const a of mine) map.set(a.code, a);
    return map;
  }, [mine]);

  const unlocked = useMemo(() => {
    return mine
      .filter((a) => !!a.unlocked_at)
      .map((a) => ({
        name: a.name,
        description: a.description,
        icon: '🏆', // TODO(API MISSING): backend chưa có icon
        color: 'from-yellow-400 to-orange-500', // TODO(API MISSING)
        date: a.unlocked_at ? new Date(a.unlocked_at).toLocaleDateString('vi-VN') : '',
        rarity: a.rarity || 'Common',
      }));
  }, [mine]);

  const locked = useMemo(() => {
    return catalog
      .filter((a) => !myMap.has(a.code))
      .map((a) => {
        const target = a.criteria?.target ?? 100; // TODO(API): criteria schema
        return {
          name: a.name,
          description: a.description,
          icon: '🌟', // TODO(API MISSING)
          color: 'from-gray-300 to-gray-400',
          progress: 0, // TODO(API MISSING): chưa có progress cho locked
          current: 0,
          total: target,
          rarity: a.rarity || 'Common',
        };
      });
  }, [catalog, myMap]);

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Common': return 'bg-gray-500';
      case 'Rare': return 'bg-blue-500';
      case 'Epic': return 'bg-purple-500';
      case 'Legendary': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const totalCount = catalog.length || 50;

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Thành tựu</h1>
          <p className="text-gray-600">Bạn đã mở khóa {unlocked.length}/{totalCount} thành tựu</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2"><CardDescription>Đã mở khóa</CardDescription></CardHeader>
            <CardContent><div className="text-3xl font-bold text-green-600">{unlocked.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Đang tiến hành</CardDescription></CardHeader>
            <CardContent><div className="text-3xl font-bold text-blue-600">{locked.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Tỷ lệ hoàn thành</CardDescription></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {totalCount ? Math.round((unlocked.length / totalCount) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="unlocked" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unlocked">Đã mở khóa ({unlocked.length})</TabsTrigger>
            <TabsTrigger value="locked">Chưa mở khóa ({locked.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="unlocked" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unlocked.map((achievement) => (
                <Card key={achievement.name} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${achievement.color} flex items-center justify-center text-3xl flex-shrink-0`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold">{achievement.name}</h3>
                          <Badge className={getRarityColor(achievement.rarity)}>{achievement.rarity}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                        <p className="text-xs text-gray-500">Mở khóa: {achievement.date}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="locked" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locked.map((achievement) => (
                <Card key={achievement.name} className="overflow-hidden opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${achievement.color} flex items-center justify-center text-3xl flex-shrink-0 relative`}>
                        <Lock className="w-6 h-6 text-gray-600 absolute" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-gray-700">{achievement.name}</h3>
                          <Badge className={getRarityColor(achievement.rarity)}>{achievement.rarity}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Tiến độ</span>
                            <span className="font-medium">{achievement.current}/{achievement.total}</span>
                          </div>
                          <Progress value={achievement.progress} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}