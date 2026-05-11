import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LogOut, Search, Star } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { Book, BookStatus, supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const STATUS_LABELS: Record<BookStatus | 'all', string> = {
  all: 'Wszystkie',
  to_read: 'Chcę przeczytać',
  reading: 'Czytam',
  finished: 'Przeczytane',
};

const FILTERS: Array<BookStatus | 'all'> = ['all', 'to_read', 'reading', 'finished'];

function StarRow({ rating }: { rating: number | null }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2, marginTop: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          color={rating && i <= rating ? Colors.star : Colors.starEmpty}
          fill={rating && i <= rating ? Colors.star : Colors.starEmpty}
        />
      ))}
    </View>
  );
}

function BookCard({ book, index, onStatusChange }: { book: Book; index: number; onStatusChange: (id: string, status: BookStatus) => void }) {
  const router = useRouter();
  const statusLabel = STATUS_LABELS[book.status];
  const statusColor = book.status === 'finished' ? Colors.success : book.status === 'reading' ? Colors.star : Colors.textMuted;
  const [showStatus, setShowStatus] = useState(false);

  const handleStatusPress = (e: any) => {
    e.stopPropagation();
    setShowStatus((v) => !v);
  };

  const handleStatusChange = (newStatus: BookStatus, e: any) => {
    e.stopPropagation();
    onStatusChange(book.id, newStatus);
    setShowStatus(false);
  };

  return (
    <Animated.View entering={FadeInRight.duration(400).delay(index * 60)}>
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: statusColor }]}
        onPress={() => router.push(`/book/${book.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
            <Text style={styles.bookAuthor} numberOfLines={1}>{book.author}</Text>
            <StarRow rating={book.rating} />
          </View>
          <View style={styles.cardRight}>
            <TouchableOpacity
              style={[styles.statusBadge, { borderColor: statusColor }]}
              onPress={handleStatusPress}
              activeOpacity={0.7}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </TouchableOpacity>
            {showStatus && (
              <View style={{ position: 'absolute', top: 32, right: 0, backgroundColor: Colors.bgCard, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, padding: 4, zIndex: 10, minWidth: 150 }}>
                {['to_read', 'reading', 'finished'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={{ paddingVertical: 6, paddingHorizontal: 10, backgroundColor: book.status === status ? Colors.gold : 'transparent', borderRadius: 6, marginBottom: status === 'finished' ? 0 : 4 }}
                    onPress={(e) => handleStatusChange(status as BookStatus, e)}
                  >
                    <Text style={[styles.statusText, { color: book.status === status ? Colors.bg : Colors.text, fontSize: FontSize.sm }]}>{STATUS_LABELS[status]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={styles.dateText}>
              {new Date(book.date_added).toLocaleDateString('pl-PL')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function BooksScreen() {
    // Zmiana statusu książki
    const handleStatusChange = async (id: string, status: BookStatus) => {
      await supabase.from('books').update({ status }).eq('id', id);
      setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    };
  const { width } = useWindowDimensions();
  const isWide = width >= 600;
  const { user } = useAuthStore();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<BookStatus | 'all'>('all');

  const fetchBooks = useCallback(async () => {
    if (!user) return;
    let query = supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('date_added', { ascending: false });

    if (filter !== 'all') query = query.eq('status', filter);

    const { data } = await query;
    setBooks(data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [user, filter]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const thisYear = new Date().getFullYear();
  const readThisYear = books.filter(
    (b) => b.status === 'finished' && new Date(b.date_added).getFullYear() === thisYear
  ).length;

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.shell}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.heroPanel}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.eyebrow}>Książki</Text>
              <Text style={[styles.headerTitle, isWide && { fontSize: 42 }]}>Moja Biblioteka</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Image
                source={require('../../assets/images/rat-dancing-meme.gif')}
                style={{ width: isWide ? 72 : 52, height: isWide ? 72 : 52 }}
                contentFit="contain"
              />
              <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <LogOut size={20} color={Colors.goldDim} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              Przeczytane w {thisYear}: <Text style={styles.counterNum}>{readThisYear}</Text>
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.surface}>
          <View style={styles.searchBox}>
            <Search size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Szukaj tytułu lub autora..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <FlatList
            data={FILTERS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterBtn, filter === item && styles.filterBtnActive]}
                onPress={() => setFilter(item)}
              >
                <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                  {STATUS_LABELS[item]}
                </Text>
              </TouchableOpacity>
            )}
          />
        </Animated.View>

      {loading ? (
        <ActivityIndicator color={Colors.gold} style={{ flex: 1 }} />
      ) : (
        <FlatList
          key={isWide ? 'wide' : 'narrow'}
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={isWide ? 2 : 1}
          columnWrapperStyle={isWide ? { gap: Spacing.md, paddingHorizontal: Spacing.lg } : undefined}
          contentContainerStyle={[styles.list, !isWide && { paddingHorizontal: Spacing.lg }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchBooks(); }}
              tintColor={Colors.gold}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Brak książek w tej kategorii.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={isWide ? { flex: 1 } : undefined}>
              <BookCard book={item} index={index} onStatusChange={handleStatusChange} />
            </View>
          )}
        />
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  shell: { flex: 1, width: '100%', maxWidth: 920, alignSelf: 'center', paddingBottom: 100 },
  heroPanel: { paddingTop: 56, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  surface: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: Colors.goldDim, fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  headerTitle: { fontSize: 32, color: Colors.gold, fontWeight: '800', letterSpacing: 1 },
  logoutBtn: { padding: Spacing.sm },
  counterBadge: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  counterText: { color: Colors.textMuted, fontSize: FontSize.sm },
  counterNum: { color: Colors.gold, fontWeight: '700' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: FontSize.md },
  filterList: { gap: Spacing.sm, paddingTop: Spacing.md },
  filterBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xl,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  filterText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  filterTextActive: { color: Colors.bg },
  list: { paddingTop: Spacing.sm, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    borderLeftWidth: 4,
  },
  cardContent: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.md },
  cardLeft: { flex: 1 },
  cardRight: { alignItems: 'flex-end', justifyContent: 'space-between', minWidth: 90 },
  bookTitle: { fontSize: FontSize.lg, color: Colors.cream, fontWeight: '800', lineHeight: 24 },
  bookAuthor: { fontSize: FontSize.sm, color: Colors.goldDim, marginTop: 4, lineHeight: 18 },
  statusBadge: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: Spacing.md,
  },
  statusText: { fontSize: FontSize.xs, fontWeight: '600' },
  dateText: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', marginTop: 60 },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md },
});
