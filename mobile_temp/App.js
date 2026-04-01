import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import axios from 'axios';
import { Mic, Send, Settings, User } from 'lucide-react-native';

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am SANKEYTHIKA. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [serverStatus, setServerStatus] = useState('Offline');
  
  // Connect to PC Backend (Replace with local IP for real device)
  const BACKEND_URL = 'http://10.0.2.2:8000'; // Standard Android Emulator IP

  useEffect(() => {
    // Check server connection
    axios.get(`${BACKEND_URL}/`)
      .then(() => setServerStatus('Online'))
      .catch((e) => {
        console.log("Server not found, switching to local mode", e);
        setServerStatus('Local');
      });
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      if (serverStatus === 'Online') {
        const response = await axios.post(`${BACKEND_URL}/chat`, {
          message: input
        });
        setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
      } else {
        // Simple local fallback for mobile offline
        setMessages(prev => [...prev, { role: 'assistant', content: "Mobile Fallback: Hello! I'm currently offline." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: Connection failed." }]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SANKEYTHIKA AI</Text>
        <Text style={[styles.status, serverStatus === 'Online' ? styles.online : styles.offline]}>
          {serverStatus}
        </Text>
      </View>

      <ScrollView style={styles.chatArea}>
        {messages.map((m, i) => (
          <View key={i} style={[styles.msg, m.role === 'user' ? styles.userMsg : styles.aiMsg]}>
            <Text style={styles.msgText}>{m.content}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputArea}>
        <TouchableOpacity style={styles.iconBtn}>
          <Mic size={24} color="#ccc" />
        </TouchableOpacity>
        <TextInput 
          style={styles.input} 
          value={input} 
          onChangeText={setInput}
          placeholder="Ask me anything..." 
          placeholderTextColor="#666"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Send size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 12,
  },
  online: { color: '#2ecc71' },
  offline: { color: '#e74c3c' },
  chatArea: {
    flex: 1,
    padding: 15,
  },
  msg: {
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
    maxWidth: '85%',
  },
  userMsg: {
    alignSelf: 'flex-end',
    backgroundColor: '#3498db',
  },
  aiMsg: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderBottomColor: '#333',
  },
  msgText: {
    color: '#fff',
  },
  inputArea: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  input: {
    flex: 1,
    height: 45,
    color: '#fff',
    backgroundColor: '#222',
    borderRadius: 22,
    paddingHorizontal: 15,
    marginHorizontal: 10,
  },
  iconBtn: {
    padding: 5,
  },
  sendBtn: {
    backgroundColor: '#3498db',
    width: 45,
    height: 45,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
