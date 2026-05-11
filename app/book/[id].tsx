import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Pencil, Star, Trash2, UserMinus, UserPlus, Users } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { Book, supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const STATUS_LABELS: Record<string, string> = {
  to_read: 'Chcę przeczytać',
  reading: 'Czytam',
  finished: 'Przeczytana',
};

function StarRow({ rating, size = 16, onRate, disabled = false }: { rating: number | null; size?: number; onRate?: (r: number) => void; disabled?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity
          key={i}
          onPress={() => onRate && !disabled && onRate(i)}
          activeOpacity={disabled ? 1 : 0.7}
          disabled={disabled}
          style={{ opacity: disabled ? 0.4 : 1 }}
        >
          <Star size={size} color={rating && i <= rating ? Colors.star : Colors.starEmpty} fill={rating && i <= rating ? Colors.star : Colors.starEmpty} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

interface OtherReader {
  user_id: string;
  username: string;
  rating: number | null;
  date_added: string;
}

export default function BookDetailsScreen() {
  // ...existing code...
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();

  const [book, setBook] = useState<Book | null>(null);
  const [others, setOthers] = useState<OtherReader[]>([]);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [ratingLoading, setRatingLoading] = useState(false);
  // Funkcja do oceniania książki
  const handleRate = async (newRating: number) => {
    if (!book || book.status !== 'finished' || ratingLoading) return;
    setRatingLoading(true);
    const { error } = await supabase.from('books').update({ rating: newRating }).eq('id', book.id).eq('user_id', user!.id);
    if (!error) {
      setBook({ ...book, rating: newRating });
    }
    setRatingLoading(false);
  };

  const fetchData = useCallback(async () => {
    if (!user || !id) return;

    const [{ data: bookData }, { data: followsData }] = await Promise.all([
      supabase.from('books').select('*').eq('id', id).single(),
      supabase.from('user_follows').select('following_id').eq('follower_id', user.id),
    ]);

    setBook(bookData ?? null);

    if (bookData) {
      const { data: sameBooks } = await supabase
        .from('books')
        .select('user_id, rating, date_added')
        .eq('title', bookData.title)
        .eq('author', bookData.author)
        .eq('status', 'finished')
        .neq('user_id', user.id);

      if (sameBooks && sameBooks.length > 0) {
        const userIds = sameBooks.map((b: any) => b.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);

        const profileMap = new Map(
          (profilesData ?? []).map((p: any) => [p.id, p.username])
        );

        setOthers(
          sameBooks.map((r: any) => ({
            user_id: r.user_id,
            username: profileMap.get(r.user_id) ?? 'Nieznany',
            rating: r.rating,
            date_added: r.date_added,
          }))
        );
      } else {
        setOthers([]);
      }
    }

    setFollowed(new Set((followsData ?? []).map((f: any) => f.following_id)));
    setLoading(false);
  }, [user, id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleFollow = async (targetId: string) => {
    if (!user) return;
    if (followed.has(targetId)) {
      await supabase.from('user_follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
      setFollowed((prev) => { const next = new Set(prev); next.delete(targetId); return next; });
    } else {
      await supabase.from('user_follows').insert({ follower_id: user.id, following_id: targetId });
      setFollowed((prev) => new Set(prev).add(targetId));
    }
  };

  const handleDelete = () => {
    Alert.alert('Usuń książkę', 'Czy na pewno chcesz usunąć tę książkę?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń', style: 'destructive', onPress: async () => {
          if (!user) return;
          const { error, count } = await supabase
            .from('books')
            .delete({ count: 'exact' })
            .eq('id', id)
            .eq('user_id', user.id);
          if (error) {
            Alert.alert('Błąd usuwania', error.message);
          } else if (count === 0) {
            Alert.alert('Błąd', 'Brak uprawnień do usunięcia tej książki.\n\nSprawdź polityki RLS w Supabase (tabela books, operacja DELETE).');
          } else {
            router.back();
          }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator color={Colors.gold} size="large" /></View>;
  }

  if (!book) {
    return <View style={styles.container}><Text style={{ color: Colors.error, padding: 24 }}>Nie znaleziono książki.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} style={{ width: '100%' }}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.gold} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Szczegóły</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => router.push(`/book/edit/${id}`)} style={styles.backBtn}>
              <Pencil size={18} color={Colors.gold} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.backBtn}>
              <Trash2 size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Book info card */}
        <Animated.View entering={FadeInDown.duration(500).delay(80)} style={styles.bookCard}>
          <View style={styles.bookTopBar} />
          <Text style={styles.bookTitle}>{book.title}</Text>
          <Text style={styles.bookAuthor}>{book.author}</Text>

          <View style={styles.metaRow}>
            <View style={[styles.badge, { borderColor: book.status === 'finished' ? Colors.success : book.status === 'reading' ? Colors.star : Colors.textMuted }]}>
              <Text style={[styles.badgeText, { color: book.status === 'finished' ? Colors.success : book.status === 'reading' ? Colors.star : Colors.textMuted }]}> 
                {STATUS_LABELS[book.status]}
              </Text>
            </View>
            <Text style={styles.date}>{new Date(book.date_added).toLocaleDateString('pl-PL')}</Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.sectionLabel}>Status</Text>
              <Text style={styles.summaryValue}>{STATUS_LABELS[book.status]}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.sectionLabel}>Dodano</Text>
              <Text style={styles.summaryValue}>{new Date(book.date_added).toLocaleDateString('pl-PL')}</Text>
            </View>
          </View>

          <View style={styles.ratingBlock}>
            <Text style={styles.sectionLabel}>Twoja ocena</Text>
            <StarRow
              rating={book.status === 'finished' ? book.rating : null}
              size={28}
              onRate={book.status === 'finished' ? handleRate : undefined}
              disabled={book.status !== 'finished' || ratingLoading}
            />
            {book.status !== 'finished' && (
              <Text style={{ color: Colors.textMuted, fontSize: 12, marginTop: 6, textAlign: 'center' }}>
                Możesz ocenić książkę dopiero po jej przeczytaniu.
              </Text>
            )}
          </View>

          {book.notes && (
            <View style={styles.notesCard}>
              <Text style={styles.sectionLabel}>Opis i notatki</Text>
              <Text style={styles.notes}>{book.notes}</Text>
            </View>
          )}
        </Animated.View>

        {/* Other readers */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.othersSection}>
          <View style={styles.othersHeader}>
            <Users size={18} color={Colors.gold} />
            <Text style={styles.othersTitle}>Inni czytelnicy</Text>
          </View>
          <Text style={styles.othersCount}>
            {others.length > 0
              ? `${others.length} ${others.length === 1 ? 'osoba przeczytała' : 'osób przeczytało'} tę książkę`
              : 'Brak innych czytelników tej książki'}
          </Text>

          {others.map((reader, index) => (
            <Animated.View key={reader.user_id} entering={FadeInRight.duration(400).delay(300 + index * 70)}>
              <View style={styles.readerCard}>
                <TouchableOpacity
                  style={styles.readerInfo}
                  onPress={() => router.push(`/user/${reader.user_id}`)}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(reader.username?.[0] ?? '?').toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.readerName}>{reader.username}</Text>
                    <StarRow rating={reader.rating} size={12} />
                    <Text style={styles.readerDate}>{new Date(reader.date_added).toLocaleDateString('pl-PL')}</Text>
                  </View>
                  <ChevronRight size={16} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.followBtn, followed.has(reader.user_id) && styles.followBtnActive]}
                  onPress={() => toggleFollow(reader.user_id)}
                >
                  {followed.has(reader.user_id)
                    ? <UserMinus size={14} color={Colors.error} />
                    : <UserPlus size={14} color={Colors.gold} />}
                  <Text style={[styles.followBtnText, followed.has(reader.user_id) && { color: Colors.error }]}>
                    {followed.has(reader.user_id) ? 'Przestań obserwować' : 'Obserwuj'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingTop: 56, paddingBottom: 100, width: '100%', maxWidth: 720, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  backBtn: { padding: Spacing.sm, backgroundColor: Colors.bgCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: FontSize.lg, color: Colors.gold, fontWeight: '700' },
  bookCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  bookTopBar: { height: 4, width: 92, backgroundColor: Colors.gold, marginBottom: Spacing.md },
  bookTitle: { fontSize: FontSize.xl, color: Colors.cream, fontWeight: '700', lineHeight: 28 },
  bookAuthor: { fontSize: FontSize.md, color: Colors.goldDim, marginTop: 6, marginBottom: Spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.md },
  badge: { borderWidth: 1, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  date: { color: Colors.textMuted, fontSize: FontSize.xs },
  sectionLabel: { color: Colors.goldDim, fontSize: FontSize.xs, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  summaryGrid: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  summaryItem: { flex: 1, backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  summaryValue: { color: Colors.cream, fontSize: FontSize.sm, fontWeight: '700' },
  ratingBlock: { marginTop: Spacing.lg },
  notesCard: { marginTop: Spacing.lg, backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  notes: { color: Colors.text, fontSize: FontSize.md, lineHeight: 22 },
  othersSection: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  othersHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  othersTitle: { fontSize: FontSize.lg, color: Colors.gold, fontWeight: '700' },
  othersCount: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.md },
  readerCard: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  readerInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 38, height: 38, borderRadius: 0,
    backgroundColor: Colors.bgAccent,
    borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: Colors.gold, fontWeight: '700', fontSize: FontSize.md },
  readerName: { color: Colors.cream, fontWeight: '600', fontSize: FontSize.sm },
  readerDate: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgAccent,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  followBtnActive: { borderColor: Colors.error },
  followBtnText: { color: Colors.gold, fontSize: FontSize.xs, fontWeight: '700' },
});
