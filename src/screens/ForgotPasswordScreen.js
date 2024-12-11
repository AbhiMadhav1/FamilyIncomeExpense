import React, {useState} from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import CustomStatusBar from '../components/CustomStatusBar';

const {width, height} = Dimensions.get('window'); // Get device dimensions

const ForgotPasswordScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageType, setMessageType] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSend = async () => {
    setMessage('');
    setMessageType('');

    if (email === '') {
      setMessage('Please enter your email address.');
      setMessageType('error');
      return;
    }

    if (!emailRegex.test(email)) {
      setMessage('Please enter a valid email address.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);

    try {
      await auth().sendPasswordResetEmail(email);
      setMessage('Password reset email sent successfully! Check your inbox.');
      setMessageType('success');
      setTimeout(() => {
        navigation.navigate('SignIn');
      }, 2000);
    } catch (error) {
      console.error(error);
      setMessage('Failed to send password reset email. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomStatusBar statusBgColor="#00796b">
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#00796b" barStyle="light-content" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Icon name="arrow-back" size={24} color="#00796b" />
          </TouchableOpacity>
          <Text style={styles.title}>Forgot Password</Text>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}>
          <Image
            source={require('../assets/illustration/Forgotpassword.png')}
            style={styles.illustration}
          />

          <View style={styles.textcontainer}>
            <Text style={styles.headerText}>Enter your email address</Text>
            <Text style={styles.subText}>
              Enter your email to reset your password
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Icon
              name="mail-outline"
              size={24}
              color="#00796b"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              placeholderTextColor="#aaa"
              onChangeText={setEmail}
            />
          </View>

          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            disabled={isLoading}>
            <Text style={styles.sendButtonText}>
              {isLoading ? 'Sending...' : 'Send'}
            </Text>
          </TouchableOpacity>

          {message ? (
            <Text
              style={[
                styles.message,
                messageType === 'success'
                  ? styles.successMessage
                  : styles.errorMessage,
              ]}>
              {message}
            </Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </CustomStatusBar>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  illustration: {
    width: '100%',
    height: height * 0.25, // Responsive height based on screen height
    resizeMode: 'contain',
    marginBottom: 20,
  },
  textcontainer: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  headerText: {
    fontSize: width * 0.065, // Responsive font size
    fontWeight: 'bold',
    color: '#333',
  },
  subText: {
    fontSize: width * 0.04,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 18,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  inputIcon: {
    padding: 15,
  },
  input: {
    flex: 1,
    padding: 0,
    borderRadius: 18,
    backgroundColor: '#fff',
  },
  sendButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#00796b',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  sendButtonText: {
    fontSize: width * 0.045, // Responsive font size
    color: '#fff',
    fontWeight: 'bold',
  },
  message: {
    marginTop: 15,
    fontSize: width * 0.04, // Responsive font size
    textAlign: 'center',
  },
  successMessage: {
    color: '#00796b', // Color for success message
  },
  errorMessage: {
    color: '#e74c3c', // Color for error message
  },
  scrollViewContent: {
    paddingBottom: 20,
    alignItems: 'center', // Center content horizontally
  },
});

export default ForgotPasswordScreen;
