import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { RTCView, mediaDevices } from 'react-native-webrtc';
import Icon from '@expo/vector-icons/Ionicons';

const VideoConsultationScreen = ({ navigation }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(false);

  useEffect(() => {
    startCall();
    return () => {
      endCall();
    };
  }, []);

  const startCall = async () => {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setLocalStream(stream);
    setIsCallActive(true);
    // Further implementation for establishing the call
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    setIsCallActive(false);
    navigation.goBack();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      });
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsCameraOn(track.enabled);
      });
    }
  };

  const handleEndCall = () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end the call?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Call', onPress: endCall }
      ]
    );
  };

  const sendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, { id: Date.now().toString(), text: message }]);
      setMessage('');
    }
  };

  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
  };

  return (
    <View style={styles.container}>
      {!isChatVisible && (
        <View style={styles.videoContainer}>
          {localStream && (
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.fullscreenVideo}
              objectFit="cover"
            />
          )}
          {remoteStream && (
            <RTCView
              streamURL={remoteStream.toURL()}
              style={styles.fullscreenVideo}
              objectFit="cover"
            />
          )}
        </View>
      )}
      {isChatVisible && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
        >
          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message"
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
              <Icon name="send" size={24} color="#075eec" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={messages}
            renderItem={({ item }) => <Text style={styles.message}>{item.text}</Text>}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </KeyboardAvoidingView>
      )}
      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleMute} style={styles.controlButton}>
          <Icon name={isMuted ? "mic-off" : "mic"} size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleCamera} style={styles.controlButton}>
          <Icon name={isCameraOn ? "camera" : "camera-off"} size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleChat} style={styles.controlButton}>
          <Icon name="chatbox" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleEndCall} style={styles.controlButton}>
          <Icon name="call" size={24} color="#f00" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#000',
  },
  controlButton: {
    backgroundColor: '#075eec',
    borderRadius: 50,
    padding: 10,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  message: {
    padding: 10,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopColor: '#ddd',
    borderTopWidth: 1,
    padding: 10,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
  },
  sendButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'grey',
  },
});

export default VideoConsultationScreen;
