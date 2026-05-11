import { useRouter } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !username) { setError('Uzupełnij wszystkie pola.'); return; }
    if (username.length < 3) { setError('Nazwa użytkownika musi mieć min. 3 znaki.'); return; }
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) {
      setError(error.message);
    } else if (data.user) {
      // Utwórz profil w tabeli profiles
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username,
      });
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <View style={[styles.flex, { justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }]}>
        <Text style={styles.successTitle}>Konto utworzone!</Text>
        <Text style={styles.successSub}>Sprawdź skrzynkę email, aby potwierdzić rejestrację.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.btnText}>Idź do logowania</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.shell}>
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.heroPanel}>
            <View style={styles.heroTopRow}>
              <View style={styles.iconFrame}>
                <UserPlus size={30} color={Colors.gold} />
              </View>
              <Text style={styles.eyebrow}>Dołącz do czytelników</Text>
            </View>
            <Text style={styles.appName}>Nowe konto</Text>
            <Text style={styles.heroCopy}>Załóż profil, dodawaj książki i śledź, co czytają inni użytkownicy.</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(250)} style={styles.card}>
            <View style={styles.sectionLead} />
          <Text style={styles.title}>Zarejestruj się</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Nazwa użytkownika"
            placeholderTextColor={Colors.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Hasło (min. 6 znaków)"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color={Colors.bg} />
              : <Text style={styles.btnText}>Zarejestruj</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.link}>
            <Text style={styles.linkText}>Masz już konto? <Text style={styles.linkBold}>Zaloguj się</Text></Text>
          </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg, paddingVertical: Spacing.xl },
  shell: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: Spacing.md },
  heroPanel: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  iconFrame: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.gold,
    backgroundColor: Colors.bgAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyebrow: { color: Colors.goldDim, fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  appName: { fontSize: 34, color: Colors.gold, fontWeight: '800', letterSpacing: 1.5, lineHeight: 38 },
  heroCopy: { marginTop: Spacing.sm, color: Colors.textMuted, fontSize: FontSize.md, lineHeight: 22, maxWidth: 460 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionLead: { height: 4, width: 72, backgroundColor: Colors.gold, marginBottom: Spacing.md },
  title: { fontSize: FontSize.xl, color: Colors.cream, fontWeight: '800', marginBottom: Spacing.lg, textAlign: 'left' },
  error: { color: Colors.error, fontSize: FontSize.sm, marginBottom: Spacing.md, textAlign: 'center' },
  successTitle: { fontSize: FontSize.xl, color: Colors.gold, fontWeight: '700', marginBottom: Spacing.md, textAlign: 'center' },
  successSub: { color: Colors.textMuted, fontSize: FontSize.md, textAlign: 'center', marginBottom: Spacing.xl },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: FontSize.md,
    marginBottom: Spacing.md,
  },
  btn: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  btnText: { color: Colors.bg, fontWeight: '700', fontSize: FontSize.md, letterSpacing: 1 },
  link: { marginTop: Spacing.lg, alignItems: 'center' },
  linkText: { color: Colors.textMuted, fontSize: FontSize.sm },
  linkBold: { color: Colors.gold, fontWeight: '700' },
});
