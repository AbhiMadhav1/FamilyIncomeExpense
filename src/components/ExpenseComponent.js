// src/components/ExpenseComponent.js
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

const ExpenseComponent = ({expenseEntries, handleLongPress}) => {
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
                .collection('expenseEntries')
                .doc(entryId)
                .update({
                  expenseImage: firestore.FieldValue.delete(),
                });
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
        {expenseEntries.length === 0 ? (
          <Text style={styles.noEntriesMessage}>
            No expense entries found for this date
          </Text>
        ) : (
          expenseEntries.map((entry, index) => (
            <View key={index} style={styles.entry}>
              <TouchableOpacity
                onLongPress={() => handleLongPress('expense', index)}>
                <View style={styles.entryContainer}>
                  <Text style={styles.entryText}>{entry.description}</Text>
                  {entry.expenseImage && (
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

                {entry.expenseImage && visibleImages[index] && (
                  <View style={styles.imageContainer}>
                    <TouchableOpacity
                      onPress={() => handleImagePress(entry.expenseImage)}>
                      <Image
                        source={{uri: entry.expenseImage}}
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
  },
  entry: {
    padding: 10,
    borderBottomColor: '#e0e0e0',
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
    color: 'red',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  entryImage: {
    width: width * 0.12,
    height: width * 0.12,
    margin: 10,
  },
  noEntriesMessage: {
    padding: width * 0.05,
    textAlign: 'center',
    color: '#333',
    fontStyle: 'italic',
    fontWeight: 'bold',
    fontSize: width * 0.04,
  },
  caretIcon: {
    marginLeft: 10,
    marginRight: 10,
    alignSelf: 'center',
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    padding: 0,
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
    top: 20,
    right: 20,
  },
  deleteIcon: {
    position: 'absolute',
    top: 0,
    left: 50,
    backgroundColor: '#fdc7cd',
    borderRadius: 18,
    padding: width * 0.02,
    elevation: 3,
  },
});

export default ExpenseComponent;
