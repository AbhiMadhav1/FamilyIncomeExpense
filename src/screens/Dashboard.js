import React, {useEffect, useState} from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import HeaderComponent from '../components/DateComponents';
import IncomeComponent from '../components/IncomeComponent';
import ExpenseComponent from '../components/ExpenseComponent';
import MonthlyReport from '../components/MonthlyReport';
import YearlyReport from '../components/YearlyReport';
import LinearGradient from 'react-native-linear-gradient';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {Platform, PixelRatio} from 'react-native';
import ImageResizer from 'react-native-image-resizer';

const {width, height} = Dimensions.get('window');

const Dashboard = ({navigation}) => {
  const [viewMode, setViewMode] = useState('daily');
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('income');
  const [incomeEntries, setIncomeEntries] = useState([]);
  const [expenseEntries, setExpenseEntries] = useState([]);
  const [balance, setBalance] = useState(0);
  const [editIndex, setEditIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [noIncomeMessage, setNoIncomeMessage] = useState('');
  const [noExpenseMessage, setNoExpenseMessage] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedImage, setSelectedImage] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [showImageOptions, setShowImageOptions] = React.useState(false);
  const [loading, setLoading] = useState(false); // Add a loading state
  const [borderColor, setBorderColor] = useState({
    amount: '#ccc',
    description: '#ccc',
  });

  const handleFocus = field => {
    setBorderColor({...borderColor, [field]: '#00796b'});
  };

  const handleBlur = field => {
    setBorderColor({...borderColor, [field]: '#ccc'});
  };

  const user = auth().currentUser;
  const currentUserId = user ? user.uid : null;
  useEffect(() => {
    if (user) {
      const unsubscribeIncome = firestore()
        .collection('incomeEntries')
        .where('userId', '==', user.uid)
        .where('date', '==', selectedDate.toISOString().split('T')[0])
        .onSnapshot(
          snapshot => {
            // Check if snapshot exists and contains docs
            if (snapshot && snapshot.docs) {
              const incomeData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
              }));
              setIncomeEntries(incomeData);
              if (incomeData.length === 0) {
                setNoIncomeMessage('No income entries found for this date.');
              } else {
                setNoIncomeMessage('');
              }
            } else {
              setIncomeEntries([]);
              setNoIncomeMessage('No income entries found for this date.');
            }
          },
          error => {
            console.error('Error fetching income data:', error);
            setIncomeEntries([]);
          },
        );

      const unsubscribeExpense = firestore()
        .collection('expenseEntries')
        .where('userId', '==', user.uid)
        .where('date', '==', selectedDate.toISOString().split('T')[0])
        .onSnapshot(
          snapshot => {
            if (snapshot && snapshot.docs) {
              const expenseData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
              }));
              setExpenseEntries(expenseData);
              if (expenseData.length === 0) {
                setNoExpenseMessage('No expense entries found for this date.');
              } else {
                setNoExpenseMessage('');
              }
            } else {
              setExpenseEntries([]);
              setNoExpenseMessage('No expense entries found for this date.');
            }
          },
          error => {
            console.error('Error fetching expense data:', error);
            setExpenseEntries([]);
          },
        );

      return () => {
        unsubscribeIncome();
        unsubscribeExpense();
      };
    }
  }, [user, selectedDate]);

  useEffect(() => {
    calculateBalance();
  }, [incomeEntries, expenseEntries]);

  useEffect(() => {
    calculateBalance();
  }, [incomeEntries, expenseEntries]);

  const calculateBalance = () => {
    const totalIncome = calculateTotalIncome();
    const totalExpense = calculateTotalExpense();
    const newBalance = totalIncome - totalExpense;
    setBalance(newBalance);
  };

  const calculateTotalIncome = () => {
    return incomeEntries
      .reduce((total, entry) => total + parseFloat(entry.amount || 0), 0)
      .toFixed(2);
  };

  const calculateTotalExpense = () => {
    return expenseEntries
      .reduce((total, entry) => total + parseFloat(entry.amount || 0), 0)
      .toFixed(2);
  };

  const handleAdd = async () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Please provide both amount and description.');
      return;
    }

    const entry = {
      amount: parseFloat(amount),
      description,
      date: selectedDate.toISOString().split('T')[0],
      userId: user.uid,
    };

    try {
      if (type === 'income') {
        if (isEditing) {
          await firestore()
            .collection('incomeEntries')
            .doc(incomeEntries[editIndex].id)
            .update(entry);
        } else {
          await firestore().collection('incomeEntries').add(entry);
        }
      } else if (type === 'expense') {
        if (isEditing) {
          await firestore()
            .collection('expenseEntries')
            .doc(expenseEntries[editIndex].id)
            .update(entry);
        } else {
          await firestore().collection('expenseEntries').add(entry);
        }
      }
      resetInputs();
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Could not save entry. Please try again.');
    }
  };

  const handleLongPress = (entryType, index) => {
    setEditIndex(index);
    setIsEditing(true);
    const entry =
      entryType === 'income' ? incomeEntries[index] : expenseEntries[index];
    setAmount(entry.amount.toString());
    setDescription(entry.description);
    setType(entryType);
    // setBase64Image(entry.image);
    // setSelectedImage(true);
    setModalVisible(true);
  };

  const resetInputs = () => {
    setAmount('');
    setDescription('');
    setEditIndex(null);
    setIsEditing(false);
    setBase64Image('');
    setSelectedImage('');
    setLoading(false);
    setBorderColor('');
  };

  const handleDelete = async (entryType, index) => {
    try {
      if (entryType === 'income') {
        await firestore()
          .collection('incomeEntries')
          .doc(incomeEntries[index].id)
          .delete();
      } else {
        await firestore()
          .collection('expenseEntries')
          .doc(expenseEntries[index].id)
          .delete();
      }
      Alert.alert('Success', 'Entry deleted successfully.');
      setModalVisible(false);
    } catch (error) {
      console.error('Error deleting entry:', error);
      Alert.alert('Error', 'Could not delete entry. Please try again.');
    }
  };

  const handleDateChange = newDate => {
    setSelectedDate(newDate);
    setIncomeEntries([]);
    setExpenseEntries([]);
  };

  // compress image below 1MB
  const compressImageToBelow1MB = async uri => {
    let quality = 100; // Start with maximum quality
    let compressedImage;
    let fileSize;

    do {
      try {
        compressedImage = await ImageResizer.createResizedImage(
          uri,
          800,
          800,
          'JPEG',
          quality,
          0,
        );

        const response = await fetch(compressedImage.uri);
        const blob = await response.blob();
        fileSize = blob.size / (1024 * 1024); // Convert to MB

        if (fileSize > 1) {
          quality -= 10; // Reduce quality if size is above 1MB
        }
      } catch (error) {
        console.error('Compression Error:', error);
        throw error;
      }
    } while (fileSize > 1 && quality > 10);

    return compressedImage.uri;
  };

  // select photo from galerry
  const selectImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: false,
    });

    if (result.didCancel) {
      console.log('User cancelled image picker');
    } else if (result.error) {
      console.log('ImagePicker Error: ', result.error);
    } else if (result.assets) {
      const image = result.assets[0];
      try {
        const compressedUri = await compressImageToBelow1MB(image.uri);
        setSelectedImage(compressedUri);
        // Convert to base64 if needed:
        const response = await fetch(compressedUri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => {
          setBase64Image(reader.result.split(',')[1]); // Extract base64 data
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Compression Error:', error);
      }
    }
  };

  // takePhoto from camera
  const takePhoto = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      includeBase64: false, // No need for base64 at this step
    });

    if (result.didCancel) {
      console.log('User cancelled camera');
    } else if (result.error) {
      console.log('Camera Error: ', result.error);
    } else if (result.assets) {
      const image = result.assets[0];
      try {
        const compressedUri = await compressImageToBelow1MB(image.uri);
        setSelectedImage(compressedUri);
        // Convert to base64 if needed:
        const response = await fetch(compressedUri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => {
          setBase64Image(reader.result.split(',')[1]); // Extract base64 data
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Compression Error:', error);
      }
    }
  };

  const deleteImage = () => {
    setSelectedImage(null);
    setBase64Image('');
  };

  const toggleImageOptions = () => {
    setShowImageOptions(prev => !prev);
  };

  // income expense entries with image
  const handleSubmit = async () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Please provide both amount and description.');
      return;
    }

    setLoading(true); // Start loading

    const data = {
      amount: parseFloat(amount),
      description,
      date: selectedDate.toISOString().split('T')[0],
      userId: user?.uid || 'defaultUserId',
      timestamp: Date.now(),
    };

    try {
      if (selectedImage) {
        const compressedUri = await compressImageToBelow1MB(selectedImage);
        const response = await fetch(compressedUri);
        const blob = await response.blob();
        const reader = new FileReader();

        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          if (type === 'income') {
            data.incomeImage = `data:image/jpeg;base64,${base64}`;
          } else if (type === 'expense') {
            data.expenseImage = `data:image/jpeg;base64,${base64}`;
          }
        };
        reader.readAsDataURL(blob);

        // Wait for base64 conversion to complete
        await new Promise(resolve => {
          reader.onloadend = resolve;
        });
      }
      if (type === 'income') {
        if (isEditing) {
          await firestore()
            .collection('incomeEntries')
            .doc(incomeEntries[editIndex].id)
            .update(data);
        } else {
          await firestore().collection('incomeEntries').add(data);
        }
      } else if (type === 'expense') {
        if (isEditing) {
          await firestore()
            .collection('expenseEntries')
            .doc(expenseEntries[editIndex].id)
            .update(data);
        } else {
          await firestore().collection('expenseEntries').add(data);
        }
      }
      resetInputs();
      setSelectedImage();
      setBase64Image();
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Could not save entry. Please try again.');
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'daily':
        return (
          <View style={styles.content}>
            <HeaderComponent
              balance={balance}
              onDateChange={handleDateChange}
              selectedDate={selectedDate}
            />
            <View style={styles.totalIncomeContainer}>
              {/* <Image style={{height: 35, width: 35}} source={require('../assets/icons/income.png')}/> */}
              <Text style={styles.title}>Total Income (Credit):</Text>
              <Text style={styles.totalAmount}>₹ {calculateTotalIncome()}</Text>
            </View>
            <IncomeComponent
              incomeEntries={incomeEntries}
              handleLongPress={handleLongPress}
            />
            <View style={styles.totalIncomeContainer}>
              {/* <Image style={{height: 35, width: 35}} source={require('../assets/icons/expense.png')}/> */}
              <Text style={styles.title}>Total Expense (Debit):</Text>
              <Text style={styles.totalAmount}>
                ₹ {calculateTotalExpense()}
              </Text>
            </View>
            <ExpenseComponent
              expenseEntries={expenseEntries}
              handleLongPress={handleLongPress}
            />
            <LinearGradient colors={['#00796b', '#20b2aa']} style={styles.fab}>
              <TouchableOpacity
                onPress={() => {
                  resetInputs();
                  setModalVisible(true);
                }}>
                <Icon name="add" size={30} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        );
      case 'monthly':
        const month = selectedDate.toLocaleString('default', {month: 'long'});
        const year = selectedDate.getFullYear();
        return (
          <View style={styles.content}>
            <MonthlyReport
              incomeEntries={incomeEntries}
              expenseEntries={expenseEntries}
              month={month}
              year={year}
              userId={currentUserId}
            />
          </View>
        );
      case 'yearly':
        return (
          <View style={styles.content}>
            <YearlyReport
              incomeEntries={incomeEntries}
              expenseEntries={expenseEntries}
              year={selectedYear}
              userId={currentUserId}
            />
          </View>
        );
      default:
        return null;
    }
  };
  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={Platform.OS === 'ios' ? '#00796b' : '#00796b'}
        barStyle={Platform.OS === 'ios' ? 'light-content' : 'dark-content'}
      />
      <LinearGradient colors={['#00796b', '#20b2aa']} style={styles.header}>
        <TouchableOpacity
          style={styles.menuIcon}
          onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={30} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, viewMode === 'daily' && styles.activeTab]}
            onPress={() => setViewMode('daily')}>
            <Text style={styles.tabText}>Daily</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, viewMode === 'monthly' && styles.activeTab]}
            onPress={() => setViewMode('monthly')}>
            <Text style={styles.tabText}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, viewMode === 'yearly' && styles.activeTab]}
            onPress={() => setViewMode('yearly')}>
            <Text style={styles.tabText}>Yearly</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      {renderContent()}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled">
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>
                {isEditing ? `Update ${type}` : `Add ${type}`}
              </Text>

              {/* Amount Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, {borderColor: borderColor.amount}]}
                  placeholder="Amount"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={text => {
                    if (text.length <= 10 && /^\d*$/.test(text)) {
                      setAmount(text);
                    }
                  }}
                  placeholderTextColor="#aaa"
                  returnKeyType="next"
                  onFocus={() => handleFocus('amount')}
                  onBlur={() => handleBlur('amount')}
                />
              </View>

              {/* Description Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, {borderColor: borderColor.description}]}
                  placeholder="Description"
                  value={description}
                  onChangeText={setDescription}
                  placeholderTextColor="#aaa"
                  returnKeyType="done"
                  onFocus={() => handleFocus('description')}
                  onBlur={() => handleBlur('description')}
                />
              </View>

              {/* Image Selection */}
              <View style={styles.imageSection}>
                {selectedImage ? (
                  <View style={styles.selectedImageContainer}>
                    <Image
                      source={{uri: `data:image/jpeg;base64,${base64Image}`}}
                      style={styles.selectedImage}
                    />
                    <TouchableOpacity
                      onPress={deleteImage}
                      style={[styles.deleteImageButton, {zIndex: 1}]}>
                      <Icon name="trash" size={20} color="red" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imageOptionsContainer}>
                    <TouchableOpacity
                      onPress={takePhoto}
                      style={styles.imageButton}>
                      <Icon name="camera" size={25} color="#444" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={selectImage}
                      style={styles.imageButton}>
                      <Icon name="image" size={25} color="#444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Type Selection */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    type === 'income'
                      ? styles.activeIncomeButton
                      : styles.inactiveButton,
                  ]}
                  onPress={() => setType('income')}>
                  <Text style={styles.buttonText}>Income</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    type === 'expense'
                      ? styles.activeExpenseButton
                      : styles.inactiveButton,
                  ]}
                  onPress={() => setType('expense')}>
                  <Text style={styles.buttonText}>Expense</Text>
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton]}
                onPress={loading ? null : handleSubmit}
                disabled={loading} // Prevent interaction while loading
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isEditing ? 'Update' : 'Add'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Delete Button for Editing */}
              {isEditing && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(type, editIndex)}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              )}

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  header: {
    backgroundColor: '#00796b',
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
    borderBottomLeftRadius: width * 0.08,
    borderBottomRightRadius: width * 0.08,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: height * 0.005},
    shadowOpacity: 0.3,
    shadowRadius: height * 0.005,
  },
  menuIcon: {
    marginTop: Platform.OS === 'ios' ? height * 0.04 : 0,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: height * 0.02,
  },
  tab: {
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.03,
    borderRadius: width * 0.05,
    top: height * 0.02,
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: height * 0.003},
    shadowOpacity: 0.25,
    shadowRadius: height * 0.004,
    elevation: 5,
  },
  tabText: {
    fontSize: width * 0.04,
    color: '#000',
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    justifyContent: 'space-between',
    flex: 1,
  },
  title: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  totalIncomeContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginVertical: 10,
    backgroundColor: '#c0c0c0',
    padding: 10,
    borderRadius: 10,
    justifyContent: 'space-between',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  entry: {
    padding: 10,
    borderBottomColor: '#e0e0e0',
    borderBottomWidth: 1,
  },
  fab: {
    position: 'absolute',
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.075,
    backgroundColor: '#00796b',
    justifyContent: 'center',
    alignItems: 'center',
    right: width * 0.08,
    bottom: height * 0.04,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: width * 0.05,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    marginBottom: height * 0.02,
    color: '#000',
  },
  inputContainer: {
    width: '100%',
    marginBottom: height * 0.015,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: height * 0.015,
    fontSize: width * 0.04,
    width: '100%',
    color: '#000',
  },
  imageSection: {
    alignSelf: 'flex-start',
    padding: height * 0.015,
    marginBottom: height * 0.02,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  selectedImageContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: 5,
  },
  deleteImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fdc7cd',
    borderRadius: 18,
    padding: width * 0.02,
    elevation: 3,
  },
  imageOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '50%',
  },
  imageButton: {
    padding: height * 0.015,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: height * 0.02,
  },
  button: {
    flex: 1,
    marginHorizontal: width * 0.01,
    borderRadius: 5,
    padding: height * 0.015,
    alignItems: 'center',
  },
  activeIncomeButton: {
    backgroundColor: 'green',
  },
  activeExpenseButton: {
    backgroundColor: 'red',
  },
  inactiveButton: {
    backgroundColor: '#aaa',
  },
  buttonText: {
    fontSize: width * 0.04,
    fontWeight: 'bold',
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#00796b',
    padding: height * 0.02,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#f08080',
    padding: height * 0.02,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#ddd',
    padding: height * 0.015,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#444',
    fontSize: width * 0.04,
  },
});

export default Dashboard;
