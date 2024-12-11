import React, {useState, useRef} from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {useUser} from '../components/UserContext';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import CustomStatusBar from '../components/CustomStatusBar';

const {width, height} = Dimensions.get('window');

const SignUpScreen = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // Add error state
  const navigation = useNavigation();
  const {setUser} = useUser();

  const [borderColor, setBorderColor] = useState({
    firstName: '#ccc',
    lastName: '#ccc',
    email: '#ccc',
    password: '#ccc',
  });

  // Create refs for input fields
  const lastNameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const handleFocus = field => {
    setBorderColor({...borderColor, [field]: '#00796b'});
  };

  const handleBlur = field => {
    setBorderColor({...borderColor, [field]: '#ccc'});
  };

  const handleSignUp = async () => {
    setError(''); // Clear any previous error
    setLoading(true);
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );
      const user = userCredential.user;

      await user.updateProfile({
        displayName: `${firstName} ${lastName}`,
      });

      const userData = {
        name: `${firstName} ${lastName}`,
        email: user.email,
        userId: user.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore()
        .collection('users')
        .doc(user.uid)
        .set(userData, {merge: true});
      setUser(userData);
      navigation.navigate('AvatarScreen', {userId: user.uid});
    } catch (error) {
      console.log('Error code:', error.code); // Logs Firebase error code
      console.log('Error message:', error.message); // Logs Firebase error message
      console.log('Error stack:', error.stack); // Logs the error stack trace (useful for debugging)

      setError(error.message); // Set error message to display
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomStatusBar statusBgColor="#00796b">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Icon name="arrow-back" size={24} color="#00796b" />
          </TouchableOpacity>
          <Text style={styles.title}>Sign Up</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}>
          <Image
            source={require('../assets/illustration/SignUp.png')}
            style={styles.illustration}
          />

          <View style={styles.textcontainer}>
            <Text style={styles.welcomeText}>Let's get started</Text>
            <Text style={styles.subText}>
              Create an account to use all features
            </Text>
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text> // Display error message if present
          ) : null}

          <TextInput
            style={[styles.input, {borderColor: borderColor.firstName}]}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
            onFocus={() => handleFocus('firstName')}
            onBlur={() => handleBlur('firstName')}
            placeholderTextColor="#aaa"
            returnKeyType="next"
            onSubmitEditing={() => lastNameInputRef.current.focus()}
          />

          <TextInput
            ref={lastNameInputRef}
            style={[styles.input, {borderColor: borderColor.lastName}]}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
            onFocus={() => handleFocus('lastName')}
            onBlur={() => handleBlur('lastName')}
            placeholderTextColor="#aaa"
            returnKeyType="next"
            onSubmitEditing={() => emailInputRef.current.focus()}
          />

          <TextInput
            ref={emailInputRef} // Attach ref
            style={[styles.input, {borderColor: borderColor.email}]}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            onFocus={() => handleFocus('email')}
            onBlur={() => handleBlur('email')}
            placeholderTextColor="#aaa"
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current.focus()}
          />

          <View
            style={[
              styles.passwordContainer,
              {borderColor: borderColor.password},
            ]}>
            <TextInput
              ref={passwordInputRef} // Attach ref
              style={styles.passwordInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              onFocus={() => handleFocus('password')}
              onBlur={() => handleBlur('password')}
              placeholderTextColor="#aaa"
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
              style={styles.eyeButton}>
              <Icon
                name={passwordVisible ? 'eye' : 'eye-off'}
                size={24}
                color="#00796b"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSignUp}
            style={styles.signupButton}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signupButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signUpContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.loginButtonText}> Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </CustomStatusBar>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: width * 0.05,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  title: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  illustration: {
    width: '100%',
    height: height * 0.2,
    resizeMode: 'contain',
    marginBottom: height * 0.02,
  },
  textcontainer: {
    marginBottom: height * 0.02,
    alignSelf: 'flex-start',
  },
  welcomeText: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#000',
  },
  subText: {
    fontSize: width * 0.045,
    color: '#666',
  },
  input: {
    height: height * 0.06,
    borderWidth: 1,
    borderRadius: width * 0.02,
    paddingHorizontal: width * 0.03,
    marginBottom: height * 0.02,
    width: '100%',
    color: '#000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: width * 0.02,
    marginBottom: height * 0.02,
    width: '100%',
  },
  passwordInput: {
    flex: 1,
    height: height * 0.06,
    paddingHorizontal: width * 0.03,
    color: '#000',
  },
  eyeButton: {
    padding: width * 0.03,
  },
  signupButton: {
    backgroundColor: '#00796b',
    height: height * 0.07,
    borderRadius: width * 0.02,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  signupButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.045,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: height * 0.015,
  },
  loginText: {
    color: '#333',
    fontSize: width * 0.04,
  },
  loginButtonText: {
    color: '#00796b',
    fontWeight: 'bold',
    fontSize: width * 0.045,
  },
  errorText: {
    color: 'red',
    marginBottom: height * 0.01,
    textAlign: 'center',
    fontSize: width * 0.04,
  },
});

export default SignUpScreen;
