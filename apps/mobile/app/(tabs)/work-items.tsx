import { View, Text, StyleSheet } from 'react-native';

export default function WorkItemsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tasks</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f9fafb' },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 48 },
});
