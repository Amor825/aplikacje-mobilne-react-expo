import { useRouter } from 'expo-router';
import { ChevronRight, UserMinus, Users } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface FollowedUser {
  following_id: string;
  username: string;
}

export default function FollowingScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [list, setList] = useState<FollowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_follows')
      .select('following_id, profiles!user_follows_following_id_fkey(username)')
      .eq('follower_id', user.id);

    const mapped: FollowedUser[] = (data ?? []).map((row: any) => ({
      following_id: row.following_id,
      username: row.profiles?.username ?? 'Nieznany',
    }));
    setList(mapped);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleUnfollow = async (followingId: string) => {
    await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user!.id)
      .eq('following_id', followingId);
    fetch();
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Users size={28} color={Colors.gold} />
          <Text style={styles.title}>Obserwowani</Text>
        </View>
        <Text style={styles.subtitle}>{list.length} {list.length === 1 ? 'czytelnik' : 'czytelników'}</Text>
      </Animated.View>

      {loading ? (
        <ActivityIndicator color={Colors.gold} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.following_id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={Colors.gold} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Users size={48} color={Colors.border} />
              <Text style={styles.emptyText}>Nie obserwujesz jeszcze nikogo.</Text>
              <Text style={styles.emptyHint}>Wejdź w szczegóły książki, aby znaleźć innych czytelników.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInRight.duration(400).delay(index * 60)}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/user/${item.following_id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.username[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.username}>{item.username}</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  style={styles.unfollowBtn}
                  onPress={() => handleUnfollow(item.following_id)}
                >
                  <UserMinus size={16} color={Colors.error} />
                </TouchableOpacity>
                <ChevronRight size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingTop: 56, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  title: { fontSize: FontSize.xxl, color: Colors.gold, fontWeight: '700', letterSpacing: 1 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 0,
    backgroundColor: Colors.bgAccent,
    borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: Colors.gold, fontWeight: '700', fontSize: FontSize.md },
  username: { fontSize: FontSize.md, color: Colors.cream, fontWeight: '600' },
  unfollowBtn: {
    padding: 6,
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  empty: { flex: 1, alignItems: 'center', marginTop: 80, gap: Spacing.md, paddingHorizontal: Spacing.xl },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center', fontWeight: '600' },
  emptyHint: { fontSize: FontSize.sm, color: Colors.border, textAlign: 'center', lineHeight: 20 },
});
