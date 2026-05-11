import { useRouter } from 'expo-router';
import { ChevronDown, Star } from 'lucide-react-native';
import { useState } from 'react';
import {
    ActivityIndicator, KeyboardAvoidingView, Platform,
    ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { BookStatus, supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const STATUS_OPTIONS: Array<{ value: BookStatus; label: string }> = [
  { value: 'to_read', label: 'Chcę przeczytać' },
  { value: 'reading', label: 'Czytam teraz' },
  { value: 'finished', label: 'Przeczytana' },
];

function StarRating({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <View style={sr.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity key={i} onPress={() => !disabled && onChange(i)} activeOpacity={disabled ? 1 : 0.7} disabled={disabled}>
          <Star
            size={36}
            color={i <= value ? Colors.star : Colors.starEmpty}
            fill={i <= value ? Colors.star : Colors.starEmpty}
            style={{ opacity: disabled ? 0.4 : 1 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const sr = StyleSheet.create({ row: { flexDirection: 'row', gap: 8, marginTop: 4 } });

export default function AddBookScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<BookStatus>('to_read');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const handleAdd = async () => {
    if (!title.trim() || !author.trim()) { setError('Tytuł i autor są wymagane.'); return; }
    setLoading(true);
    setError('');

    const { error } = await supabase.from('books').insert({
      user_id: user!.id,
      title: title.trim(),
      author: author.trim(),
      status,
      rating: status === 'finished' && rating > 0 ? rating : null,
      notes: notes.trim() || null,
      date_added: new Date().toISOString(),
    });

    if (error) {
      setError(error.message);
    } else {
      setTitle(''); setAuthor(''); setStatus('to_read'); setRating(0); setNotes('');
      router.push('/(main)/books');
    }
    setLoading(false);
  };

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === status)!;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.header}>Dodaj Książkę</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(80)} style={styles.card}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Tytuł *</Text>
          <TextInput
            style={styles.input}
            placeholder="Wpisz tytuł..."
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Autor *</Text>
          <TextInput
            style={styles.input}
            placeholder="Imię i nazwisko autora..."
            placeholderTextColor={Colors.textMuted}
            value={author}
            onChangeText={setAuthor}
          />

          <Text style={styles.label}>Status</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowStatusPicker(!showStatusPicker)}>
            <Text style={styles.pickerText}>{currentStatus.label}</Text>
            <ChevronDown size={18} color={Colors.goldDim} />
          </TouchableOpacity>
          {showStatusPicker && (
            <View style={styles.pickerDropdown}>
              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.pickerOption, status === opt.value && styles.pickerOptionActive]}
                  onPress={() => { setStatus(opt.value); setShowStatusPicker(false); }}
                >
                  <Text style={[styles.pickerOptionText, status === opt.value && styles.pickerOptionTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Ocena</Text>
          <StarRating value={status === 'finished' ? rating : 0} onChange={setRating} disabled={status !== 'finished'} />
          {status !== 'finished' && (
            <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 8 }}>
              Możesz ocenić książkę tylko jeśli status to "Przeczytana".
            </Text>
          )}
          {status === 'finished' && rating > 0 && (
            <TouchableOpacity onPress={() => setRating(0)}>
              <Text style={styles.clearRating}>Wyczyść ocenę</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.label, { marginTop: Spacing.md }]}>Notatki</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Twoje przemyślenia..."
            placeholderTextColor={Colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.btn} onPress={handleAdd} disabled={loading}>
            {loading
              ? <ActivityIndicator color={Colors.bg} />
              : <Text style={styles.btnText}>Dodaj do biblioteki</Text>}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingTop: 56, paddingBottom: 100 },
  header: { fontSize: FontSize.xxl, color: Colors.gold, fontWeight: '700', marginBottom: Spacing.lg, letterSpacing: 1 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  error: { color: Colors.error, fontSize: FontSize.sm, marginBottom: Spacing.md, textAlign: 'center' },
  label: { color: Colors.goldDim, fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    fontSize: FontSize.md,
  },
  textarea: { minHeight: 100, paddingTop: 13 },
  picker: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: { color: Colors.text, fontSize: FontSize.md },
  pickerDropdown: {
    backgroundColor: Colors.bgAccent,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  pickerOption: { paddingHorizontal: Spacing.md, paddingVertical: 13 },
  pickerOptionActive: { backgroundColor: Colors.bgInput },
  pickerOptionText: { color: Colors.textMuted, fontSize: FontSize.md },
  pickerOptionTextActive: { color: Colors.gold, fontWeight: '700' },
  clearRating: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 6 },
  btn: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  btnText: { color: Colors.bg, fontWeight: '700', fontSize: FontSize.md, letterSpacing: 1 },
});
