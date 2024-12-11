import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import CustomStatusBar from '../components/CustomStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MonthPicker from 'react-native-month-year-picker';

const {width, height} = Dimensions.get('window');

const TotalDetailsScreen = ({route, navigation}) => {
  const {members} = route.params || {};
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [validMembers, setValidMembers] = useState([]);
  const [currentUserName, setCurrentUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(2024, 11));

  // fetchIncomeEntries
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

  // fetchExpenseEntries
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

  const isSameMonthYear = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth()
    );
  };

  // fetchCurrentUser
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const currentUserId = auth().currentUser.uid;
        const userDoc = await firestore()
          .collection('users')
          .doc(currentUserId)
          .get();
        if (userDoc.exists) {
          setCurrentUserName(userDoc.data().name || 'Unnamed User');
        }
      } catch (error) {
        console.error('Error fetching current user data:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // fetchEntries with member avatar image
  const fetchEntries = async () => {
    try {
      if (!members || !Array.isArray(members) || members.length === 0) {
        setValidMembers([]);
        setLoading(false);
        return;
      }
      const validMembersList = members.filter(member => member?.id);
      if (validMembersList.length === 0) {
        setValidMembers([]);
        setLoading(false);
        return;
      }
      let incomeSum = 0;
      let expenseSum = 0;
      const memberCalculations = await Promise.all(
        validMembersList.map(async member => {
          const memberDoc = await firestore()
            .collection('users')
            .doc(member.id)
            .get();

          if (!memberDoc.exists) {
            return {
              memberName: 'Unnamed Member',
              memberIncome: 0,
              memberExpense: 0,
              memberAvatar: '',
            };
          }

          const memberName = memberDoc.data().name || 'Unnamed Member';
          const avatarUrl = memberDoc.data().avatar || ''; // Avatar URL or fallback

          const income = (await fetchIncomeEntries(member.id)).filter(entry =>
            isSameMonthYear(new Date(entry.date), selectedDate),
          );
          const expenses = (await fetchExpenseEntries(member.id)).filter(
            entry => isSameMonthYear(new Date(entry.date), selectedDate),
          );

          const memberIncome = income.reduce(
            (sum, entry) => sum + (entry.amount || 0),
            0,
          );
          const memberExpense = expenses.reduce(
            (sum, entry) => sum + (entry.amount || 0),
            0,
          );
          incomeSum += memberIncome;
          expenseSum += memberExpense;
          return {
            memberName,
            memberIncome,
            memberExpense,
            memberAvatar: avatarUrl || '',
          };
        }),
      );
      setTotalIncome(incomeSum);
      setTotalExpense(expenseSum);
      setValidMembers(memberCalculations);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchEntries();
  }, [members, selectedDate]);

  // formatAmount 2,250
  const formatAmount = amount => {
    if (amount && !isNaN(amount)) {
      let amountString = amount.toString();
      if (amountString.length <= 3) {
        return amountString;
      }
      let lastThreeDigits = amountString.slice(-3);
      let remainingDigits = amountString.slice(0, -3);
      return (
        remainingDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',') +
        ',' +
        lastThreeDigits
      );
    }
    return '0.00';
  };

  // formatdate
  const formatDate = date => {
    const options = {year: 'numeric', month: 'long'};
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };

  // handleMonthPickerChange
  const handleMonthPickerChange = (event, date) => {
    setIsMonthPickerVisible(false);
    if (date) {
      setSelectedDate(date);
      setLoading(true);
    }
  };

  // Refresh data function
  const refreshData = () => {
    setLoading(true);
    fetchEntries();
  };

  return (
    <CustomStatusBar statusBgColor="#00796b">
      <LinearGradient colors={['#00796b', '#20b2aa']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={width * 0.06} color="#fff" />
        </TouchableOpacity>
        <View style={styles.textContainer}>
          <Text style={styles.headerText}>Total Summary</Text>
          <Text style={styles.selectedDateText}>
            {formatDate(selectedDate)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.calendarIcon}
          onPress={() => setIsMonthPickerVisible(true)}>
          <Icon name="calendar" size={width * 0.06} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>
      {isMonthPickerVisible && (
        <MonthPicker
          onChange={handleMonthPickerChange}
          value={selectedDate}
          minimumDate={new Date(2000, 0)}
          maximumDate={new Date(2099, 11)}
        />
      )}
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.summaryContainer}>
            <Text style={styles.incomeExpense}>
              Total Income:{' '}
              <Text style={styles.incomeTotal}>
                {formatAmount(totalIncome)}
              </Text>
            </Text>
            <Text style={styles.incomeExpense}>
              Total Expense:{' '}
              <Text style={styles.expenseTotal}>
                {formatAmount(totalExpense)}
              </Text>
            </Text>
            <Text style={styles.balance}>
              Balance ={' '}
              <Text style={styles.balanceTotal}>
                {formatAmount(totalIncome - totalExpense)}
              </Text>
            </Text>
          </View>
          <View style={styles.familyHeaderContainer}>
            <Text style={styles.subtitle}>Family Members</Text>
            <TouchableOpacity
              style={styles.refreshIconContainer}
              onPress={refreshData}>
              <Icon name="refresh" size={width * 0.06} color="#00796b" />
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00796b" />
            </View>
          ) : validMembers.length === 0 ? (
            <Text style={styles.noDataText}>No valid members data found</Text>
          ) : (
            validMembers.map((member, index) => (
              <View key={index} style={styles.member}>
                {/* Conditional rendering for Avatar or Initials */}
                <View style={styles.avatarContainer}>
                  {member.memberAvatar ? (
                    <Image
                      source={{
                        uri: `data:image/jpeg;base64,${member.memberAvatar}`,
                      }} // Using base64 string
                      style={styles.avatarImage}
                    />
                  ) : (
                    <LinearGradient
                      colors={['#20b2aa', '#3cb371']}
                      style={styles.initialsContainer}>
                      <Text style={styles.initialsText}>
                        {member.memberName
                          .split(' ')
                          .map(name => name.charAt(0).toUpperCase())
                          .join('')}
                      </Text>
                    </LinearGradient>
                  )}
                  <Text style={styles.memberName}>
                    {member.memberName}{' '}
                    {member.memberName === currentUserName ? '(you)' : ''}
                  </Text>
                </View>
                <Text style={styles.memberIncome}>
                  Income: {formatAmount(member.memberIncome)}
                </Text>
                <Text style={styles.memberExpense}>
                  Expense: {formatAmount(member.memberExpense)}
                </Text>
                <Text style={styles.memberTotal}>
                  Total ={' '}
                  {formatAmount(member.memberIncome - member.memberExpense)}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </CustomStatusBar>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: width * 0.04,
  },
  header: {
    height: height * 0.1,
    paddingHorizontal: width * 0.05,
    borderBottomLeftRadius: Platform.OS === 'ios' ? 40 : 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    fontSize: width * 0.055,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  selectedDateText: {
    color: '#fff',
    fontSize: width * 0.04,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: height * 0.005,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: height * 0.02,
  },
  calendarIcon: {
    paddingRight: width * 0.05,
  },
  summaryContainer: {
    padding: width * 0.04,
    borderRadius: width * 0.02,
    backgroundColor: '#E0F2F1',
    marginBottom: height * 0.02,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: height * 0.005},
    shadowOpacity: 0.1,
    shadowRadius: height * 0.005,
  },
  incomeExpense: {
    fontSize: width * 0.045,
    color: '#333',
    fontWeight: 'bold',
    marginVertical: height * 0.005,
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
    fontSize: width * 0.045,
    color: '#388E3C',
    fontWeight: 'bold',
    marginTop: height * 0.015,
    textAlign: 'right',
  },
  balanceTotal: {
    color: '#388E3C',
    fontWeight: 'bold',
  },
  familyHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.01,
  },
  refreshIconContainer: {
    position: 'absolute',
    bottom: height * 0.0,
    right: width * 0.01,
    backgroundColor: '#e0f2f1',
    padding: width * 0.03,
    borderRadius: 50,
    elevation: 5,
  },
  subtitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    marginVertical: height * 0.01,
    color: '#333',
  },
  membersContainer: {
    marginTop: height * 0.02,
  },
  member: {
    borderWidth: 1,
    borderColor: '#00796b',
    padding: width * 0.04,
    borderRadius: width * 0.04,
    marginBottom: height * 0.02,
    backgroundColor: '#F0F4F4',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  avatarImage: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: width * 0.06,
    marginRight: width * 0.03,
    backgroundColor: '#ccc',
    borderWidth: 1,
    borderColor: '#00796b',
  },
  initialsContainer: {
    width: width * 0.12,
    height: width * 0.12,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: width * 0.06,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberName: {
    fontWeight: 'bold',
    fontSize: width * 0.045,
    color: '#333',
    textAlign: 'center',
  },
  avatarPlaceholder: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: width * 0.06,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00796b',
    marginBottom: height * 0.01,
  },
  memberIncome: {
    fontWeight: 'bold',
    fontSize: width * 0.04,
    marginTop: height * 0.01,
    color: '#4CAF50',
  },
  memberExpense: {
    fontWeight: 'bold',
    fontSize: width * 0.04,
    marginTop: height * 0.01,
    color: '#D32F2F',
  },
  memberTotal: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#388E3C',
    textAlign: 'right',
    marginTop: height * 0.01,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: width * 0.04,
    color: '#00796b',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: width * 0.04,
    color: '#D32F2F',
  },
});

export default TotalDetailsScreen;
