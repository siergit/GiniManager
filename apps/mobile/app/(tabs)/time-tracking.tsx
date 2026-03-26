import { View, Text, StyleSheet } from 'react-native';

export default function TimeTrackingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Time Tracking</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f9fafb' },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 48 },
});
