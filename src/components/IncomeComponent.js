// src/components/IncomeComponent.js
import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';

const {width, height} = Dimensions.get('window');

const IncomeComponent = ({incomeEntries, handleLongPress}) => {
  const [visibleImages, setVisibleImages] = React.useState({});
  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState(null);

  const toggleImageVisibility = index => {
    setVisibleImages(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleImagePress = imageUri => {
    setSelectedImage(imageUri);
    setModalVisible(true);
  };

  const closeImageModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

  const handleDeleteImage = async entryId => {
    try {
      Alert.alert(
        'Delete Image',
        'Are you sure you want to delete this image?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            onPress: async () => {
              await firestore()
                .collection('incomeEntries')
                .doc(entryId)
                .update({
                  incomeImage: firestore.FieldValue.delete(),
                });
              Alert.alert('Success', 'Image deleted successfully.');
            },
          },
        ],
        {cancelable: false},
      );
    } catch (error) {
      console.error('Error deleting image:', error);
      Alert.alert('Error', 'Could not delete image. Please try again.');
    }
  };

  return (
    <View style={styles.content}>
      <ScrollView>
        {incomeEntries.length === 0 ? (
          <Text style={styles.noEntriesMessage}>
            No income entries found for this date
          </Text>
        ) : (
          incomeEntries.map((entry, index) => (
            <View key={index} style={styles.entry}>
              <TouchableOpacity
                onLongPress={() => handleLongPress('income', index)}>
                <View style={styles.entryContainer}>
                  <Text style={styles.entryText}>{entry.description}</Text>
                  {entry.incomeImage && (
                    <TouchableOpacity
                      onPress={() => toggleImageVisibility(index)}>
                      <Icon
                        name={
                          visibleImages[index]
                            ? 'caret-up-outline'
                            : 'caret-down-outline'
                        }
                        size={15}
                        color="#333"
                        style={styles.caretIcon}
                      />
                    </TouchableOpacity>
                  )}
                  <Text style={styles.entryAmount}>
                    {entry.amount.toFixed(2)}
                  </Text>
                </View>

                {entry.incomeImage && visibleImages[index] && (
                  <View>
                    <TouchableOpacity
                      onPress={() => handleImagePress(entry.incomeImage)}>
                      <Image
                        source={{uri: entry.incomeImage}}
                        style={styles.entryImage}
                      />
                    </TouchableOpacity>
                    {/* Delete Icon */}
                    <TouchableOpacity
                      style={styles.deleteIcon}
                      onPress={() => handleDeleteImage(entry.id)}>
                      <Icon name="trash-outline" size={20} color="red" />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal to display the selected image */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeImageModal}>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={closeImageModal}
          />
          <View style={styles.modalContent}>
            <Image
              source={{uri: selectedImage}}
              style={styles.modalImage}
              resizeMode="contain"
            />
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeImageModal}>
              <Icon name="close-circle" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    justifyContent: 'space-between',
    flex: 1,
    paddingHorizontal: width * 0.0,
  },
  entry: {
    padding: width * 0.03,
    borderBottomColor: '#e0e0e0e0',
    borderBottomWidth: 1,
  },
  entryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryText: {
    fontSize: width * 0.04,
    color: '#333',
    fontWeight: 'bold',
    flex: 1,
  },
  entryAmount: {
    fontSize: width * 0.04,
    color: 'green',
    fontWeight: 'bold',
    marginLeft: width * 0.02,
  },
  entryImage: {
    width: width * 0.12,
    height: width * 0.12,
    marginLeft: width * 0.05,
    margin: width * 0.03,
  },
  noEntriesMessage: {
    padding: width * 0.05,
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    fontWeight: 'bold',
    fontSize: width * 0.04,
  },
  caretIcon: {
    marginLeft: width * 0.03,
    marginRight: width * 0.03,
    alignSelf: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  modalContent: {
    borderRadius: 10,
    padding: width * 0.05,
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.9,
    height: height * 0.9,
  },
  modalImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
    borderRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: height * 0.05,
    right: width * 0.05,
  },
  deleteIcon: {
    position: 'absolute',
    top: 0,
    left: 50,
    backgroundColor: '#fdc7cd',
    borderRadius: 20,
    padding: width * 0.02,
    elevation: 3,
  },
});

export default IncomeComponent;
