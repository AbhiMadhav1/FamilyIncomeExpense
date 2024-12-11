import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Swipeable} from 'react-native-gesture-handler';

const {height, width} = Dimensions.get('window');

const CalculatorScreen = () => {
  const [input, setInput] = useState('0');
  const [result, setResult] = useState('');
  const [history, setHistory] = useState([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('calculationHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const saveHistory = async newHistory => {
    try {
      await AsyncStorage.setItem(
        'calculationHistory',
        JSON.stringify(newHistory),
      );
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  };

  const handleButtonPress = value => {
    if (value === 'AC') {
      setInput('0');
      setResult('');
    } else if (value === 'C') {
      setInput(input.length > 1 ? input.slice(0, -1) : '0');
    } else if (value === '=') {
      try {
        const evaluationResult = eval(input).toString();
        setResult(evaluationResult);

        const newHistory = [...history, {input, result: evaluationResult}];
        setHistory(newHistory);
        saveHistory(newHistory);
      } catch (error) {
        setResult('Error');
      }
    } else if (['/', '*', '-', '+', '%'].includes(value) && input === '0') {
      setInput(value); // Replace 0 with operator if it's the first input
    } else {
      // Append the value to the input
      setInput(prevInput => (prevInput === '0' ? value : prevInput + value));
    }
  };

  const toggleHistory = () => {
    setIsHistoryVisible(prevState => !prevState);
  };

  const deleteHistoryItem = index => {
    const updatedHistory = history.filter((_, idx) => idx !== index);
    setHistory(updatedHistory);
    saveHistory(updatedHistory);
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem('calculationHistory');
  };

  const renderRightActions = index => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => deleteHistoryItem(index)}>
      <Icon name="delete" size={25} color="#fff" />
    </TouchableOpacity>
  );

  const renderButton = value => {
    const isClearButton = value === 'C' || value === 'AC';
    const isEqualsButton = value === '=';
    const isOperatorButton = ['/', '*', '-', '+', '%'].includes(value);

    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.button,
          isClearButton && styles.clearButton,
          isEqualsButton && styles.equalsButton,
          isOperatorButton && styles.operatorButton,
        ]}
        onPress={() => handleButtonPress(value)}>
        <Text
          style={[
            styles.buttonText,
            isClearButton && styles.clearButtonText,
            isEqualsButton && styles.equalsButtonText,
          ]}>
          {value}
        </Text>
      </TouchableOpacity>
    );
  };

  const buttons = [
    ['AC', 'C', '%', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.displayContainer}>
        <Text style={styles.inputText}>{input}</Text>
        <Text style={styles.resultText}>{result}</Text>
      </View>

      <TouchableOpacity
        style={styles.historyIconContainer}
        onPress={toggleHistory}>
        <Icon name="history" size={28} color="#00796b" />
      </TouchableOpacity>

      <Modal visible={isHistoryVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={toggleHistory}>
              <Icon name="close" size={25} color="#00796b" />
            </TouchableOpacity>
            <Text style={styles.historyTitle}>Calculation History</Text>

            <ScrollView style={styles.historyContainer}>
              {history.length > 0 ? (
                history.map((item, index) => (
                  <Swipeable
                    key={index}
                    renderRightActions={() => renderRightActions(index)}
                    onSwipeableRightOpen={() =>
                      console.log(`Item ${index} swiped`)
                    }
                    friction={2}
                    overshootFriction={8}>
                    <View style={styles.historyItem}>
                      <Text style={styles.historyInputText}>{item.input}</Text>
                      <Text style={styles.historyResultText}>
                        {item.result}
                      </Text>
                    </View>
                  </Swipeable>
                ))
              ) : (
                <Text style={styles.noHistoryText}>No history available</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.clearHistoryButton}
              onPress={clearHistory}>
              <Text style={styles.clearHistoryButtonText}>Clear History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.buttonsContainer}>
        {buttons.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map(renderButton)}
          </View>
        ))}
      </View>
    </View>
  );
};

export default CalculatorScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  displayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    padding: width * 0.04,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  inputText: {
    fontSize: width * 0.08,
    color: '#212121',
  },
  resultText: {
    fontSize: width * 0.09,
    color: '#00796b',
    fontWeight: 'bold',
    marginTop: height * 0.01,
  },
  historyIconContainer: {
    position: 'absolute',
    top: height * 0.01,
    left: width * 0.05,
    backgroundColor: '#e0f2f1',
    padding: width * 0.03,
    borderRadius: 50,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: width * 0.06,
    borderRadius: 12,
    width: '85%',
    height: '80%',
    elevation: 5,
  },
  historyTitle: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#00796b',
    marginBottom: height * 0.02,
    textAlign: 'center',
  },
  historyContainer: {
    flex: 1,
    marginBottom: height * 0.03,
  },
  historyItem: {
    padding: height * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: '#d6d6d6',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyInputText: {
    fontSize: width * 0.05,
    color: '#37474f',
  },
  historyResultText: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#00796b',
  },
  noHistoryText: {
    fontSize: width * 0.045,
    color: '#9e9e9e',
    textAlign: 'center',
    marginTop: height * 0.02,
  },
  clearHistoryButton: {
    backgroundColor: '#ff5252',
    padding: width * 0.04,
    borderRadius: 8,
    alignSelf: 'center',
  },
  clearHistoryButtonText: {
    color: '#ffffff',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: height * 0.01,
    right: width * 0.03,
    backgroundColor: '#e0f2f1',
    padding: width * 0.01,
    borderRadius: 50,
    elevation: 2,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff5252',
    width: 75,
    borderRadius: 8,
  },
  buttonsContainer: {
    flex: 3,
    padding: width * 0.04,
    backgroundColor: '#20b2aa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: height * 0.02,
  },
  button: {
    flex: 1,
    marginHorizontal: width * 0.01,
    backgroundColor: '#00796b',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: (height * 0.2) / 10,
    height: height * 0.08,
    width: width * 0.08, 
    elevation: 3,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: width * 0.06,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#ff5252',
  },
  equalsButton: {
    backgroundColor: '#00c853',
  },
  operatorButton: {
    backgroundColor: '#fdd835',
  },
  clearButtonText: {
    color: '#ffffff',
  },
  equalsButtonText: {
    color: '#ffffff',
  },
});
