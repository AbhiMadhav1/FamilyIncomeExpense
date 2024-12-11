import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import LinearGradient from 'react-native-linear-gradient';

const YearlyHeader = ({ balance }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  const getFormattedDate = (date) => {
    const year = date.getFullYear();
    return { year };
  };

  const { year } = getFormattedDate(currentDate);

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
    previousDate.setFullYear(currentDate.getFullYear() - 1); 
    setCurrentDate(previousDate);
    setHasNavigated(true);
  };

  const goToNextDate = () => {
    const nextDate = new Date(currentDate);
    nextDate.setFullYear(currentDate.getFullYear() + 1); 
    setCurrentDate(nextDate);
    setHasNavigated(true);
  };

  useEffect(() => {
    const today = new Date();
    if (currentDate.getFullYear() === today.getFullYear()) {
      setHasNavigated(false);
    }
  }, [currentDate]);

  const isThisYear = () => {
    const today = new Date();
    return currentDate.getFullYear() === today.getFullYear();
  };

  return (
    <LinearGradient
      colors={['#00796b', '#20b2aa']}
      style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={goToPreviousDate}>
        <Icon name="chevron-back" size={25} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.dateSection} onPress={showDatePicker}>
        <View style={[styles.dateBox, isThisYear() ? styles.defaultBorder : styles.noBorder]}>
          <Text style={styles.yearText}>{year}</Text>
        </View>
      </TouchableOpacity>

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
        display="spinner"
        minimumDate={new Date(2000, 0, 1)} 
        maximumDate={new Date(2100, 11, 31)}
      />
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
    marginBottom: 15,
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
  yearText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  nextButton: {
    paddingLeft: 10,
    
  },
});

export default YearlyHeader;
