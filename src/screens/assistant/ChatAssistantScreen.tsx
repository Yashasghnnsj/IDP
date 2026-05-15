import React, { useState } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView } from 'react-native';
import { Text, TextInput, IconButton, Surface } from 'react-native-paper';
import { Colors } from '../../theme';

type Message = { id: string; text: string; sender: 'user' | 'ai' };

const suggestions = [
  "What is COPD?",
  "How to improve breathing?",
  "What does wheezing mean?",
  "Explain my last result",
];

export default function ChatAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello! I am your respiratory AI assistant. How can I help?', sender: 'ai' },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate AI reply
    setTimeout(() => {
      const aiReply: Message = {
        id: Date.now().toString(),
        text: `You asked about "${text}". Here's some helpful information...`,
        sender: 'ai',
      };
      setMessages(prev => [...prev, aiReply]);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Surface style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text>{item.text}</Text>
          </Surface>
        )}
        style={styles.messages}
      />
      <View style={styles.suggestions}>
        {suggestions.map(s => (
          <Text key={s} style={styles.suggestionChip} onPress={() => sendMessage(s)}>{s}</Text>
        ))}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask anything..."
          style={styles.textInput}
          right={<TextInput.Icon icon="microphone" onPress={() => {/* voice input */}} />}
        />
        <IconButton icon="send" onPress={() => sendMessage(input)} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  messages: { flex: 1, paddingHorizontal: 15 },
  bubble: { padding: 12, borderRadius: 18, marginVertical: 5, maxWidth: '80%', elevation: 1 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary + '20' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#FFF' },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', padding: 10 },
  suggestionChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    margin: 4,
    fontSize: 13,
    color: Colors.primary,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  textInput: { flex: 1, backgroundColor: '#FFF', borderRadius: 25 },
});