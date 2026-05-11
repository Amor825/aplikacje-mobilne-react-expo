import { BarChart3, BookMarked, BookOpen, CheckCircle, Star, TrendingUp } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView, StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { Book, supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

function StatCard({
  icon, label, value, delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  delay?: number;
}) {
  return (
    <Animated.View entering={FadeInRight.duration(500).delay(delay)} style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

export default function StatisticsScreen() {
  const { user } = useAuthStore();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setBooks(data ?? []);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  const thisYear = new Date().getFullYear();
  const finished = books.filter((b) => b.status === 'finished');
  const reading = books.filter((b) => b.status === 'reading');
  const toRead = books.filter((b) => b.status === 'to_read');
  const finishedThisYear = finished.filter((b) => new Date(b.date_added).getFullYear() === thisYear);

  const rated = finished.filter((b) => b.rating !== null);
  const avgRating = rated.length
    ? (rated.reduce((acc, b) => acc + (b.rating ?? 0), 0) / rated.length).toFixed(1)
    : '—';

  const topBook = rated.length
    ? rated.reduce((best, b) => ((b.rating ?? 0) > (best.rating ?? 0) ? b : best), rated[0])
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.duration(500)}>
        <View style={styles.headerRow}>
          <BarChart3 size={28} color={Colors.gold} />
          <Text style={styles.header}>Statystyki</Text>
        </View>
      </Animated.View>

      <View style={styles.grid}>
        <StatCard icon={<BookMarked size={22} color={Colors.gold} />} label="Wszystkich książek" value={books.length} delay={80} />
        <StatCard icon={<CheckCircle size={22} color={Colors.success} />} label="Przeczytanych" value={finished.length} delay={140} />
        <StatCard icon={<TrendingUp size={22} color={Colors.star} />} label={`Przeczytane ${thisYear}`} value={finishedThisYear.length} delay={200} />
        <StatCard icon={<BookOpen size={22} color={Colors.goldDim} />} label="Czytam teraz" value={reading.length} delay={260} />
        <StatCard icon={<Star size={22} color={Colors.star} />} label="Średnia ocena" value={`${avgRating}${avgRating !== '—' ? '/5' : ''}`} delay={320} />
        <StatCard icon={<BookMarked size={22} color={Colors.textMuted} />} label="Chcę przeczytać" value={toRead.length} delay={380} />
      </View>

      <Animated.View entering={FadeInDown.duration(500).delay(440)} style={styles.section}>
        <Text style={styles.sectionTitle}>Podział według statusu</Text>
        {[
          { label: 'Chcę przeczytać', count: toRead.length, color: Colors.textMuted },
          { label: 'Czytam teraz', count: reading.length, color: Colors.star },
          { label: 'Przeczytane', count: finished.length, color: Colors.success },
        ].map((item) => (
          <View key={item.label} style={styles.barRow}>
            <Text style={styles.barLabel}>{item.label}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: item.color,
                    width: books.length > 0 ? `${Math.round((item.count / books.length) * 100)}%` : '0%',
                  },
                ]}
              />
            </View>
            <Text style={[styles.barCount, { color: item.color }]}>{item.count}</Text>
          </View>
        ))}
      </Animated.View>

      {topBook && (
        <Animated.View entering={FadeInDown.duration(500).delay(560)} style={styles.topBook}>
          <Text style={styles.sectionTitle}>Najwyżej oceniona</Text>
          <Text style={styles.topTitle}>{topBook.title}</Text>
          <Text style={styles.topAuthor}>{topBook.author}</Text>
          <View style={{ flexDirection: 'row', gap: 4, marginTop: 8 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={18}
                color={topBook.rating && i <= topBook.rating ? Colors.star : Colors.starEmpty}
                fill={topBook.rating && i <= topBook.rating ? Colors.star : Colors.starEmpty}
              />
            ))}
          </View>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingTop: 56, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  header: { fontSize: FontSize.xxl, color: Colors.gold, fontWeight: '700', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg },
  statCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    width: '47%',
    minHeight: 110,
    justifyContent: 'center',
  },
  statIcon: { marginBottom: Spacing.sm },
  statValue: { fontSize: FontSize.xxl, color: Colors.gold, fontWeight: '700' },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  section: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: { fontSize: FontSize.md, color: Colors.gold, fontWeight: '700', marginBottom: Spacing.md },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  barLabel: { color: Colors.textMuted, fontSize: FontSize.xs, width: 110 },
  barTrack: { flex: 1, height: 8, backgroundColor: Colors.bgInput, borderRadius: 0, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 0 },
  barCount: { fontSize: FontSize.sm, fontWeight: '700', width: 28, textAlign: 'right' },
  topBook: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  topTitle: { fontSize: FontSize.lg, color: Colors.cream, fontWeight: '700' },
  topAuthor: { fontSize: FontSize.sm, color: Colors.goldDim, marginTop: 4 },
});
