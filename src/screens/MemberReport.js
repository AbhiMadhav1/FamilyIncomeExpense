import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Modal,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import CustomStatusBar from '../components/CustomStatusBar';
import MonthPicker from 'react-native-month-year-picker';

const {width, height} = Dimensions.get('window');
const scale = size => (width / 375) * size;
const verticalScale = size => (height / 667) * size;

const MemberReport = ({route}) => {
  const {memberData, avatar} = route.params || {};
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('monthly');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const handleImagePress = imageUri => {
    setSelectedImage(imageUri);
    setModalVisible(true);
  };

  const fetchEntries = async () => {
    try {
      const income = await fetchIncomeEntries(memberData.userId);
      const expenses = await fetchExpenseEntries(memberData.userId);

      const groupedData = groupEntriesByMonth([...income, ...expenses]);
      setEntries(groupedData);
    } catch (error) {
      Alert.alert('Error fetching data', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const months = [
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

  const formatMonthYear = dateString => {
    const date = new Date(dateString);
    const month = date.getMonth();
    const year = date.getFullYear();
    return {month, year, formatted: `${month + 1}-${year}`};
  };

  const groupEntriesByMonth = entries => {
    const grouped = entries.reduce((acc, entry) => {
      const {month, year, formatted} = formatMonthYear(entry.date);
      if (!acc[formatted]) {
        acc[formatted] = {title: `${months[month]} ${year}`, data: []};
      }
      acc[formatted].data.push(entry);
      return acc;
    }, {});

    // Sort the groups by year, then month (both in ascending order)
    const sortedGrouped = Object.values(grouped).sort((a, b) => {
      const [monthA, yearA] = a.title.split(' ');
      const [monthB, yearB] = b.title.split(' ');

      const yearDiff = parseInt(yearA) - parseInt(yearB);
      if (yearDiff !== 0) {
        return yearDiff;
      }

      const monthDiff = months.indexOf(monthA) - months.indexOf(monthB);
      return monthDiff;
    });

    // Sort entries within each group by date
    sortedGrouped.forEach(group => {
      group.data.sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    return sortedGrouped;
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const fetchIncomeEntries = async userId => {
    const incomeSnapshot = await firestore()
      .collection('incomeEntries')
      .where('userId', '==', userId)
      .get();

    return incomeSnapshot.docs.map(doc => ({
      id: doc.id,
      type: 'income',
      ...doc.data(),
    }));
  };

  const fetchExpenseEntries = async userId => {
    const expenseSnapshot = await firestore()
      .collection('expenseEntries')
      .where('userId', '==', userId)
      .get();

    return expenseSnapshot.docs.map(doc => ({
      id: doc.id,
      type: 'expense',
      ...doc.data(),
    }));
  };

  useEffect(() => {
    if (memberData) {
      fetchEntries();
    }
  }, [memberData]);

  const toggleMonthPicker = () => {
    setShowMonthPicker(!showMonthPicker);
  };

  // Format the selected date to "November 2024"
  const formatMonth = date => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const handleMonthChange = (event, newDate) => {
    if (event === 'dismissed') {
      setShowMonthPicker(false);
    } else if (newDate) {
      // Ensure newDate is valid
      setSelectedMonth(newDate);
      setShowMonthPicker(false);
    }
  };

  const filteredEntries = selectedMonth
    ? entries.filter(entryGroup => {
        return (
          entryGroup.title ===
          `${months[selectedMonth.getMonth()]} ${selectedMonth.getFullYear()}`
        );
      })
    : [];
  useEffect(() => {
    // Reset the month picker visibility when the view mode changes
    if (viewMode !== 'monthly') {
      setShowMonthPicker(false);
    }
  }, [viewMode]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEntries();
  };

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#00796b" />
      </View>
    );
  }

  const renderContent = () => {
    switch (viewMode) {
      case 'monthly':
        return renderMonthlyContent();
      case 'yearly':
        return renderYearlyContent();
      default:
        return null;
    }
  };

  const renderMonthlyContent = () => {
    return (
      <>
        <LinearGradient colors={['#00796b', '#20b2aa']} style={styles.header}>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={toggleMonthPicker}>
            <Text style={styles.calendarText}>
              {`${formatMonth(selectedMonth)}`}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {showMonthPicker && (
          <MonthPicker
            onChange={handleMonthChange}
            value={selectedMonth}
            locale="en"
            minimumDate={new Date(2000, 0)}
            maximumDate={new Date(2100, 11)}
          />
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              colors={['#00796b']}
              tintColor="#00796b"
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }>
          {filteredEntries.length === 0 ? (
            <Text style={styles.noEntriesText}>
              No entries available for the selected month.
            </Text>
          ) : (
            filteredEntries.map((entryGroup, index) => {
              const {title, data} = entryGroup;
              let monthlyIncome = 0;
              let monthlyExpense = 0;
              const incomeEntries = [];
              const expenseEntries = [];

              data.forEach(entry => {
                if (entry.type === 'income') {
                  monthlyIncome += parseFloat(entry.amount);
                  incomeEntries.push(entry);
                } else {
                  monthlyExpense += parseFloat(entry.amount);
                  expenseEntries.push(entry);
                }
              });

              const totalBalance = monthlyIncome - monthlyExpense;

              return (
                <View key={index} style={styles.dateBox}>
                  <Text style={styles.dateTitle}>{title}</Text>

                  {/* Display monthly income, expense, and total balance */}
                  <Text style={styles.detailTitle}>
                    Income (Credit): {monthlyIncome}
                  </Text>
                  {incomeEntries.map(entry => (
                    <View key={entry.id} style={styles.entryContainer}>
                      <Text style={styles.detailText}>
                        ₹ {entry.amount} - {entry.source} {entry.description}
                      </Text>
                      <Text style={styles.dateText}>
                        Date: {formatDate(entry.date)}
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
                    Expense (Debit): {monthlyExpense}
                  </Text>
                  {expenseEntries.map(entry => (
                    <View key={entry.id} style={styles.entryContainer}>
                      <Text style={styles.detailText}>
                        ₹ {entry.amount} - {entry.expenseCategory}{' '}
                        {entry.description}
                      </Text>
                      <Text style={styles.dateText}>
                        Date: {formatDate(entry.date)}
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

                  {/* Display the total balance for the month */}
                  <Text style={styles.balance}>Total = {totalBalance}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
      </>
    );
  };

  const renderYearlyContent = () => {
    const yearlyEntries = entries.reduce((acc, entryGroup) => {
      const {title, data} = entryGroup;
      const [monthName, year] = title.split(' ');

      if (!acc[year]) {
        acc[year] = Array(12)
          .fill(null)
          .map(() => ({income: 0, expense: 0}));
      }

      const monthIndex = months.indexOf(monthName);
      if (monthIndex !== -1) {
        data.forEach(entry => {
          if (entry.type === 'income') {
            acc[year][monthIndex].income += parseFloat(entry.amount);
          } else if (entry.type === 'expense') {
            acc[year][monthIndex].expense += parseFloat(entry.amount);
          }
        });
      }

      return acc;
    }, {});

    return (
      <>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              colors={['#00796b']}
              tintColor="#00796b"
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }>
          {Object.keys(yearlyEntries).length === 0 ? (
            <Text style={styles.noEntriesText}>
              No entries available for this member.
            </Text>
          ) : (
            Object.keys(yearlyEntries)
              .sort((a, b) => a - b)
              .map(year => {
                const filteredMonths = yearlyEntries[year]
                  .map((monthData, index) => ({
                    ...monthData,
                    monthName: months[index],
                  }))
                  .filter(
                    monthData => monthData.income > 0 || monthData.expense > 0,
                  );

                if (filteredMonths.length === 0) return null;

                return (
                  <View key={year} style={styles.yearBox}>
                    <Text style={styles.yearTitle}>{year}</Text>
                    <View style={styles.row}>
                      <Text style={styles.rowHeader}>Month</Text>
                      <Text style={styles.rowHeader}>Income</Text>
                      <Text style={styles.rowHeader}>Expense</Text>
                      <Text style={styles.rowHeader}>Balance</Text>
                    </View>
                    {filteredMonths.map((monthData, index) => (
                      <View key={index} style={styles.row}>
                        <Text style={styles.rowItem}>
                          {monthData.monthName}
                        </Text>
                        <Text style={styles.rowItem}>
                          {monthData.income.toFixed(2)}
                        </Text>
                        <Text style={styles.rowItem}>
                          {monthData.expense.toFixed(2)}
                        </Text>
                        <Text style={styles.rowItem}>
                          {(monthData.income - monthData.expense).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })
          )}
        </ScrollView>
      </>
    );
  };
  return (
    <CustomStatusBar statusBgColor="#00796b">
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#00796b', '#20b2aa']}
          style={styles.headerContainer}>
          <View style={styles.headerRow}>
            {/* Back button on the left */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Dashboard')}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Title centered */}
            <Text style={styles.headerTitle}>{memberData.name}</Text>
          </View>

          {/* Tabs for Monthly and Yearly */}
          <View style={styles.tabContainer}>
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
        {/* Render content below the header */}
        {renderContent()}
      </SafeAreaView>
    </CustomStatusBar>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  headerContainer: {
    paddingVertical: verticalScale(15),
    paddingHorizontal: scale(15),
    backgroundColor: '#00796b',
    elevation: 3,
    flexDirection: 'column',
    alignItems: 'center',
    borderBottomLeftRadius: Platform.OS === 'ios' ? 30 : 30,
    borderBottomRightRadius: Platform.OS === 'ios' ? 0 : 0,
    marginBottom: verticalScale(10),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    alignItems: 'flex-start',
    padding: scale(5),
  },
  headerTitle: {
    fontSize: scale(20),
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: verticalScale(15),
  },
  tab: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    borderRadius: scale(20),
    top: verticalScale(10),
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: verticalScale(2)},
    shadowOpacity: 0.25,
    shadowRadius: scale(3.84),
    elevation: 5,
  },
  tabText: {
    fontSize: scale(16),
    color: '#000',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00796b',
    padding: scale(15),
    marginHorizontal: scale(15),
    marginBottom: verticalScale(10),
    borderRadius: scale(8),
    elevation: 3,
  },
  calendarText: {
    color: '#ffffff',
    fontSize: scale(22),
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(15),
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(16),
  },
  yearBox: {
    marginBottom: verticalScale(20),
    padding: scale(16),
    backgroundColor: '#f9f9f9',
    borderRadius: scale(8),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: scale(1)},
    shadowOpacity: 0.2,
    shadowRadius: scale(1),
    elevation: 3,
  },
  yearTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#00796b',
    marginBottom: verticalScale(10),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(5),
  },
  rowHeader: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: scale(16),
    color: '#333',
    paddingVertical: verticalScale(8),
  },
  rowItem: {
    flex: 1,
    textAlign: 'center',
    fontSize: scale(14),
    color: '#555',
    paddingVertical: verticalScale(6),
  },
  noEntriesText: {
    fontSize: scale(16),
    textAlign: 'center',
    color: '#999',
    marginTop: verticalScale(20),
  },
  dateBox: {
    borderWidth: 1,
    borderColor: '#00796b',
    padding: scale(15),
    borderRadius: scale(10),
    marginBottom: verticalScale(15),
    backgroundColor: '#f9f9f9',
  },
  dateTitle: {
    fontWeight: 'bold',
    fontSize: scale(18),
    marginBottom: verticalScale(10),
    color: '#000',
    textAlign: 'center',
  },
  detailTitle: {
    fontWeight: 'bold',
    fontSize: scale(16),
    color: '#00796b',
    marginTop: verticalScale(10),
  },
  entryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(5),
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: verticalScale(5),
  },
  detailText: {
    fontSize: scale(14),
    color: '#444',
  },
  image: {
    width: scale(50),
    height: scale(50),
    marginLeft: scale(10),
  },
  balance: {
    fontWeight: 'bold',
    color: '#388E3C',
    textAlign: 'right',
    marginTop: verticalScale(10),
    fontSize: scale(17),
  },
  dateText: {
    fontSize: scale(12),
    color: '#888',
    marginTop: verticalScale(5),
    fontStyle: 'italic',
    fontWeight: 'bold',
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
    borderRadius: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    height: '90%',
  },
  modalImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
    borderRadius: scale(20),
  },
  closeButton: {
    position: 'absolute',
    top: scale(20),
    right: scale(20),
  },
});

export default MemberReport;
