import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import MonthPicker from 'react-native-month-year-picker';
import LinearGradient from 'react-native-linear-gradient';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Icon from 'react-native-vector-icons/Ionicons';

const {width, height} = Dimensions.get('window');
const scale = size => (width / 375) * size;
const verticalScale = size => (height / 667) * size;

const YearlyReport = ({userId}) => {
  const [incomeEntries, setIncomeEntries] = useState({});
  const [expenseEntries, setExpenseEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pdfLoader, setPdfLoader] = useState(false);
  const [userName, setUserName] = useState('');

  const selectedYear = selectedDate.getFullYear();

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

        // Rest of your existing code...

        // Save userName in state for use in PDF generation
        setUserName(userName);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [selectedYear, userId]);

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

        const incomeData = incomeSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        const expenseData = expenseSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filteredIncome = incomeData.filter(entry => {
          const entryYear = new Date(entry.date).getFullYear();
          return entryYear === selectedYear;
        });

        const filteredExpense = expenseData.filter(entry => {
          const entryYear = new Date(entry.date).getFullYear();
          return entryYear === selectedYear;
        });

        const groupedIncome = filteredIncome.reduce((acc, entry) => {
          const entryMonth = new Date(entry.date).toLocaleString('default', {
            month: 'long',
          });
          acc[entryMonth] = acc[entryMonth] || [];
          acc[entryMonth].push(entry);
          return acc;
        }, {});

        const groupedExpense = filteredExpense.reduce((acc, entry) => {
          const entryMonth = new Date(entry.date).toLocaleString('default', {
            month: 'long',
          });
          acc[entryMonth] = acc[entryMonth] || [];
          acc[entryMonth].push(entry);
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
  }, [selectedYear, userId]);

  const totalIncome = Object.values(incomeEntries)
    .flat()
    .reduce((total, entry) => total + parseFloat(entry.amount || 0), 0)
    .toFixed(2);

  const totalExpense = Object.values(expenseEntries)
    .flat()
    .reduce((total, entry) => total + parseFloat(entry.amount || 0), 0)
    .toFixed(2);

  const netBalance = (totalIncome - totalExpense).toFixed(2);
  const formattedYear = `${selectedYear}`;

  const monthOrder = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const allMonths = Array.from(
    new Set([...Object.keys(incomeEntries), ...Object.keys(expenseEntries)]),
  ).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

  const showDatePicker = () => {
    setShowPicker(true);
  };

  const onChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const hasEntries =
    Object.keys(incomeEntries).length > 0 ||
    Object.keys(expenseEntries).length > 0;

  const generateAndSavePDF = async () => {
    const htmlContent = `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f4f4f4;
          color: black; /* Set default text color to black */
        }
        h1 {
          text-align: center;
          color: black; /* Heading color */
        }
        h2 {
          text-align: center;
          color: black; /* Heading color */
        }
        h3 {
          text-align: center;
          color: black; /* Heading color */
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #00796b;
          color: white;
          padding: 10px;
        }
        th, td {
          border: 1px solid #ccc;
          text-align: center;
          padding: 10px;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .total {
          font-weight: bold;
          background-color: #20b2aa;
          color: black; /* Set total row text color to black */
        }
        .no-entries {
          text-align: center;
          margin: 20px;
          font-size: 18px;
          color: #f44336;
        }
      </style>
    </head>
    <body>
      <h1>${userName}'s Yearly Financial Report</h1>
      <h2>${formattedYear}</h2>
      <h3>Total Income: ${totalIncome}</h3>
      <h3>Total Expense: ${totalExpense}</h3>
      <h3>Net Balance: ${netBalance}</h3>
      <table>
        <tr>
          <th>Month</th>
          <th>Income</th>
          <th>Expense</th>
          <th>Balance</th>
        </tr>
        ${allMonths
          .map(month => {
            const monthlyIncome =
              incomeEntries[month]
                ?.reduce(
                  (total, entry) => total + parseFloat(entry.amount || 0),
                  0,
                )
                .toFixed(2) || '0.00';

            const monthlyExpense =
              expenseEntries[month]
                ?.reduce(
                  (total, entry) => total + parseFloat(entry.amount || 0),
                  0,
                )
                .toFixed(2) || '0.00';

            const monthlyBalance = (monthlyIncome - monthlyExpense).toFixed(2);

            return `
            <tr>
              <td>${month}</td>
              <td>${monthlyIncome}</td>
              <td>${monthlyExpense}</td>
              <td>${monthlyBalance}</td>
            </tr>
          `;
          })
          .join('')}
        <!-- Totals Row -->
        <tr class="total">
          <td>Total</td>
          <td>${totalIncome}</td>
          <td>${totalExpense}</td>
          <td>${netBalance}</td>
        </tr>
      </table>
      ${
        !hasEntries
          ? '<p class="no-entries">No entries found for this year.</p>'
          : ''
      }
    </body>
  </html>
        `;

    const options = {
      html: htmlContent,
      fileName: `YearlyReport_${selectedYear}`,
      directory: 'Documents', // Saves the PDF to the Documents directory
    };

    setPdfLoader(true);
    try {
      const file = await RNHTMLtoPDF.convert(options);
      Alert.alert('PDF saved!', `File saved to: ${file.filePath}`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setPdfLoader(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#00796b', '#20b2aa']} style={styles.header}>
        <TouchableOpacity onPress={showDatePicker}>
          <Text style={styles.headerText}>{formattedYear}</Text>
        </TouchableOpacity>
      </LinearGradient>

      {showPicker && (
        <MonthPicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onChange}
          maximumDate={new Date()}
        />
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#00796b" />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailContainer}>
          <View style={styles.row}>
            <Text style={styles.rowHeader}>Month</Text>
            <Text style={styles.rowHeader}>Income</Text>
            <Text style={styles.rowHeader}>Expense</Text>
            <Text style={styles.rowHeader}>Balance</Text>
          </View>

          {hasEntries ? (
            allMonths.map(month => {
              const monthlyIncome =
                incomeEntries[month]
                  ?.reduce(
                    (total, entry) => total + parseFloat(entry.amount || 0),
                    0,
                  )
                  .toFixed(2) || '0.00';

              const monthlyExpense =
                expenseEntries[month]
                  ?.reduce(
                    (total, entry) => total + parseFloat(entry.amount || 0),
                    0,
                  )
                  .toFixed(2) || '0.00';

              const monthlyBalance = (monthlyIncome - monthlyExpense).toFixed(
                2,
              );
              return (
                <View key={month} style={styles.row}>
                  <Text style={styles.rowText}>{month}</Text>
                  <Text style={styles.monthlyBalance}>{monthlyIncome}</Text>
                  <Text style={styles.monthlyExpense}>{monthlyExpense}</Text>
                  <Text style={styles.rowText}>{monthlyBalance}</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.noEntriesText}>
              No entries found for this year.
            </Text>
          )}
        </ScrollView>
      )}
      <LinearGradient colors={['#00796b', '#20b2aa']} style={styles.fab}>
        <TouchableOpacity onPress={generateAndSavePDF} disabled={loading}>
          {pdfLoader ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Icon name="download-outline" size={30} color="#fff" />
          )}
        </TouchableOpacity>
      </LinearGradient>
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
    padding: verticalScale(12),
    borderRadius: scale(8),
    marginBottom: verticalScale(10),
    alignItems: 'center',
    elevation: 5,
  },
  headerText: {
    fontSize: scale(24),
    fontWeight: 'bold',
    color: '#fff',
  },
  detailContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: verticalScale(10),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  rowHeader: {
    fontWeight: 'bold',
    fontSize: scale(16),
    flex: 1,
    textAlign: 'center',
    color: '#333',
  },
  rowText: {
    fontSize: scale(16),
    flex: 1,
    textAlign: 'center',
    color: '#333',
  },
  monthlyBalance: {
    fontSize: scale(16),
    flex: 1,
    textAlign: 'center',
    color: '#388E3C',
  },
  monthlyExpense: {
    fontSize: scale(16),
    flex: 1,
    textAlign: 'center',
    color: '#D32F2F',
  },
  noEntriesText: {
    textAlign: 'center',
    fontSize: scale(18),
    color: '#888',
    marginTop: verticalScale(20),
    margin: scale(10),
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

export default YearlyReport;
