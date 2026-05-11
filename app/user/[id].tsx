import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, BookPlus, Star, UserMinus, UserPlus } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { Book, supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

function StarRow({ rating }: { rating: number | null }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={13} color={rating && i <= rating ? Colors.star : Colors.starEmpty} fill={rating && i <= rating ? Colors.star : Colors.starEmpty} />
      ))}
    </View>
  );
}

export default function UserProfileScreen() {
  const { id: targetUserId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addedBooks, setAddedBooks] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    if (!user || !targetUserId) return;

    const [{ data: profile }, { data: booksData }, { data: followData }] = await Promise.all([
      supabase.from('profiles').select('username').eq('id', targetUserId).single(),
      supabase.from('books').select('*').eq('user_id', targetUserId).eq('status', 'finished').order('date_added', { ascending: false }),
      supabase.from('user_follows').select('id').eq('follower_id', user.id).eq('following_id', targetUserId).maybeSingle(),
    ]);

    setUsername(profile?.username ?? 'Nieznany');
    setBooks(booksData ?? []);
    setIsFollowing(!!followData);
    setLoading(false);
  }, [user, targetUserId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleFollow = async () => {
    if (isFollowing) {
      await supabase.from('user_follows').delete().eq('follower_id', user!.id).eq('following_id', targetUserId);
    } else {
      await supabase.from('user_follows').insert({ follower_id: user!.id, following_id: targetUserId });
    }
    setIsFollowing(!isFollowing);
  };

  const handleAddToMyList = async (book: Book) => {
    if (addedBooks.has(book.id)) return;
    await supabase.from('books').insert({
      user_id: user!.id,
      title: book.title,
      author: book.author,
      status: 'to_read',
      date_added: new Date().toISOString(),
    });
    setAddedBooks((prev) => new Set(prev).add(book.id));
  };

  if (loading) {
    return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator color={Colors.gold} size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <ArrowLeft size={22} color={Colors.gold} />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(500).delay(80)} style={styles.profileCard}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarText}>{username[0]?.toUpperCase()}</Text>
              </View>
              <Text style={styles.profileTitle}>Książki przeczytane przez:</Text>
              <Text style={styles.username}>{username}</Text>
              <Text style={styles.bookCount}>{books.length} {books.length === 1 ? 'książka' : 'książek'} przeczytanych</Text>

              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followBtnActive]}
                onPress={toggleFollow}
              >
                {isFollowing
                  ? <UserMinus size={16} color={Colors.error} />
                  : <UserPlus size={16} color={Colors.bg} />}
                <Text style={[styles.followBtnText, isFollowing && { color: Colors.error }]}>
                  {isFollowing ? 'Przestań obserwować' : 'Obserwuj'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.sectionTitle}>Przeczytane książki</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Ten użytkownik nie przeczytał jeszcze żadnych książek.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInRight.duration(400).delay(index * 60)}>
            <View style={styles.bookCard}>
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
                <StarRow rating={item.rating} />
                <Text style={styles.bookDate}>{new Date(item.date_added).toLocaleDateString('pl-PL')}</Text>
              </View>
              <TouchableOpacity
                style={[styles.addBtn, addedBooks.has(item.id) && styles.addBtnDone]}
                onPress={() => handleAddToMyList(item)}
                disabled={addedBooks.has(item.id)}
              >
                <BookPlus size={16} color={addedBooks.has(item.id) ? Colors.success : Colors.gold} />
                <Text style={[styles.addBtnText, addedBooks.has(item.id) && { color: Colors.success }]}>
                  {addedBooks.has(item.id) ? 'Dodano!' : 'Dodaj'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  listContent: { padding: Spacing.lg, paddingTop: 56, paddingBottom: 100 },
  header: { marginBottom: Spacing.md },
  backBtn: { padding: Spacing.sm, backgroundColor: Colors.bgCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignSelf: 'flex-start' },
  profileCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarLarge: {
    width: 72, height: 72, borderRadius: 0,
    backgroundColor: Colors.bgAccent,
    borderWidth: 2, borderColor: Colors.gold,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: { color: Colors.gold, fontSize: FontSize.xxl, fontWeight: '700' },
  profileTitle: { fontSize: FontSize.sm, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  username: { fontSize: FontSize.xl, color: Colors.gold, fontWeight: '700', marginTop: 4 },
  bookCount: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4, marginBottom: Spacing.md },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 11,
    borderRadius: Radius.md,
  },
  followBtnActive: { backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.error },
  followBtnText: { color: Colors.bg, fontWeight: '700', fontSize: FontSize.sm },
  sectionTitle: { fontSize: FontSize.lg, color: Colors.gold, fontWeight: '700', marginBottom: Spacing.md },
  bookCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: FontSize.md, color: Colors.cream, fontWeight: '700', lineHeight: 20 },
  bookAuthor: { fontSize: FontSize.sm, color: Colors.goldDim, marginTop: 2, marginBottom: 4 },
  bookDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  addBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.bgAccent,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: 10,
    minWidth: 64,
  },
  addBtnDone: { borderColor: Colors.success },
  addBtnText: { color: Colors.gold, fontSize: FontSize.xs, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md, textAlign: 'center', lineHeight: 22 },
});
