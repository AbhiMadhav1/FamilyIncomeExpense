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
import {TextInput} from 'react-native-gesture-handler';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [maxDate, setMaxDate] = useState(new Date());
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

  const filteredIncomeEntries = Object.values(incomeEntries)
    .flat()
    .filter(
      entry =>
        searchQuery === '' ||
        entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.amount.toString() === searchQuery,
    );

  const filteredExpenseEntries = Object.values(expenseEntries)
    .flat()
    .filter(
      entry =>
        searchQuery === '' ||
        entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.amount.toString() === searchQuery,
    );
  const handleSearch = text => {
    setSearchQuery(text);
  };

  const showDatePicker = () => {
    setShowPicker(true);
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() - 1); // Decrease month by 1
    setDate(newDate);
  };

  // Move to next month (disabled when we reach maxDate)
  const goToNextMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + 1);
    setDate(newDate);
  };

  // Disable "Next" if current month is the maxDate month
  const isNextDisabled =
    date.getMonth() === maxDate.getMonth() &&
    date.getFullYear() === maxDate.getFullYear();

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
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #4db6ac;
            color: white;
          }
          tr:hover {
            background-color: #f1f1f1;
          }
          .income {
            background-color: #e8f5e9; /* Light green background */
            padding: 5px;
            border-radius: 5px;
          }
          .expense {
            background-color: #ffebee; /* Light red background */
            padding: 5px;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <h1>${userName}'s Monthly Financial Report</h1>
        <h1>${formattedMonthYear}</h1>
        <div class="summary">
          <p><strong>Total Income (Credit):</strong> ₹ <span class="total-income">${totalIncome}</span></p>
          <p><strong>Total Expense (Debit):</strong> ₹ <span class="total-expense">${totalExpense}</span></p>
          <p><strong>Balance:</strong> ₹ <span class="total-balance">${netBalance}</span></p>
        </div>
        <h2>Entries</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Income (Credit)</th>
              <th>Expense (Debit)</th>
            </tr>
          </thead>
          <tbody>
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

                // Generate HTML for daily income and expense entries
                const incomeEntriesHTML = dailyIncomeEntries
                  .map(
                    entry => `
                    <tr>
                      <td>${date}</td>
                      <td class="income"> ₹ ${parseFloat(entry.amount).toFixed(
                        2,
                      )} - ${entry.description}</td>
                      <td></td>
                    </tr>
                  `,
                  )
                  .join('');

                const expenseEntriesHTML = dailyExpenseEntries
                  .map(
                    entry => `
                    <tr>
                      <td>${date}</td>
                      <td></td>
                      <td class="expense"> ₹ ${parseFloat(entry.amount).toFixed(
                        2,
                      )} - ${entry.description}</td>
                    </tr>
                  `,
                  )
                  .join('');

                return `
                  ${incomeEntriesHTML}
                  ${expenseEntriesHTML}
                `;
              })
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
    let options = {
      html,
      fileName: 'Monthly_Report',
      directory: 'Download',
    };

    try {
      let file = await RNHTMLtoPDF.convert(options);
      console.log('File saved to: ', file.filePath);
      Alert.alert(
        'PDF Download Successful!',
        `File saved to: ${file.filePath}`,
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Could not save PDF. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#00796b', '#20b2aa']} style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth}>
          <Icon name="chevron-back" size={30} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={showDatePicker}>
          <Text style={styles.headerText}>{formattedMonthYear}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextMonth} disabled={isNextDisabled}>
          <Icon
            name="chevron-forward"
            size={30}
            color={isNextDisabled ? 'gray' : 'white'}
          />
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

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#777" style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="Search by description or amount"
          placeholderTextColor="#777"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

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

          {allDates
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(date => {
              const filteredIncome = filteredIncomeEntries.filter(
                entry =>
                  new Date(entry.date).toLocaleDateString('en-GB') === date,
              );
              const filteredExpense = filteredExpenseEntries.filter(
                entry =>
                  new Date(entry.date).toLocaleDateString('en-GB') === date,
              );

              if (!filteredIncome?.length && !filteredExpense?.length)
                return null;

              const dailyIncome = (
                filteredIncome?.reduce(
                  (total, entry) => total + parseFloat(entry.amount || 0),
                  0,
                ) || 0
              ).toFixed(2);

              const dailyExpense = (
                filteredExpense?.reduce(
                  (total, entry) => total + parseFloat(entry.amount || 0),
                  0,
                ) || 0
              ).toFixed(2);

              const dailyBalance = (
                parseFloat(dailyIncome) - parseFloat(dailyExpense)
              ).toFixed(2);

              return (
                <View key={date} style={styles.dateBox}>
                  <Text style={styles.dateTitle}>{date}</Text>
                  <Text style={styles.detailTitle}>
                    Income (Credit) : {formatAmount(dailyIncome)}
                  </Text>
                  {filteredIncome?.map(entry => (
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
                  {filteredExpense?.map(entry => (
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
        <Text style={styles.noResults}>No entries found.</Text>
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
    marginBottom: height * 0.02,
    justifyContent: 'space-between',
    flexDirection: 'row',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    marginBottom: height * 0.02,
    borderRadius: width * 0.03,
    backgroundColor: '#e4f0ef',
    borderWidth: 1,
    borderColor: '#00796b',
  },
  searchIcon: {
    marginLeft: 10, // Adjust positioning
  },
  searchBar: {
    flex: 1,
    height: 40,
    paddingLeft: 5,
    fontSize: 16,
    borderRadius: 8,
  },
  noResults: {
    textAlign: 'center',
    color: '#888',
    fontWeight: 'bold',
    marginTop: 20,
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
