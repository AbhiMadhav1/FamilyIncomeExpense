import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useNavigation} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomStatusBar from '../components/CustomStatusBar';
import LinearGradient from 'react-native-linear-gradient';

const AvatarScreen = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigation = useNavigation();

  const handleSelectImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
        quality: 1,
        maxHeight: 800,
        maxWidth: 800,
      },
      response => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.error('ImagePicker Error: ', response.errorMessage);
        } else if (response.assets) {
          const {base64} = response.assets[0];
          setSelectedImage(base64);
          setErrorMessage('');
        }
      },
    );
  };

  const uploadImage = async () => {
    if (!selectedImage) {
      setErrorMessage('Please select an image before proceeding.');
      return;
    }

    setUploading(true);
    const currentUser = auth().currentUser;

    try {
      await firestore().collection('users').doc(currentUser.uid).set(
        {
          avatar: selectedImage,
        },
        {merge: true},
      );
      navigation.navigate('AppDrawer', {imageUri: selectedImage});
    } catch (error) {
      console.error('Error saving image: ', error);
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setErrorMessage('');
  };

  return (
    <CustomStatusBar statusBgColor="#004d40">
      <LinearGradient colors={['#004d40', '#69d3c7']} style={styles.container}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.navigate('AppDrawer')}>
          <Text style={styles.skipbuttonText}>Skip</Text>
          <Icon name="arrow-forward" size={20} color="#00796b" />
        </TouchableOpacity>

        <StatusBar backgroundColor="#004d40" barStyle="light-content" />
        {/* <Text style={styles.title}>Select an Image</Text> */}
        {selectedImage ? (
          <Image
            source={{uri: `data:image/jpeg;base64,${selectedImage}`}}
            style={styles.imagePreview}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon name="person" size={100} color="#eee" />
          </View>
        )}
        <TouchableOpacity style={styles.button} onPress={handleSelectImage}>
          <Text style={styles.buttonText}>Select Image</Text>
        </TouchableOpacity>
        {selectedImage && (
          <TouchableOpacity style={styles.clearButton} onPress={clearImage}>
            <Text style={styles.buttonText}>Clear Image</Text>
          </TouchableOpacity>
        )}
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
        {selectedImage && (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={uploadImage}
            disabled={uploading}>
            <Text style={styles.buttonText}>
              {uploading ? 'Uploading...' : 'Save and Next'}
            </Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </CustomStatusBar>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#ffffff',
    marginBottom: 20,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 100,
    backgroundColor: '#bbb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  button: {
    backgroundColor: '#00796b',
    paddingVertical: 15,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  clearButton: {
    backgroundColor: '#e57373',
    paddingVertical: 15,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  nextButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 15,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#fff',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  skipbuttonText: {
    color: '#00796b',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: '#ffccbc',
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
  },
});

export default AvatarScreen;
