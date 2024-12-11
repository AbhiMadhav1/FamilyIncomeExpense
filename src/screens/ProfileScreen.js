import React, {useEffect, useState} from 'react';
import {
  Text,
  View,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import CustomStatusBar from '../components/CustomStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

const {width, height} = Dimensions.get('window');

const ProfileScreen = ({navigation}) => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    userId: '',
    avatarUrl: '',
  });
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [borderColor, setBorderColor] = useState({
    firstName: '#ccc',
    lastName: '#ccc',
    email: '#ccc',
  });
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch user data from Firestore
  const fetchUserDataFromFirestore = async () => {
    try {
      const user = auth().currentUser;
      if (user) {
        const userDoc = await firestore()
          .collection('users')
          .doc(user.uid)
          .get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          setUserData({
            name: userData.name || '',
            email: userData.email || '',
            userId: userData.userId || '',
            avatarUrl: userData.avatar || '',
          });

          // Split the name into first and last names
          const nameParts = userData.name ? userData.name.split(' ') : [];
          const fName = nameParts[0] || '';
          const lName = nameParts.slice(1).join(' ') || '';

          setFirstName(fName);
          setLastName(lName);
          setEmail(userData.email || '');
        }
      }
    } catch (error) {
      console.error('Error fetching user data from Firestore:', error);
    }
  };

  useEffect(() => {
    fetchUserDataFromFirestore();
  }, []);

  const handleSave = async () => {
    // Immediately update the state with the new values for UI feedback
    const updatedUser = {
      name: `${firstName} ${lastName}`,
      email,
    };

    // If an image is selected, include it in the update
    if (selectedImage) {
      if (!selectedImage.base64) {
        throw new Error('Image Base64 data is missing');
      }
      const base64Image = `${selectedImage.base64}`;
      updatedUser.avatar = base64Image;
    }

    // Update the local state with the new values
    setUserData(prevData => ({
      ...prevData,
      name: updatedUser.name,
      email: updatedUser.email,
      avatarUrl: updatedUser.avatar || prevData.avatarUrl,
    }));

    setLoading(true);

    try {
      // Now update Firestore with the new data
      await firestore()
        .collection('users')
        .doc(auth().currentUser.uid)
        .set(updatedUser, {merge: true});

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving user data:', error.message);
      alert('Failed to update profile!');
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = field => {
    setBorderColor({...borderColor, [field]: '#00796b'});
  };

  const handleBlur = field => {
    setBorderColor({...borderColor, [field]: '#ccc'});
  };

  // select photo FromGallery
  const selectFromGallery = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
    });

    if (!result.didCancel && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
      setIsModalVisible(false);
    }
  };

  // Take photo using camera
  const takePhoto = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      includeBase64: true,
    });

    if (!result.didCancel && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
      setIsModalVisible(false);
    }
  };

  const removeImage = async () => {
    try {
      await firestore().collection('users').doc(auth().currentUser.uid).update({
        avatar: null,
      });
      setSelectedImage(null);
      setUserData(prevData => ({
        ...prevData,
        avatarUrl: '',
      }));

      // alert('Avatar removed successfully!');
    } catch (error) {
      console.error('Error removing avatar:', error.message);
      alert('Failed to remove avatar!');
    }
    setIsModalVisible(false);
  };

  return (
    <CustomStatusBar statusBgColor="#00796b">
      <LinearGradient colors={['#00796b', '#20b2aa']} style={styles.header}>
        <StatusBar backgroundColor="#00796b" barStyle="light-content" />
        <TouchableOpacity
          // style={{top: 20}}
          onPress={() => navigation.navigate('Dashboard')}>
          <Icon name="arrow-back" size={width * 0.06} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{width: width * 0.06}} />
        <View style={styles.avatarContainer}>
          {userData.avatarUrl ? (
            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri: selectedImage
                    ? selectedImage.uri
                    : userData.avatarUrl.startsWith('data:image')
                    ? userData.avatarUrl
                    : `data:image/jpeg;base64,${userData.avatarUrl}`,
                }}
                style={styles.avatarImage}
              />

              <TouchableOpacity
                style={[styles.editAvatarButton, {zIndex: 1}]}
                onPress={() => setIsModalVisible(true)}>
                <Icon name="pencil" size={23} color="#00796b" />
              </TouchableOpacity>
            </View>
          ) : (
            <LinearGradient
              colors={['#20b2aa', '#3cb371']}
              style={styles.initialsContainer}>
              {selectedImage ? (
                <Image
                  source={{uri: selectedImage.uri}}
                  style={styles.avatarImage}
                />
              ) : userData.name ? (
                <Text style={styles.initialsText}>
                  {userData.name
                    .split(' ')
                    .map(name => name.charAt(0).toUpperCase())
                    .join('')}
                </Text>
              ) : (
                <Icon name="person" size={width * 0.15} color="#eee" />
              )}
            </LinearGradient>
          )}

          {/* Edit Avatar Button */}
          <TouchableOpacity
            style={[styles.editAvatarButton, {zIndex: 1}]}
            onPress={() => setIsModalVisible(true)}>
            <Icon name="pencil" size={23} color="#00796b" />
          </TouchableOpacity>

          {/* Modal to show options */}
          <Modal
            visible={isModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setIsModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={takePhoto}>
                  <Icon name="camera" size={23} color="#555" />
                  <Text style={styles.modalOptionText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={selectFromGallery}>
                  <Icon name="image" size={23} color="#555" />
                  <Text style={styles.modalOptionText}>
                    Select from Gallery
                  </Text>
                </TouchableOpacity>

                {/* New option to remove image */}
                {selectedImage && (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={removeImage}>
                    <Icon name="close" size={23} color="#555" />
                    <Text style={styles.modalOptionText}>Remove Avatar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setIsModalVisible(false)}>
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </LinearGradient>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}>
          <Text style={styles.welcomeText}>Edit profile!</Text>
          <Text style={styles.subText}>Modify it to get updated details</Text>
          <TextInput
            style={[styles.input, {borderColor: borderColor.firstName}]}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
            onFocus={() => handleFocus('firstName')}
            onBlur={() => handleBlur('firstName')}
            placeholderTextColor="#aaa"
          />
          <TextInput
            style={[styles.input, {borderColor: borderColor.lastName}]}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
            onFocus={() => handleFocus('lastName')}
            onBlur={() => handleBlur('lastName')}
            placeholderTextColor="#aaa"
          />
          <TextInput
            style={[styles.input, {borderColor: borderColor.email}]}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            onFocus={() => handleFocus('email')}
            onBlur={() => handleBlur('email')}
            placeholderTextColor="#aaa"
          />
          <LinearGradient
            colors={['#00796b', '#20b2aa']}
            style={styles.gradientButton}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              style={styles.touchableOpacity}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.updateButtonText}>Update</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>
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
    height: height * 0.28,
    paddingHorizontal: width * 0.05,
    borderBottomLeftRadius: Platform.OS === 'ios' ? 60 : 60,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginTop: height * 0.02,
    bottom: 5,
  },
  avatarImage: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  initialsContainer: {
    width: width * 0.3,
    height: width * 0.3,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: width * 0.15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: width * 0.12,
    fontWeight: 'bold',
    color: '#fff',
  },
  imageContainer: {
    position: 'relative',
  },
  editAvatarButton: {
    position: 'absolute',
    top: -0,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 5,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalOption: {
    padding: 10,
    width: '100%',
    // alignItems: 'center',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalOptionText: {
    fontSize: 16,
    paddingHorizontal: 10,
    color: '#00796b',
  },
  modalCancelButton: {
    padding: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: 'red',
  },
  welcomeText: {
    fontSize: width * 0.07,
    fontWeight: 'bold',
    color: '#333',
  },
  subText: {
    fontSize: width * 0.045,
    color: '#666',
    marginBottom: width * 0.05,
  },
  input: {
    height: height * 0.07,
    borderWidth: 1,
    borderRadius: width * 0.03,
    paddingHorizontal: width * 0.03,
    marginBottom: width * 0.05,
    backgroundColor: '#F5F5F5',
    color: '#000',
  },
  gradientButton: {
    height: height * 0.07,
    borderRadius: width * 0.03,
    justifyContent: 'center',
  },
  updateButtonText: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  scrollViewContent: {
    paddingBottom: height * 0.1,
  },
});

export default ProfileScreen;
