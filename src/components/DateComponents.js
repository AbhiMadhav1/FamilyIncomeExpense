import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import LinearGradient from 'react-native-linear-gradient';

const {width, height} = Dimensions.get('window');

const HeaderComponent = ({balance, onDateChange}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  const getFormattedDate = date => {
    const day = date.getDate();
    const month = date.toLocaleString('default', {month: 'long'});
    const year = date.getFullYear();
    const weekday = date.toLocaleString('default', {weekday: 'long'});
    return {day, month, year, weekday};
  };

  const {day, month, year, weekday} = getFormattedDate(currentDate);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = date => {
    setCurrentDate(date);
    setHasNavigated(false);
    hideDatePicker();
    onDateChange(date);
  };

  const goToPreviousDate = () => {
    const previousDate = new Date(currentDate);
    previousDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(previousDate);
    setHasNavigated(true);
    onDateChange(previousDate);
  };

  const goToNextDate = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(nextDate);
    setHasNavigated(true);
    onDateChange(nextDate);
  };

  useEffect(() => {
    const today = new Date();
    if (
      currentDate.getFullYear() === today.getFullYear() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getDate() === today.getDate()
    ) {
      setHasNavigated(false);
    }
  }, [currentDate]);

  const isToday = () => {
    const today = new Date();
    return (
      currentDate.getFullYear() === today.getFullYear() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getDate() === today.getDate()
    );
  };

  return (
    <LinearGradient colors={['#00796b', '#20b2aa']} style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={goToPreviousDate}>
        <Icon name="chevron-back" size={25} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.dateSection} onPress={showDatePicker}>
        <View
          style={[
            styles.dateBox,
            isToday() ? styles.defaultBorder : styles.noBorder,
          ]}>
          <Text style={styles.dateDay}>{day < 10 ? `0${day}` : day}</Text>
        </View>
        <View style={styles.dateDetails}>
          <Text style={styles.monthText}>
            {month}, {year}
          </Text>
          <Text style={styles.weekdayText}>{weekday}</Text>
        </View>
      </TouchableOpacity>
      <View>
        <Text style={styles.balanceText}>Balance</Text>
        <Text style={styles.balanceText}>₹ {balance.toFixed(2)}</Text>
      </View>
      {hasNavigated && (
        <TouchableOpacity style={styles.nextButton} onPress={goToNextDate}>
          <Icon name="chevron-forward" size={25} color="#fff" />
        </TouchableOpacity>
      )}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        date={currentDate}
        customHeaderComponent={
          <View style={styles.customHeader}>
            <Text style={styles.customHeaderText}>
              {currentDate.toDateString()}
            </Text>
            <TouchableOpacity onPress={showDatePicker}>
              <Text style={styles.changeDateText}>Change Date</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: width * 0.02,
    borderRadius: 8,
    margin: 0,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  backButton: {
    paddingRight: width * 0.01,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateBox: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 5,
    padding: width * 0.02,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.02,
  },
  defaultBorder: {
    borderColor: '#fff',
  },
  noBorder: {
    borderWidth: 0,
  },
  dateDay: {
    fontSize: width * 0.06,
    color: '#fff',
    fontWeight: 'bold',
  },
  dateDetails: {
    flexDirection: 'column',
  },
  monthText: {
    fontSize: width * 0.04,
    color: '#fff',
    fontWeight: 'bold',
  },
  weekdayText: {
    fontSize: width * 0.035,
    color: '#fff',
    fontWeight: 'bold',
  },
  balanceText: {
    color: '#fff',
    fontSize: width * 0.04,
    fontWeight: 'bold',
    paddingLeft: width * 0.03,
  },
  nextButton: {
    paddingLeft: width * 0.03,
  },
  customHeader: {
    backgroundColor: '#00796b',
    padding: width * 0.05,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customHeaderText: {
    fontSize: width * 0.05,
    color: '#fff',
    fontWeight: 'bold',
  },
  changeDateText: {
    color: '#fff',
    fontSize: width * 0.04,
  },
});

export default HeaderComponent;
