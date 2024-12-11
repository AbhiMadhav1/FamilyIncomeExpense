import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  PermissionsAndroid,
  Dimensions,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import MonthPicker from 'react-native-month-year-picker';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Icon from 'react-native-vector-icons/Ionicons';

const {width, height} = Dimensions.get('window');

const MonthlyReport = ({userId}) => {
  const [incomeEntries, setIncomeEntries] = useState({});
  const [expenseEntries, setExpenseEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [userName, setUserName] = useState('User');
  const month = date.getMonth();
  const year = date.getFullYear();
  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      try {
        const incomeSnapshot = await firestore()
          .collection('incomeEntries')
          .where('userId', '==', userId)
          .get();

        const expenseSnapshot = await firestore()
          .collection('expenseEntries')
          .where('userId', '==', userId)
          .get();

        const incomeData = incomeSnapshot.docs.map(doc => {
          const data = doc.data();
          const entryDate =
            data.date instanceof firestore.Timestamp
              ? data.date.toDate()
              : new Date(data.date);
          return {id: doc.id, ...data, date: entryDate};
        });

        const expenseData = expenseSnapshot.docs.map(doc => {
          const data = doc.data();
          const entryDate =
            data.date instanceof firestore.Timestamp
              ? data.date.toDate()
              : new Date(data.date);
          return {id: doc.id, ...data, date: entryDate};
        });

        const filteredIncome = incomeData.filter(entry => {
          const entryDate = new Date(entry.date);
          return (
            entryDate.getMonth() === month && entryDate.getFullYear() === year
          );
        });

        const filteredExpense = expenseData.filter(entry => {
          const entryDate = new Date(entry.date);
          return (
            entryDate.getMonth() === month && entryDate.getFullYear() === year
          );
        });

        const groupedIncome = filteredIncome.reduce((acc, entry) => {
          const entryDate = new Date(entry.date).toLocaleDateString('en-GB');
          acc[entryDate] = acc[entryDate] || [];
          acc[entryDate].push(entry);
          return acc;
        }, {});

        const groupedExpense = filteredExpense.reduce((acc, entry) => {
          const entryDate = new Date(entry.date).toLocaleDateString('en-GB');
          acc[entryDate] = acc[entryDate] || [];
          acc[entryDate].push(entry);
          return acc;
        }, {});

        setIncomeEntries(groupedIncome);
        setExpenseEntries(groupedExpense);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, [month, year, userId]);

  const totalIncome = Object.values(incomeEntries)
    .flat()
    .reduce((total, entry) => total + parseFloat(entry.amount || 0), 0)
    .toFixed(2);

  const totalExpense = Object.values(expenseEntries)
    .flat()
    .reduce((total, entry) => total + parseFloat(entry.amount || 0), 0)
    .toFixed(2);

  const netBalance = (totalIncome - totalExpense).toFixed(2);
  const formattedMonthYear = `${date.toLocaleString('default', {
    month: 'long',
  })} ${year}`;

  const allDates = Array.from(
    new Set([...Object.keys(incomeEntries), ...Object.keys(expenseEntries)]),
  ).sort((a, b) => new Date(a) - new Date(b)); // Sorting dates in ascending order

  const hasEntries = totalIncome > 0 || totalExpense > 0;

  const showDatePicker = () => {
    setShowPicker(true);
  };

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(false);
    setDate(currentDate);
  };

  const handleImagePress = imageUri => {
    setSelectedImage(imageUri);
    setModalVisible(true);
  };

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      try {
        // Fetch user name
        const userSnapshot = await firestore()
          .collection('users')
          .doc(userId)
          .get();
        const userName = userSnapshot.data()?.name || 'User';
        setUserName(userName);

        // Fetch income and expense entries
        const incomeSnapshot = await firestore()
          .collection('incomeEntries')
          .where('userId', '==', userId)
          .get();

        const expenseSnapshot = await firestore()
          .collection('expenseEntries')
          .where('userId', '==', userId)
          .get();

        const incomeData = incomeSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        const expenseData = expenseSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Process data to calculate totals and organize entries
        // Update totalIncome, totalExpense, netBalance, allDates, incomeEntries, and expenseEntries
        // (This logic would remain as per your existing implementation)
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [formattedMonthYear, userId]);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs access to your storage to download the PDF',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can access storage');
      } else {
        console.log('Storage permission denied');
      }
    }
  };
  const formatAmount = amount => {
    if (amount && !isNaN(amount)) {
      // Convert the amount to a string
      let amountString = amount.toString();
      // If the amount is less than 1000, return it directly without formatting
      if (parseInt(amountString) < 1000) {
        return amountString;
      }
      // Add commas for amounts 1000 and above
      return amountString.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return '0.00';
  };

  //monthly report pfd download
  const downloadPDF = async () => {
    const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #00796b; text-align: center; }
          h2 { 
            color: #FFF; 
            background-color: #4db6ac; /* Light cyan background */
            padding: 10px; 
            border-radius: 5px; 
            text-align: center; 
          }
          p { font-size: 14px; }
          .summary { margin-bottom: 20px; }
          .total-income { color: green; }
          .total-expense { color: red; }
          .total-balance { color: green; font-weight: bold; }
          .entry { 
            border: 1px solid #e0e0e0; 
            border-radius: 5px; 
            padding: 15px; 
            margin-bottom: 20px; 
            background-color: #f9f9f9; 
          }
          .entry h3 { 
            margin: 0; 
            color: #00796b; 
          }
          .income { 
            background-color: #e8f5e9; /* Light green background */
            padding: 10px; 
            border-radius: 5px; 
            margin: 5px 0; 
          }
          .expense { 
            background-color: #ffebee; /* Light red background */
            padding: 10px; 
            border-radius: 5px; 
            margin: 5px 0; 
          }
        </style>
      </head>
      <body>
        <h1>${userName}'s Monthly Financial Report</h1>
        <h1>${formattedMonthYear}</h1></h1>
        <div class="summary">
          <p><strong>Total Income (Credit):</strong> <span class="total-income">${totalIncome}</span></p>
          <p><strong>Total Expense (Debit):</strong> <span class="total-expense">${totalExpense}</span></p>
          <p><strong>Balance:</strong> <span class="total-balance">${netBalance}</span></p>
        </div>
        <h2>Entries</h2>
        ${allDates
          .map(date => {
            const dailyIncomeEntries = incomeEntries[date] || [];
            const dailyExpenseEntries = expenseEntries[date] || [];

            const dailyIncome = dailyIncomeEntries
              .reduce(
                (total, entry) => total + parseFloat(entry.amount || 0),
                0,
              )
              .toFixed(2);
            const dailyExpense = dailyExpenseEntries
              .reduce(
                (total, entry) => total + parseFloat(entry.amount || 0),
                0,
              )
              .toFixed(2);

            // Generate HTML for daily income entries
            const incomeEntriesHTML = dailyIncomeEntries
              .map(
                entry => `
            <p><strong>${entry.description}</strong>: ${parseFloat(
                  entry.amount,
                ).toFixed(2)}</p>
          `,
              )
              .join('');

            // Generate HTML for daily expense entries
            const expenseEntriesHTML = dailyExpenseEntries
              .map(
                entry => `
            <p><strong>${entry.description}</strong>: ${parseFloat(
                  entry.amount,
                ).toFixed(2)}</p>
          `,
              )
              .join('');

            return `
            <div class="entry">
              <h3>${date}</h3>
              <p class="income"><strong>Income (Credit):</strong> ${dailyIncome}</p>
              ${incomeEntriesHTML}
              <p class="expense"><strong>Expense (Debit):</strong> ${dailyExpense}</p>
              ${expenseEntriesHTML}
            </div>
          `;
          })
          .join('')}
      </body>
    </html>
  `;
    let options = {
      html,
      fileName: 'Monthly_Report',
      directory: 'Download', // Set to 'Download' to save it in Android's Downloads folder
    };

    try {
      let file = await RNHTMLtoPDF.convert(options);
      console.log('File saved to: ', file.filePath);
      Alert.alert('PDF saved!', `File saved to: ${file.filePath}`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Could not save PDF. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#00796b', '#20b2aa']} style={styles.header}>
        <TouchableOpacity onPress={showDatePicker}>
          <Text style={styles.headerText}>{formattedMonthYear}</Text>
        </TouchableOpacity>
      </LinearGradient>

      {showPicker && (
        <MonthPicker
          value={date}
          mode="date"
          display="default"
          onChange={onChange}
        />
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#00796b" />
      ) : hasEntries ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailContainer}>
          <View style={styles.summaryContainer}>
            <Text style={styles.amount}>
              Total Income (Credit) :{' '}
              <Text style={styles.incomeTotal}>
                {formatAmount(totalIncome)}
              </Text>
            </Text>
            <Text style={styles.amount}>
              Total Expense (Debit) :{' '}
              <Text style={styles.expenseTotal}>
                {formatAmount(totalExpense)}
              </Text>
            </Text>
            <Text style={styles.balance}>
              Balance = {formatAmount(netBalance)}
            </Text>
          </View>

          {/* Sort dates in ascending order numerically */}
          {allDates
            .sort((a, b) => parseInt(a) - parseInt(b)) // Sort by numeric day
            .map(date => {
              if (!incomeEntries[date] && !expenseEntries[date]) return null;

              const dailyIncome =
                incomeEntries[date]
                  ?.reduce(
                    (total, entry) => total + parseFloat(entry.amount || 0),
                    0,
                  )
                  .toFixed(2) || '0.00';

              const dailyExpense =
                expenseEntries[date]
                  ?.reduce(
                    (total, entry) => total + parseFloat(entry.amount || 0),
                    0,
                  )
                  .toFixed(2) || '0.00';

              const dailyBalance = (
                parseFloat(dailyIncome) - parseFloat(dailyExpense)
              ).toFixed(2);

              return (
                <View key={date} style={styles.dateBox}>
                  <Text style={styles.dateTitle}>{date}</Text>
                  <Text style={styles.detailTitle}>
                    Income (Credit) : {formatAmount(dailyIncome)}
                  </Text>
                  {incomeEntries[date]?.map(entry => (
                    <View key={entry.id} style={styles.entryContainer}>
                      <Text style={styles.detailText}>
                        {entry.source} {entry.description} -{' '}
                        {formatAmount(entry.amount)}
                      </Text>
                      {entry.incomeImage && (
                        <TouchableOpacity
                          onPress={() => handleImagePress(entry.incomeImage)}>
                          <Image
                            source={{uri: entry.incomeImage}}
                            style={styles.image}
                            resizeMode="contain"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  <Text style={styles.detailTitle}>
                    Expense (Debit) : {formatAmount(dailyExpense)}
                  </Text>
                  {expenseEntries[date]?.map(entry => (
                    <View key={entry.id} style={styles.entryContainer}>
                      <Text style={styles.detailText}>
                        {entry.source} {entry.description} -{' '}
                        {formatAmount(entry.amount)}
                      </Text>
                      {entry.expenseImage && (
                        <TouchableOpacity
                          onPress={() => handleImagePress(entry.expenseImage)}>
                          <Image
                            source={{uri: entry.expenseImage}}
                            style={styles.image}
                            resizeMode="contain"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  <Text style={styles.balance}>
                    Total = {formatAmount(dailyBalance)}
                  </Text>
                </View>
              );
            })}
        </ScrollView>
      ) : (
        <View style={styles.noEntriesContainer}>
          <Text style={styles.noEntriesText}>
            No entries found for this month.
          </Text>
        </View>
      )}
      <LinearGradient colors={['#00796b', '#20b2aa']} style={styles.fab}>
        <TouchableOpacity onPress={downloadPDF}>
          <Icon name="download-outline" size={30} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Modal for displaying the selected image */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setModalVisible(false)}
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
              onPress={() => setModalVisible(false)}>
              <Icon name="close-circle" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  header: {
    backgroundColor: '#00796b',
    padding: width * 0.04,
    borderRadius: width * 0.02,
    marginBottom: height * 0.03,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: height * 0.005},
    shadowOpacity: 0.2,
    shadowRadius: height * 0.005,
  },
  headerText: {
    color: '#ffffff',
    fontSize: width * 0.06,
    fontWeight: 'bold',
  },
  summaryContainer: {
    padding: width * 0.03,
    borderRadius: width * 0.02,
    backgroundColor: '#E0F2F1',
    marginBottom: height * 0.02,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: height * 0.005},
    shadowOpacity: 0.1,
    shadowRadius: height * 0.005,
  },
  amount: {
    fontSize: width * 0.04,
    color: '#333',
    padding: 5,
    fontWeight: 'bold',
  },
  incomeTotal: {
    color: '#388E3C',
    fontWeight: 'bold',
  },
  expenseTotal: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  balance: {
    fontWeight: 'bold',
    color: '#388E3C',
    textAlign: 'right',
    marginTop: height * 0.01,
    fontSize: width * 0.045,
  },
  detailContainer: {
    paddingBottom: height * 0.03,
  },
  dateBox: {
    borderWidth: 1,
    borderColor: '#00796b',
    padding: width * 0.03,
    borderRadius: width * 0.02,
    marginBottom: height * 0.015,
    backgroundColor: '#F0F4F4',
  },
  dateTitle: {
    fontWeight: 'bold',
    fontSize: width * 0.045,
    marginBottom: height * 0.01,
    color: '#333',
    textAlign: 'center',
  },
  detailTitle: {
    fontWeight: 'bold',
    fontSize: width * 0.04,
    color: '#00796b',
    marginTop: height * 0.01,
  },
  entryContainer: {
    flexDirection: 'row',
    padding: width * 0.03,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: height * 0.01,
  },
  detailText: {
    fontSize: width * 0.035,
    color: '#444',
  },
  image: {
    width: width * 0.08,
    height: width * 0.08,
    marginTop: 0,
    borderRadius: width * 0.02,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  noEntriesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noEntriesText: {
    fontSize: width * 0.045,
    color: '#888',
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
    borderRadius: width * 0.02,
    padding: width * 0.05,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    height: '90%',
  },
  modalImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: height * 0.03,
    right: width * 0.05,
  },
  fab: {
    position: 'absolute',
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.075,
    justifyContent: 'center',
    alignItems: 'center',
    right: width * 0.04,
    bottom: height * 0.02,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: height * 0.005},
    shadowOpacity: 0.25,
    shadowRadius: height * 0.005,
  },
});

export default MonthlyReport;
