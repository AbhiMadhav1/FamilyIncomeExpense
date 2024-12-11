import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import MonthPicker from 'react-native-month-year-picker';

const MonthlyHeader = ({ balance }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  const getFormattedDate = (date) => {
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return { month, year };
  };

  const { month, year } = getFormattedDate(currentDate);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date) => {
    setCurrentDate(date);
    setHasNavigated(false);
    hideDatePicker();
  };

  const goToPreviousDate = () => {
    const previousDate = new Date(currentDate);
    previousDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(previousDate);
    setHasNavigated(true);
  };

  const goToNextDate = () => {
    const nextDate = new Date(currentDate);
    nextDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(nextDate);
    setHasNavigated(true);
  };

  useEffect(() => {
    const today = new Date();
    if (
      currentDate.getFullYear() === today.getFullYear() &&
      currentDate.getMonth() === today.getMonth()
    ) {
      setHasNavigated(false);
    }
  }, [currentDate]);

  const isThisMonth = () => {
    const today = new Date();
    return (
      currentDate.getFullYear() === today.getFullYear() &&
      currentDate.getMonth() === today.getMonth()
    );
  };

  return (
    <LinearGradient
      colors={['#00796b', '#20b2aa']}
      style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={goToPreviousDate}>
        <Icon name="chevron-back" size={25} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.dateSection} onPress={showDatePicker}>
        <View style={[styles.dateBox, isThisMonth() ? styles.defaultBorder : styles.noBorder]}>
          <Text style={styles.monthText}>{month} {year}</Text>
        </View>
      </TouchableOpacity>

      {hasNavigated && (
        <TouchableOpacity style={styles.nextButton} onPress={goToNextDate}>
          <Icon name="chevron-forward" size={25} color="#fff" />
        </TouchableOpacity>
      )}

      {isDatePickerVisible && (
        <MonthPicker
          value={currentDate}  // Pass the value prop correctly
          onMonthYearChange={handleConfirm}
          onCancel={hideDatePicker}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00796b',
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 8,
    margin: 0,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  backButton: {
    paddingRight: 10,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    flex: 1,
  },
  dateBox: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 5,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  defaultBorder: {
    borderColor: '#fff',
  },
  noBorder: {
    borderWidth: 0,
  },
  monthText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  nextButton: {
    paddingLeft: 10,
  },
});

export default MonthlyHeader;
