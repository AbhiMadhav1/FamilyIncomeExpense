import React, {useState, useRef, useEffect} from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import {useUser} from '../components/UserContext';
import firestore from '@react-native-firebase/firestore';
import CustomStatusBar from '../components/CustomStatusBar';
import LinearGradient from 'react-native-linear-gradient';
// import {GoogleSignin, statusCodes} from '@react-native-google-signin/google-signin';

const {width, height} = Dimensions.get('window');

const SignInScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigation = useNavigation();
  const {setUser} = useUser();

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const [borderColor, setBorderColor] = useState({
    email: '#ccc',
    password: '#ccc',
  });

  const handleFocus = field => {
    setBorderColor({...borderColor, [field]: '#00796b'});
  };

  const handleBlur = field => {
    setBorderColor({...borderColor, [field]: '#ccc'});
  };

  const handleSignIn = async () => {
    setLoading(true);
    setEmailError('');
    setPasswordError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !password) {
      if (!email) {
        setEmailError('Email is required.');
      }
      if (!password) {
       
        setPasswordError('Password is required.');
      }
      setLoading(false);
      return;
    }

    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await auth().signInWithEmailAndPassword(
        email,
        password,
      );
      const user = userCredential.user;

      const userDoc = await firestore().collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log('User Data:', userData);
        setUser(userData);
        navigation.navigate('AppDrawer');
      } else {
        setPasswordError('User data not found. Please contact support.');
      }
    } catch (error) {
      console.log('Sign-in error:', error);
      if (error.code === 'auth/user-not-found') {
        setPasswordError('No user found with this email.');
      } else if (error.code === 'auth/wrong-password') {
        setPasswordError('Incorrect password.');
      } else {
        setPasswordError(
          'Sign-in failed. Please check your credentials and try again.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

//   useEffect(() => {
//     GoogleSignin.configure({
//       webClientId:
//         '592719490219-s85cv3cqcb9l5iq8r7glu40eq22oikgu.apps.googleusercontent.com', 
//     });
//   }, []);

//   const handleGoogleSignIn = async () => {
//     try {
//         await GoogleSignin.hasPlayServices();
//         const userInfo = await GoogleSignin.signIn();
//         const { idToken } = userInfo;
//         console.log('userInfo: ', userInfo);

//         // Firebase authentication
//         const googleCredential = auth.GoogleAuthProvider.credential(idToken);
//         const userCredential = await auth().signInWithCredential(googleCredential);

//         console.log('Firebase User:', userCredential.user);
//     } catch (error) {
//         console.error('Google Sign-In Error:', error);
//     }
// };

  
  
  return (
    <CustomStatusBar statusBgColor="#00796b">
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.illustrationContainer}>
            <Image
              source={require('../assets/illustration/SignIn.png')}
              style={styles.illustration}
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.welcomeText}>Welcome!</Text>
            <Text style={styles.subText}>
              Let's login to explore and continue
            </Text>
          </View>

          {/* Email Input */}
          <View style={[styles.inputContainer, {borderColor: '#00796b'}]}>
            <Icon
              name="mail-outline"
              size={24}
              color="#00796b"
              style={styles.icon}
            />
            <TextInput
              ref={emailInputRef}
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              onFocus={() => handleFocus('email')}
              onBlur={() => handleBlur('email')}
              placeholderTextColor="#aaa"
              onSubmitEditing={() => passwordInputRef.current.focus()}
              returnKeyType="next"
            />
          </View>
          {emailError && <Text style={styles.errorText}>{emailError}</Text>}

          {/* Password Input */}
          <View style={[styles.inputContainer, {borderColor: '#00796b'}]}>
            <Icon
              name="lock-closed-outline"
              size={24}
              color="#00796b"
              style={styles.icon}
            />
            <TextInput
              ref={passwordInputRef}
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
              onFocus={() => handleFocus('password')}
              onBlur={() => handleBlur('password')}
              placeholderTextColor="#aaa"
              onSubmitEditing={handleSignIn}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
              style={styles.eyeButton}>
              <Icon
                name={passwordVisible ? 'eye' : 'eye-off'}
                size={20}
                color="#00796b"
              />
            </TouchableOpacity>
          </View>
          {passwordError && (
            <Text style={styles.errorText}>{passwordError}</Text>
          )}

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
          <LinearGradient
            colors={['#00796b', '#20b2aa']}
            style={styles.loginButton}>
            <TouchableOpacity onPress={handleSignIn} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>
          <View style={styles.socialLoginContainer}>
            <LinearGradient
              colors={['#00796b', '#20b2aa']}
              style={styles.socialButton}>
              <TouchableOpacity onPress={""}>
                <Icon name="logo-google" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>
            <LinearGradient
              colors={['#00796b', '#20b2aa']}
              style={styles.socialButton}>
              <TouchableOpacity>
                <Icon name="logo-facebook" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>
          </View>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Create an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </CustomStatusBar>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    padding: width * 0.05,
    flexGrow: 1,
    justifyContent: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  illustration: {
    width: '55%',
    height: undefined,
    aspectRatio: 1,
    resizeMode: 'contain',
    marginBottom: height * 0.01,
  },
  textContainer: {
    marginBottom: height * 0.02,
    alignSelf: 'flex-start',
  },
  welcomeText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: width * 0.07,
  },
  subText: {
    color: '#666',
    fontSize: width * 0.05,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingLeft: width * 0.02,
    marginBottom: height * 0.015,
    backgroundColor: '#fff',
  },
  icon: {
    paddingRight: width * 0.02,
  },
  input: {
    flex: 1,
    height: height * 0.07,
    padding: width * 0.03,
    color: '#000',
  },
  eyeButton: {
    paddingHorizontal: width * 0.03,
  },
  forgotPasswordText: {
    alignSelf: 'flex-end',
    color: '#00796b',
    fontWeight: 'bold',
    marginBottom: height * 0.02,
    fontSize: width * 0.04,
  },
  loginButton: {
    padding: height * 0.02,
    backgroundColor: '#00796b',
    borderRadius: width * 0.02,
    alignItems: 'center',
    marginTop: height * 0.02,
    marginBottom: height * 0.01,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.045,
  },
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupText: {
    color: '#000',
    fontSize: width * 0.04,
  },
  signupButtonText: {
    color: '#00796b',
    fontWeight: 'bold',
    marginLeft: width * 0.02,
    fontSize: width * 0.045,
  },
  errorText: {
    color: 'red',
    marginBottom: height * 0.01,
    fontSize: width * 0.04,
  },
  socialLoginContainer: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  socialButton: {
    alignItems: 'center',
    backgroundColor: '#00796b',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 30,
    marginVertical: 10,
  },
});

export default SignInScreen;
